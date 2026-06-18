import pool from '../../../db/database.js';
import { extractTextFromFile, generateDiffPrompt, computeDiff } from '../services/contratoService.js';
import { registrarLog } from '../../../services/auditService.js';

export const listarMinutas = async (req, res) => {
  try {
    const { rows } = await pool.query(`
        SELECT m.*, u.nombre as creado_por_nombre 
        FROM minutas_estandar m 
        LEFT JOIN global_usuarios u ON m.created_by = u.id 
        WHERE m.is_active = true 
        ORDER BY m.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar minutas.' });
  }
};

export const obtenerMinuta = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM minutas_estandar WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Minuta no encontrada' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener minuta.' });
  }
};

export const crearMinuta = async (req, res) => {
    try {
        const { titulo, descripcion, tipo_contrato, contenido_texto } = req.body;
        const created_by = req.user.id;
        const { rows } = await pool.query(
            'INSERT INTO minutas_estandar (titulo, descripcion, tipo_contrato, contenido_texto, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [titulo, descripcion, tipo_contrato, contenido_texto, created_by]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear minuta.' });
    }
};

export const actualizarMinuta = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descripcion, tipo_contrato, contenido_texto } = req.body;
        const { rows } = await pool.query(
            'UPDATE minutas_estandar SET titulo=$1, descripcion=$2, tipo_contrato=$3, contenido_texto=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
            [titulo, descripcion, tipo_contrato, contenido_texto, id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Minuta no encontrada' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar minuta.' });
    }
};

export const listarPapelera = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM minutas_estandar WHERE is_active = false ORDER BY updated_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar papelera.' });
    }
};

export const restaurarMinuta = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('UPDATE minutas_estandar SET is_active = true WHERE id = $1 RETURNING id', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Minuta no encontrada' });
        res.json({ mensaje: 'Minuta restaurada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al restaurar.' });
    }
};

export const eliminarDefinitivamenteMinuta = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('DELETE FROM minutas_estandar WHERE id = $1', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Minuta no encontrada' });
        res.json({ mensaje: 'Minuta eliminada permanentemente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al borrar permanentemente.' });
    }
};


export const eliminarMinuta = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('UPDATE minutas_estandar SET is_active = false WHERE id = $1 RETURNING id', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Minuta no encontrada' });
        res.json({ mensaje: 'Minuta archivada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar minuta.' });
    }
};

export const actualizarAuditoria = async (req, res) => {
    try {
        const { id } = req.params;
        const campos = [];
        const valores = [];
        let idx = 1;

        const permitidos = ['resultado_llm_texto', 'estado_seguimiento', 'fecha_seguimiento', 'prompt_generado'];
        for (const campo of permitidos) {
            if (req.body[campo] !== undefined) {
                campos.push(`${campo}=$${idx++}`);
                valores.push(req.body[campo]);
            }
        }
        if (campos.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar.' });

        valores.push(id);
        const { rows } = await pool.query(
            `UPDATE registros_auditoria SET ${campos.join(', ')}, updated_at=NOW() WHERE id=$${idx} RETURNING *`,
            valores
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Auditoría no encontrada' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar auditoría.' });
    }
};

export const compararContrato = async (req, res) => {
  try {
    const { minutaEstandarId } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Debes subir un archivo.' });

    const { rows } = await pool.query('SELECT contenido_texto FROM minutas_estandar WHERE id = $1', [minutaEstandarId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Minuta no encontrada.' });

    const textoOriginal = rows[0].contenido_texto;
    const contenido_tercero_texto = await extractTextFromFile(req.file.buffer, req.file.mimetype);
    const prompt = generateDiffPrompt(textoOriginal, contenido_tercero_texto);

    res.json({ success: true, prompt, contenido_tercero_texto });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar la comparación.', details: error.message });
  }
};

export const crearAuditoria = async (req, res) => {
  try {
    const { minuta_estandar_id, tercero_id, prompt_generado, contenido_tercero_texto } = req.body;
    const creado_por = req.user.id;

    const { rows } = await pool.query(
      `INSERT INTO registros_auditoria (minuta_estandar_id, tercero_id, contenido_tercero_texto, prompt_generado, creado_por)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [minuta_estandar_id, tercero_id, contenido_tercero_texto || null, prompt_generado || null, creado_por]
    );

    await registrarLog(creado_por, 'CREAR_AUDITORIA', 'contratos', rows[0].id, req, { minuta_estandar_id });
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar auditoría.' });
  }
};

