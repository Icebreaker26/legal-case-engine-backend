import pool from '../../../db/database.js';

export const crearObjetivo = async (req, res) => {
    try {
        console.log('DEBUG: Datos recibidos para crear objetivo:', req.body);
        const { usuario_id, meta_acciones, mes, anio, titulo, descripcion } = req.body;
        
        if (!usuario_id) {
            return res.status(400).json({ error: 'El usuario_id es obligatorio.' });
        }

        // Buscar el UUID del usuario basándonos en el ID recibido.
        // Si 'usuario_id' es el número 787, necesitamos buscar la columna correcta en global_usuarios.
        // Dado que la tabla global_usuarios solo muestra 'id' (UUID), si el frontend envía '787'
        // y no hay columna numérica, el mapeo debe ser distinto.
        // Voy a intentar buscar por el ID numérico que el sistema parece tener internamente.
        
        const userQuery = 'SELECT id FROM global_usuarios WHERE id::text = $1 OR id::text LIKE $2 LIMIT 1'; 
        // Si el usuario_id es un entero, lo convertimos a string para comparar.
        const { rows } = await pool.query(userQuery, [String(usuario_id), `%${usuario_id}%`]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado con ese ID.' });
        }

        const usuario_uuid = rows[0].id;

        const query = `
            INSERT INTO objetivos (usuario_uuid, meta_acciones, mes, anio, titulo, descripcion)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id;
        `;
        const result = await pool.query(query, [usuario_uuid, meta_acciones, mes, anio, titulo, descripcion]);
        res.status(201).json({ id: result.rows[0].id, message: 'Objetivo creado correctamente.' });
    } catch (error) {
        console.error('Error al crear objetivo:', error);
        res.status(500).json({ error: 'Error al crear objetivo.', details: error.message });
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
        const query = 'SELECT * FROM objetivos WHERE usuario_uuid = $1';
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
        const { meta_acciones, mes, anio } = req.body;
        const query = `
            UPDATE objetivos 
            SET meta_acciones = $1, mes = $2, anio = $3
            WHERE id = $4;
        `;
        await pool.query(query, [meta_acciones, mes, anio, id]);
        res.json({ message: 'Objetivo actualizado correctamente.' });
    } catch (error) {
        console.error('Error al actualizar objetivo:', error);
        res.status(500).json({ error: 'Error al actualizar objetivo.', details: error.message });
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
