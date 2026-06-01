import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/database.js';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me';

export const register = async (req, res) => {
  try {
    const { nombre, email, password, especialidad } = req.body;
    
    // Hashear contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO abogados (nombre, email, password_hash, especialidad)
      VALUES ($1, $2, $3, $4) RETURNING id, nombre, email;
    `;
    
    const { rows } = await pool.query(query, [nombre, email, password_hash, especialidad]);
    res.status(201).json({ message: 'Usuario registrado', user: rows[0] });
  } catch (error) {
    logger.error('Error en registro:', { message: error.message, requestId: req.requestId });
    res.status(500).json({ error: 'Error al registrar abogado.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const query = 'SELECT * FROM abogados WHERE email = $1';
    const { rows } = await pool.query(query, [email]);

    if (rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas.' });

    const abogado = rows[0];
    const validPassword = await bcrypt.compare(password, abogado.password_hash);

    if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas.' });

    if (!abogado.is_approved) {
        return res.status(403).json({ error: 'Cuenta pendiente de aprobación por un administrador.' });
    }

    const token = jwt.sign({ id: abogado.id, email: abogado.email, rol: abogado.rol }, JWT_SECRET, { expiresIn: '8h' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 8 * 60 * 60 * 1000 // 8 horas
    });

    res.json({ user: { 
        id: abogado.id, 
        nombre: abogado.nombre, 
        email: abogado.email, 
        rol: abogado.rol,
        mustChangePassword: abogado.must_change_password 
    } });
  } catch (error) {
    logger.error('Error en login:', { message: error.message, requestId: req.requestId });
    res.status(500).json({ error: 'Error interno en autenticación.' });
  }
};

export const logout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Sesión cerrada' });
};

export const changePassword = async (req, res) => {
    try {
        const { id } = req.user;
        const { newPassword } = req.body;
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(newPassword, saltRounds);
        await pool.query('UPDATE abogados SET password_hash = $1, must_change_password = FALSE WHERE id = $2', [password_hash, id]);
        res.json({ message: 'Contraseña actualizada' });
    } catch (error) {
        logger.error('Error cambiando contraseña:', error);
        res.status(500).json({ error: 'Error al actualizar.' });
    }
};
