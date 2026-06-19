import pool from '../../../config/db.js';
import { registrarLog } from '../../../services/auditService.js';
import { extractTextFromFile, generarPromptAmbiental } from '../services/ambientalService.js';
import { analisisLlmSchema } from '../schemas/ambientalSchema.js';
import logger from '../../../config/logger.js';

// POST /expedientes/procesar — extrae texto y genera prompt (sin guardar)
export const procesarDocumento = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Se requiere un archivo PDF o DOCX.' });
  try {
    const contenido_texto = await extractTextFromFile(req.file.buffer, req.file.mimetype);
    const prompt_generado = generarPromptAmbiental(contenido_texto);
    res.json({ contenido_texto, prompt_generado });
  } catch (error) {
    logger.error('procesarDocumento error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
};

// POST /expedientes
export const crearExpediente = async (req, res) => {
  const { titulo, tipo_instrumento, numero_expediente, entidad_id, responsable_uuid, grupo_id, fecha_documento, contenido_texto, prompt_generado } = req.body;
  const creado_por = req.user.id;
  try {
    const { rows } = await pool.query(
      `INSERT INTO expedientes_ambientales
        (titulo, tipo_instrumento, numero_expediente, entidad_id, responsable_uuid, grupo_id, fecha_documento, contenido_texto, prompt_generado, creado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [titulo, tipo_instrumento, numero_expediente || null, entidad_id || null, responsable_uuid || null, grupo_id || null, fecha_documento || null, contenido_texto || null, prompt_generado || null, creado_por]
    );
    await registrarLog(creado_por, 'CREAR_EXPEDIENTE_AMBIENTAL', 'ambiental', rows[0].id, req);
    res.status(201).json(rows[0]);
  } catch (error) {
    logger.error('crearExpediente error', { error: error.message });
    res.status(500).json({ error: 'Error al crear el expediente.' });
  }
};

// GET /expedientes
export const listarExpedientes = async (req, res) => {
  const { entidad_id, tipo_instrumento, nivel_riesgo, estado } = req.query;
  try {
    const conditions = ['e.is_active = true'];
    const params = [];
    let idx = 1;

    if (entidad_id)       { conditions.push(`e.entidad_id = $${idx++}`);       params.push(entidad_id); }
    if (tipo_instrumento) { conditions.push(`e.tipo_instrumento = $${idx++}`); params.push(tipo_instrumento); }
    if (estado)           { conditions.push(`e.estado = $${idx++}`);           params.push(estado); }
    if (nivel_riesgo)     { conditions.push(`a.nivel_riesgo = $${idx++}`);     params.push(nivel_riesgo); }

    const where = conditions.join(' AND ');
    const { rows } = await pool.query(
      `SELECT e.*, ent.nombre AS entidad_nombre, g.nombre AS grupo_nombre,
              a.nivel_riesgo, a.id AS analisis_id
       FROM expedientes_ambientales e
       LEFT JOIN global_entidades ent ON ent.id = e.entidad_id
       LEFT JOIN global_grupos g ON g.id = e.grupo_id
       LEFT JOIN analisis_ambiental a ON a.expediente_id = e.id
       WHERE ${where}
       ORDER BY e.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (error) {
    logger.error('listarExpedientes error', { error: error.message });
    res.status(500).json({ error: 'Error al listar expedientes.' });
  }
};

// GET /expedientes/:id
export const obtenerExpediente = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.*, ent.nombre AS entidad_nombre, g.nombre AS grupo_nombre
       FROM expedientes_ambientales e
       LEFT JOIN global_entidades ent ON ent.id = e.entidad_id
       LEFT JOIN global_grupos g ON g.id = e.grupo_id
       WHERE e.id = $1 AND e.is_active = true`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Expediente no encontrado.' });
    res.json(rows[0]);
  } catch (error) {
    logger.error('obtenerExpediente error', { error: error.message });
    res.status(500).json({ error: 'Error al obtener el expediente.' });
  }
};

// PATCH /expedientes/:id
export const actualizarExpediente = async (req, res) => {
  const campos = [];
  const valores = [];
  let idx = 1;
  const permitidos = ['titulo', 'tipo_instrumento', 'numero_expediente', 'entidad_id', 'responsable_uuid', 'grupo_id', 'fecha_documento', 'estado'];
  for (const campo of permitidos) {
    if (req.body[campo] !== undefined) {
      campos.push(`${campo}=$${idx++}`);
      valores.push(req.body[campo]);
    }
  }
  if (!campos.length) return res.status(400).json({ error: 'Se requiere al menos un campo.' });
  valores.push(req.params.id);
  try {
    const { rows } = await pool.query(
      `UPDATE expedientes_ambientales SET ${campos.join(', ')}, updated_at=NOW() WHERE id=$${idx} AND is_active=true RETURNING *`,
      valores
    );
    if (!rows.length) return res.status(404).json({ error: 'Expediente no encontrado.' });
    res.json(rows[0]);
  } catch (error) {
    logger.error('actualizarExpediente error', { error: error.message });
    res.status(500).json({ error: 'Error al actualizar el expediente.' });
  }
};

// DELETE /expedientes/:id (lógico)
export const eliminarExpediente = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE expedientes_ambientales SET is_active=false, updated_at=NOW() WHERE id=$1 AND is_active=true RETURNING id`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Expediente no encontrado.' });
    await registrarLog(req.user.id, 'ELIMINAR_EXPEDIENTE_AMBIENTAL', 'ambiental', req.params.id, req);
    res.json({ message: 'Expediente eliminado.' });
  } catch (error) {
    logger.error('eliminarExpediente error', { error: error.message });
    res.status(500).json({ error: 'Error al eliminar el expediente.' });
  }
};

// POST /expedientes/:id/analisis — recibe JSON del LLM, parsea y guarda relacional
export const guardarAnalisis = async (req, res) => {
  const { id } = req.params;
  const { resultado_llm_json } = req.body;

  let parsed;
  try {
    parsed = JSON.parse(resultado_llm_json);
  } catch {
    return res.status(400).json({ error: 'La respuesta del LLM no es un JSON válido.' });
  }

  const validation = analisisLlmSchema.safeParse(parsed);
  if (!validation.success) {
    return res.status(400).json({ error: 'Estructura del JSON inválida.', details: validation.error.issues });
  }

  const { que_ordena, admite_recurso, plazo_respuesta, nivel_riesgo, resumen, hallazgos, normas_citadas } = validation.data;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [analisis] } = await client.query(
      `INSERT INTO analisis_ambiental (expediente_id, nivel_riesgo, resumen, resultado_llm_raw, creado_por)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [id, nivel_riesgo, resumen, resultado_llm_json, req.user.id]
    );

    for (const h of hallazgos) {
      await client.query(
        `INSERT INTO hallazgos_ambientales (analisis_id, numero_hallazgo, tipo, descripcion, norma_infringida, recomendacion, prioridad)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [analisis.id, h.numero, h.tipo, h.descripcion, h.norma_infringida || null, h.recomendacion || null, h.prioridad]
      );
    }

    for (const n of normas_citadas) {
      await client.query(
        `INSERT INTO normas_citadas_ambiental (analisis_id, instrumento, articulo, descripcion)
         VALUES ($1,$2,$3,$4)`,
        [analisis.id, n.instrumento, n.articulo || null, n.descripcion || null]
      );
    }

    await client.query(
      `UPDATE expedientes_ambientales SET estado='Analizado', que_ordena=$1, admite_recurso=$2, plazo_respuesta=$3, updated_at=NOW() WHERE id=$4`,
      [que_ordena, admite_recurso, plazo_respuesta, id]
    );

    await client.query('COMMIT');
    await registrarLog(req.user.id, 'GUARDAR_ANALISIS_AMBIENTAL', 'ambiental', id, req);
    res.status(201).json({ analisis_id: analisis.id, message: 'Análisis guardado correctamente.' });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('guardarAnalisis error', { error: error.message });
    res.status(500).json({ error: 'Error al guardar el análisis.' });
  } finally {
    client.release();
  }
};

