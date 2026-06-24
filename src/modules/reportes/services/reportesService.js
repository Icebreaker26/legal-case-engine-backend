import pool from '../../../db/database.js';

const buildDateFilter = (campo, desde, hasta, params) => {
  let sql = '';
  if (desde) { params.push(desde); sql += ` AND ${campo} >= $${params.length}`; }
  if (hasta) { params.push(hasta); sql += ` AND ${campo} <= $${params.length}`; }
  return sql;
};

const queryPagos = async (f) => {
  const p = [];
  let w = 'WHERE pa.is_active = true';
  if (f.acreedor_id) { p.push(f.acreedor_id); w += ` AND pa.acreedor_id = $${p.length}`; }
  if (f.proyecto_id) { p.push(f.proyecto_id); w += ` AND pa.proyecto_id = $${p.length}`; }
  if (f.responsable_uuid) { p.push(f.responsable_uuid); w += ` AND pa.solicitante_uuid = $${p.length}`; }
  if (f.estado) { p.push(f.estado); w += ` AND pa.estado = $${p.length}`; }
  w += buildDateFilter('pa.fecha_solicitud', f.fecha_desde, f.fecha_hasta, p);

  const { rows } = await pool.query(`
    SELECT pa.id::text, pa.concepto as titulo, pa.estado, pa.fecha_solicitud as fecha,
           pa.monto,
           ga.nombre as entidad, gp.nombre as proyecto,
           gu.nombre as responsable, 'pagos' as modulo
    FROM pagos pa
    LEFT JOIN global_acreedores ga ON pa.acreedor_id = ga.id
    LEFT JOIN global_proyectos gp ON pa.proyecto_id = gp.id
    LEFT JOIN global_usuarios gu ON pa.solicitante_uuid = gu.id
    ${w}
    ORDER BY pa.fecha_solicitud DESC
  `, p);
  return rows;
};

const queryComunicaciones = async (f) => {
  const p = [];
  let w = 'WHERE c.is_active = true';
  if (f.entidad_id) { p.push(f.entidad_id); w += ` AND c.entidad_id = $${p.length}`; }
  if (f.grupo_id) { p.push(f.grupo_id); w += ` AND EXISTS (SELECT 1 FROM comunicacion_grupos cg WHERE cg.comunicacion_id = c.id AND cg.grupo_id = $${p.length})`; }
  if (f.responsable_uuid) { p.push(f.responsable_uuid); w += ` AND c.responsable_uuid = $${p.length}`; }
  if (f.estado) { p.push(f.estado); w += ` AND c.estado = $${p.length}`; }
  w += buildDateFilter('c.fecha_recepcion', f.fecha_desde, f.fecha_hasta, p);

  const { rows } = await pool.query(`
    SELECT c.id::text, c.asunto as titulo, c.estado, c.fecha_recepcion as fecha,
           NULL::numeric as monto,
           ge.nombre as entidad, NULL as proyecto,
           gu.nombre as responsable, 'comunicaciones' as modulo
    FROM comunicaciones c
    LEFT JOIN global_entidades ge ON c.entidad_id = ge.id
    LEFT JOIN global_usuarios gu ON c.responsable_uuid = gu.id
    ${w}
    ORDER BY c.fecha_recepcion DESC
  `, p);
  return rows;
};

const queryConformidades = async (f) => {
  const p = [];
  let w = 'WHERE cf.is_active = true';
  if (f.entidad_id) { p.push(f.entidad_id); w += ` AND cf.entidad_id = $${p.length}`; }
  if (f.proyecto_id) { p.push(f.proyecto_id); w += ` AND cf.proyecto_id = $${p.length}`; }
  if (f.contrato_id) { p.push(f.contrato_id); w += ` AND cf.contrato_id = $${p.length}`; }
  if (f.responsable_uuid) { p.push(f.responsable_uuid); w += ` AND cf.responsable_uuid = $${p.length}`; }
  if (f.estado) { p.push(f.estado); w += ` AND cf.estado = $${p.length}`; }
  w += buildDateFilter('cf.fecha_solicitud', f.fecha_desde, f.fecha_hasta, p);

  const { rows } = await pool.query(`
    SELECT cf.id::text, cf.concepto as titulo, cf.estado, cf.fecha_solicitud as fecha,
           cf.valor as monto,
           ge.nombre as entidad, gp.nombre as proyecto,
           gu.nombre as responsable, 'conformidades' as modulo
    FROM conformidades cf
    LEFT JOIN global_entidades ge ON cf.entidad_id = ge.id
    LEFT JOIN global_proyectos gp ON cf.proyecto_id = gp.id
    LEFT JOIN global_usuarios gu ON cf.responsable_uuid = gu.id
    ${w}
    ORDER BY cf.fecha_solicitud DESC
  `, p);
  return rows;
};

