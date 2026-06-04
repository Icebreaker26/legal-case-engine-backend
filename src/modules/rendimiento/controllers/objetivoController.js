import pool from '../../../db/database.js';

export const crearObjetivo = async (req, res) => {
    try {
        const { usuario_id, meta_acciones, periodo_inicio, periodo_fin } = req.body;
        const query = `
            INSERT INTO objetivos (usuario_id, meta_acciones, periodo_inicio, periodo_fin)
            VALUES ($1, $2, $3, $4)
            RETURNING id;
        `;
        const result = await pool.query(query, [usuario_id, meta_acciones, periodo_inicio, periodo_fin]);
        res.status(201).json({ id: result.rows[0].id, message: 'Objetivo creado correctamente.' });
    } catch (error) {
        console.error('Error al crear objetivo:', error);
        res.status(500).json({ error: 'Error al crear objetivo.' });
    }
};

export const listarObjetivos = async (req, res) => {
    try {
        const query = 'SELECT * FROM objetivos';
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error al listar objetivos:', error);
        res.status(500).json({ error: 'Error al listar objetivos.' });
    }
};

export const listarMisObjetivos = async (req, res) => {
    try {
        const query = 'SELECT * FROM objetivos WHERE usuario_id = $1';
        const { rows } = await pool.query(query, [req.user.id]);
        res.json(rows);
    } catch (error) {
        console.error('Error al listar mis objetivos:', error);
        res.status(500).json({ error: 'Error al listar mis objetivos.' });
    }
};

export const actualizarObjetivo = async (req, res) => {
    try {
        const { id } = req.params;
        const { meta_acciones, periodo_inicio, periodo_fin } = req.body;
        const query = `
            UPDATE objetivos 
            SET meta_acciones = $1, periodo_inicio = $2, periodo_fin = $3
            WHERE id = $4;
        `;
        await pool.query(query, [meta_acciones, periodo_inicio, periodo_fin, id]);
        res.json({ message: 'Objetivo actualizado correctamente.' });
    } catch (error) {
        console.error('Error al actualizar objetivo:', error);
        res.status(500).json({ error: 'Error al actualizar objetivo.' });
    }
};

export const eliminarObjetivo = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM objetivos WHERE id = $1', [id]);
        res.json({ message: 'Objetivo eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar objetivo:', error);
        res.status(500).json({ error: 'Error al eliminar objetivo.' });
    }
};
