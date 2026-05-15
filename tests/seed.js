import bcrypt from 'bcrypt';
import pool from '../src/db/database.js';

async function seed() {
  try {
    console.log('🌱 Iniciando seeding de datos de prueba...');
    
    // 1. Limpiar datos existentes
    await pool.query('TRUNCATE abogados RESTART IDENTITY CASCADE;');

    // 2. Crear usuario de prueba
    const password_hash = await bcrypt.hash(process.env.TEST_USER_PASS || '123456', 10);
    const query = `
      INSERT INTO abogados (nombre, email, password_hash, especialidad, is_admin, is_approved)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;
    `;
    
    await pool.query(query, ['Test Admin', process.env.TEST_USER_EMAIL || 'alejandro@icebreaker.com', password_hash, 'Administración', true, true]);
    
    console.log('✅ Datos de prueba insertados correctamente.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en el seeding:', err);
    process.exit(1);
  }
}

seed();