const queryTutelas = async (f) => {
  const p = [];
  let w = 'WHERE t.is_active = true';
  if (f.grupo_id) { p.push(f.grupo_id); w += ` AND t.grupo_id = $${p.length}`; }
  if (f.responsable_uuid) { p.push(f.responsable_uuid); w += ` AND t.responsable_uuid = $${p.length}`; }
  if (f.estado) { p.push(f.estado); w += ` AND t.estado = $${p.length}`; }
  w += buildDateFilter('t.fecha_recepcion', f.fecha_desde, f.fecha_hasta, p);

  const { rows } = await pool.query(`
    SELECT t.id::text, COALESCE(t.radicado, t.accionante) as titulo, t.estado,
           t.fecha_recepcion as fecha,
           NULL::numeric as monto,
           NULL as entidad, gg.nombre as proyecto,
           gu.nombre as responsable, 'tutelas' as modulo
    FROM tutelas t
    LEFT JOIN global_grupos gg ON t.grupo_id = gg.id
    LEFT JOIN global_usuarios gu ON t.responsable_uuid = gu.id
    ${w}
    ORDER BY t.fecha_recepcion DESC
  `, p);
  return rows;
};

const queryAmbiental = async (f) => {
  const p = [];
  let w = 'WHERE ea.is_active = true';
  if (f.entidad_id) { p.push(f.entidad_id); w += ` AND ea.entidad_id = $${p.length}`; }
  if (f.grupo_id) { p.push(f.grupo_id); w += ` AND ea.grupo_id = $${p.length}`; }
  if (f.responsable_uuid) { p.push(f.responsable_uuid); w += ` AND ea.responsable_uuid = $${p.length}`; }
  if (f.estado) { p.push(f.estado); w += ` AND ea.estado = $${p.length}`; }
  w += buildDateFilter('ea.fecha_documento', f.fecha_desde, f.fecha_hasta, p);

  const { rows } = await pool.query(`
    SELECT ea.id::text, COALESCE(ea.titulo, ea.numero_expediente) as titulo, ea.estado,
           ea.fecha_documento as fecha,
           NULL::numeric as monto,
           ge.nombre as entidad, gg.nombre as proyecto,
           gu.nombre as responsable, 'ambiental' as modulo
    FROM expedientes_ambientales ea
    LEFT JOIN global_entidades ge ON ea.entidad_id = ge.id
    LEFT JOIN global_grupos gg ON ea.grupo_id = gg.id
    LEFT JOIN global_usuarios gu ON ea.responsable_uuid = gu.id
    ${w}
    ORDER BY ea.fecha_documento DESC
  `, p);
  return rows;
};

const queryContratos = async (f) => {
  const p = [];
  let w = 'WHERE 1=1';
  if (f.entidad_id) { p.push(f.entidad_id); w += ` AND ra.tercero_id = $${p.length}`; }
  if (f.estado) { p.push(f.estado); w += ` AND ra.estado_seguimiento = $${p.length}`; }
  w += buildDateFilter('ra.created_at', f.fecha_desde, f.fecha_hasta, p);

  const { rows } = await pool.query(`
    SELECT ra.id::text, me.titulo as titulo, ra.estado_seguimiento as estado,
           ra.created_at::date as fecha,
           NULL::numeric as monto,
           ge.nombre as entidad, NULL as proyecto,
           gu.nombre as responsable, 'contratos' as modulo
    FROM registros_auditoria ra
    JOIN minutas_estandar me ON ra.minuta_estandar_id = me.id
    LEFT JOIN global_entidades ge ON ra.tercero_id = ge.id
    LEFT JOIN global_usuarios gu ON ra.creado_por = gu.id
    ${w}
    ORDER BY ra.created_at DESC
  `, p);
  return rows;
};

const QUERIES = {
  pagos: queryPagos,
  comunicaciones: queryComunicaciones,
  conformidades: queryConformidades,
  tutelas: queryTutelas,
  ambiental: queryAmbiental,
  contratos: queryContratos,
};

export const consultarTodo = async (filtros) => {
  const modulosSeleccionados = filtros.modulos || Object.keys(QUERIES);
  const validos = modulosSeleccionados.filter(m => QUERIES[m]);

  const resultados = await Promise.all(
    validos.map(async (modulo) => {
      try {
        const rows = await QUERIES[modulo](filtros);
        return { modulo, rows };
      } catch {
        return { modulo, rows: [] };
      }
    })
  );

  const por_modulo = {};
  const timeline = [];
  const totales = {};

  for (const { modulo, rows } of resultados) {
    por_modulo[modulo] = rows;
    totales[modulo] = rows.length;
    for (const row of rows) {
      timeline.push(row);
    }
  }

  timeline.sort((a, b) => {
    const da = a.fecha ? new Date(a.fecha) : new Date(0);
    const db = b.fecha ? new Date(b.fecha) : new Date(0);
    return db - da;
  });

  return { por_modulo, timeline, totales };
};