// GET /expedientes/:id/analisis
export const obtenerAnalisis = async (req, res) => {
  try {
    const { rows: [analisis] } = await pool.query(
      `SELECT * FROM analisis_ambiental WHERE expediente_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.params.id]
    );
    if (!analisis) return res.status(404).json({ error: 'Análisis no encontrado.' });

    const [{ rows: hallazgos }, { rows: normas }] = await Promise.all([
      pool.query('SELECT * FROM hallazgos_ambientales WHERE analisis_id=$1 ORDER BY numero_hallazgo', [analisis.id]),
      pool.query('SELECT * FROM normas_citadas_ambiental WHERE analisis_id=$1', [analisis.id]),
    ]);

    res.json({ ...analisis, hallazgos, normas_citadas: normas });
  } catch (error) {
    logger.error('obtenerAnalisis error', { error: error.message });
    res.status(500).json({ error: 'Error al obtener el análisis.' });
  }
};

// GET /expedientes/:id/informe — datos para que el frontend genere el PDF
export const obtenerDatosInforme = async (req, res) => {
  try {
    const { rows: [expediente] } = await pool.query(
      `SELECT e.*, ent.nombre AS entidad_nombre, g.nombre AS grupo_nombre
       FROM expedientes_ambientales e
       LEFT JOIN global_entidades ent ON ent.id = e.entidad_id
       LEFT JOIN global_grupos g ON g.id = e.grupo_id
       WHERE e.id = $1 AND e.is_active = true`,
      [req.params.id]
    );
    if (!expediente) return res.status(404).json({ error: 'Expediente no encontrado.' });

    const { rows: [analisis] } = await pool.query(
      `SELECT * FROM analisis_ambiental WHERE expediente_id=$1 ORDER BY created_at DESC LIMIT 1`,
      [req.params.id]
    );

    let hallazgos = [], normas_citadas = [];
    if (analisis) {
      [{ rows: hallazgos }, { rows: normas_citadas }] = await Promise.all([
        pool.query('SELECT * FROM hallazgos_ambientales WHERE analisis_id=$1 ORDER BY numero_hallazgo', [analisis.id]),
        pool.query('SELECT * FROM normas_citadas_ambiental WHERE analisis_id=$1', [analisis.id]),
      ]);
    }

    res.json({ expediente, analisis: analisis || null, hallazgos, normas_citadas });
  } catch (error) {
    logger.error('obtenerDatosInforme error', { error: error.message });
    res.status(500).json({ error: 'Error al obtener datos del informe.' });
  }
};
