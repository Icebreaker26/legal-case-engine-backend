import pool from '../../../db/database.js';

const tablas = {
    entidades: { tabla: 'global_entidades', col: 'nombre' },
    proyectos: { tabla: 'global_proyectos', col: 'nombre' },
    contratos: { tabla: 'global_contratos', col: 'numero' },
    grupos: { tabla: 'global_grupos', col: 'nombre' },
    areas: { tabla: 'global_areas_equipos', col: 'nombre' },
    categorias: { tabla: 'global_categorias', col: 'nombre' },
    documentos: { tabla: 'global_tipos_documento', col: 'nombre' },
    acreedores: { tabla: 'global_acreedores', col: 'nombre' }
};

export const listar = async (req, res) => {
    const { tipo } = req.params;
    const config = tablas[tipo];
    if (!config) return res.status(404).json({ error: 'Catálogo no encontrado' });
    
    try {
        let query;
        if (tipo === 'areas') {
            query = `
                SELECT e.*, COUNT(u.id)::int as total_miembros
                FROM ${config.tabla} e
                LEFT JOIN global_usuarios u ON e.id = u.equipo_id
                WHERE e.is_active = true
                GROUP BY e.id
                ORDER BY e.${config.col} ASC
            `;
        } else {
            query = `SELECT * FROM ${config.tabla} WHERE is_active = true ORDER BY ${config.col} ASC`;
        }
        
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) { 
        console.error(`Error en listar ${tipo}:`, error);
        res.status(500).json({ error: `Error al listar ${tipo}.`, details: error.message }); 
    }
};

export const listarInactivos = async (req, res) => {
    const { tipo } = req.params;
    const config = tablas[tipo];
    if (!config) return res.status(404).json({ error: 'Catálogo no encontrado' });
    
    try {
        const { rows } = await pool.query(`SELECT * FROM ${config.tabla} WHERE is_active = false ORDER BY ${config.col} ASC`);
        res.json(rows);
    } catch (error) { 
        console.error(`Error en listar inactivos ${tipo}:`, error);
        res.status(500).json({ error: `Error al listar inactivos ${tipo}.`, details: error.message }); 
    }
};

export const crear = async (req, res) => {
    const { tipo } = req.params;
    const config = tablas[tipo];
    if (!config) return res.status(404).json({ error: 'Catálogo no encontrado' });
    
    try {
        if (tipo === 'categorias') {
            const { nombre } = req.body;
            // Verificar si existe y está inactiva
            const { rows } = await pool.query(`SELECT id, is_active FROM ${config.tabla} WHERE nombre = $1`, [nombre]);
            
            if (rows.length > 0) {
                if (!rows[0].is_active) {
                    await pool.query(`UPDATE ${config.tabla} SET is_active = true WHERE id = $1`, [rows[0].id]);
                    return res.status(200).json({ message: 'Categoría reactivada.' });
                }
                return res.status(400).json({ error: 'La categoría ya existe y está activa.' });
            }
            await pool.query(`INSERT INTO ${config.tabla} (${config.col}) VALUES ($1)`, [nombre]);
        } else if (tipo === 'acreedores') {
            const { nombre, nit, banco, cuenta } = req.body;
            await pool.query(`INSERT INTO ${config.tabla} (nombre, nit, banco, cuenta) VALUES ($1, $2, $3, $4)`, [nombre, nit, banco, cuenta]);
        } else if (tipo === 'contratos') {
            const { numero } = req.body;
            await pool.query(`INSERT INTO ${config.tabla} (${config.col}) VALUES ($1)`, [numero]);
        } else {
            const { nombre } = req.body;
            await pool.query(`INSERT INTO ${config.tabla} (${config.col}) VALUES ($1)`, [nombre]);
        }
        res.status(201).json({ message: 'Creado.' });
    } catch (error) { 
        console.error(`Error en crear ${tipo}:`, error);
        res.status(500).json({ error: `Error al crear ${tipo}.`, details: error.message }); 
    }
};

export const actualizar = async (req, res) => {
    const { tipo, id } = req.params;
    const config = tablas[tipo];
    if (!config) return res.status(404).json({ error: 'Catálogo no encontrado' });
    
    try {
        if (tipo === 'acreedores') {
            const { nombre, nit, banco, cuenta } = req.body;
            await pool.query(
                `UPDATE ${config.tabla} SET nombre = $1, nit = $2, banco = $3, cuenta = $4 WHERE id = $5`, 
                [nombre, nit, banco, cuenta, id]
            );
        } else if (tipo === 'contratos') {
            const { numero } = req.body;
            await pool.query(`UPDATE ${config.tabla} SET ${config.col} = $1 WHERE id = $2`, [numero, id]);
        } else if (tipo === 'categorias') {
            const { nombre, palabras_clave } = req.body;
            await pool.query(
                `UPDATE ${config.tabla} SET nombre = $1, palabras_clave = $2 WHERE id = $3`, 
                [nombre, palabras_clave, id]
            );
        } else {
            const { nombre } = req.body;
            await pool.query(`UPDATE ${config.tabla} SET ${config.col} = $1 WHERE id = $2`, [nombre, id]);
        }
        res.json({ message: 'Actualizado.' });
    } catch (error) { 
        console.error(`Error en actualizar ${tipo}:`, error);
        res.status(500).json({ error: `Error al actualizar ${tipo}.`, details: error.message }); 
    }
};

export const eliminar = async (req, res) => {
    const { tipo, id } = req.params;
    const config = tablas[tipo];
    if (!config) return res.status(404).json({ error: 'Catálogo no encontrado' });
    
    try {
        if (tipo === 'areas') {
            // 1. Desvincular automáticamente a los usuarios no aprobados (is_approved = false)
            await pool.query('UPDATE global_usuarios SET equipo_id = NULL WHERE equipo_id = $1 AND is_approved = false', [id]);

            // 2. Verificar si aún quedan miembros (ahora solo quedan los aprobados)
            const { rows } = await pool.query('SELECT COUNT(*) as count FROM global_usuarios WHERE equipo_id = $1', [id]);
            if (parseInt(rows[0].count) > 0) {
                return res.status(400).json({ error: 'No se puede archivar un equipo que tiene miembros aprobados asignados. Por favor, remueva a los miembros aprobados primero.' });
            }

            // Archivar objetivos activos de los usuarios de este equipo
            await pool.query(`
                UPDATE objetivos 
                SET estado = 'archived' 
                WHERE estado = 'active' 
                AND usuario_uuid IN (SELECT id FROM global_usuarios WHERE equipo_id = $1)
            `, [id]);
        }
        
        await pool.query(`UPDATE ${config.tabla} SET is_active = false WHERE id = $1`, [id]);
        res.json({ message: 'Archivado.' });
    } catch (error) { 
        console.error(`Error en eliminar ${tipo}:`, error);
        res.status(500).json({ error: `Error al archivar ${tipo}.`, details: error.message }); 
    }
};

export const recuperar = async (req, res) => {
    const { tipo, id } = req.params;
    const config = tablas[tipo];
    if (!config) return res.status(404).json({ error: 'Catálogo no encontrado' });
    
    try {
        await pool.query(`UPDATE ${config.tabla} SET is_active = true WHERE id = $1`, [id]);
        res.json({ message: 'Recuperado.' });
    } catch (error) { 
        console.error(`Error en recuperar ${tipo}:`, error);
        res.status(500).json({ error: `Error al recuperar ${tipo}.`, details: error.message }); 
    }
};
