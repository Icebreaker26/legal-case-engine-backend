import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../../db/database.js';
import logger from '../../../utils/logger.js';
import { env } from '../../../config/env.js';

const JWT_SECRET = env.JWT_SECRET;

export const register = async (req, res) => {
  try {
    const { nombre, email, password, especialidad, rol = 'juridico' } = req.body;
    const normalizedEmail = email.toLowerCase();
    
    // Hashear contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO global_usuarios (nombre, email, password_hash, rol, especialidad)
      VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, email;
    `;
    
    const { rows } = await pool.query(query, [nombre, normalizedEmail, password_hash, rol, especialidad]);
    res.status(201).json({ message: 'Usuario registrado', user: rows[0] });
  } catch (error) {
    logger.error('Error en registro:', { message: error.message, requestId: req.requestId });
    res.status(500).json({ error: 'Error al registrar usuario.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const query = 'SELECT * FROM global_usuarios WHERE email = $1';
    const { rows } = await pool.query(query, [normalizedEmail]);

    if (rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas.' });

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas.' });

    if (!user.is_approved) {
        return res.status(403).json({ error: 'Cuenta pendiente de aprobación por un administrador.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, rol: user.rol, nombre: user.nombre }, JWT_SECRET, { expiresIn: '8h' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 8 * 60 * 60 * 1000 // 8 horas
    });

    res.json({ user: { 
        id: user.id, 
        nombre: user.nombre, 
        email: user.email, 
        rol: user.rol,
        especialidad: user.especialidad,
        mustChangePassword: user.must_change_password 
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
        await pool.query('UPDATE global_usuarios SET password_hash = $1, must_change_password = FALSE WHERE id = $2', [password_hash, id]);
        res.json({ message: 'Contraseña actualizada' });
    } catch (error) {
        logger.error('Error cambiando contraseña:', error);
        res.status(500).json({ error: 'Error al actualizar.' });
    }
};