export const obtenerAuditoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(`
            SELECT ra.*, me.titulo as minuta_titulo, ge.nombre as tercero_nombre, gu.nombre as creado_por_nombre
            FROM registros_auditoria ra
            JOIN minutas_estandar me ON ra.minuta_estandar_id = me.id
            JOIN global_entidades ge ON ra.tercero_id = ge.id
            JOIN global_usuarios gu ON ra.creado_por = gu.id
            WHERE ra.id = $1`,
            [id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Auditoría no encontrada' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener auditoría.' });
    }
};

export const obtenerDiff = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(
            `SELECT ra.contenido_tercero_texto, me.contenido_texto as contenido_minuta, me.titulo as minuta_titulo
             FROM registros_auditoria ra
             JOIN minutas_estandar me ON ra.minuta_estandar_id = me.id
             WHERE ra.id = $1`,
            [id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Auditoría no encontrada.' });

        const { contenido_tercero_texto, contenido_minuta, minuta_titulo } = rows[0];
        if (!contenido_tercero_texto) {
            return res.status(422).json({ error: 'Esta auditoría no tiene el texto del documento guardado.' });
        }

        const partes = computeDiff(contenido_minuta, contenido_tercero_texto);

        res.json({ minuta_titulo, partes });
    } catch (error) {
        res.status(500).json({ error: 'Error al calcular diff.', details: error.message });
    }
};

export const regenerarPrompt = async (req, res) => {
    try {
        const { id } = req.params;
        const { minuta_estandar_id } = req.body;
        if (!minuta_estandar_id) return res.status(400).json({ error: 'minuta_estandar_id es requerido.' });

        const { rows: audRows } = await pool.query(
            'SELECT contenido_tercero_texto FROM registros_auditoria WHERE id = $1',
            [id]
        );
        if (audRows.length === 0) return res.status(404).json({ error: 'Auditoría no encontrada.' });
        if (!audRows[0].contenido_tercero_texto) {
            return res.status(422).json({ error: 'Esta auditoría no tiene el texto del documento guardado.' });
        }

        const { rows: minRows } = await pool.query(
            'SELECT contenido_texto FROM minutas_estandar WHERE id = $1 AND is_active = true',
            [minuta_estandar_id]
        );
        if (minRows.length === 0) return res.status(404).json({ error: 'Minuta no encontrada.' });

        const prompt = generateDiffPrompt(minRows[0].contenido_texto, audRows[0].contenido_tercero_texto);

        await pool.query(
            'UPDATE registros_auditoria SET prompt_generado=$1, minuta_estandar_id=$2, updated_at=NOW() WHERE id=$3',
            [prompt, minuta_estandar_id, id]
        );

        res.json({ success: true, prompt });
    } catch (error) {
        res.status(500).json({ error: 'Error al regenerar prompt.', details: error.message });
    }
};

export const listarAuditorias = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT ra.*, me.titulo as minuta_titulo, ge.nombre as tercero_nombre, gu.nombre as creador_nombre
            FROM registros_auditoria ra
            JOIN minutas_estandar me ON ra.minuta_estandar_id = me.id
            JOIN global_entidades ge ON ra.tercero_id = ge.id
            JOIN global_usuarios gu ON ra.creado_por = gu.id
            ORDER BY ra.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar auditorías.' });
    }
};
