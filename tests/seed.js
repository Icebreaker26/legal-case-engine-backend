import bcrypt from 'bcrypt';
import pool from '../src/db/database.js';

async function seed() {
  try {
    console.log('🌱 Iniciando seeding de datos de prueba...');
    
    // VALIDACIÓN DE SEGURIDAD: Solo ejecutar si estamos en entorno de prueba
    if (process.env.NODE_ENV !== 'test') {
      console.error('❌ ERROR DE SEGURIDAD: El seeding solo puede ejecutarse en NODE_ENV=test.');
      process.exit(1);
    }

    // 1. Limpiar datos existentes (Solo si es estrictamente necesario y en DB de pruebas)
    // await pool.query('TRUNCATE abogados RESTART IDENTITY CASCADE;');

    // 2. Crear usuario de prueba (Uso de ON CONFLICT DO NOTHING para respetar datos reales)
    const password_hash = await bcrypt.hash(process.env.TEST_USER_PASS || '123456', 10);
    const query = `
      INSERT INTO abogados (nombre, email, password_hash, especialidad, is_admin, is_approved)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
      RETURNING id;
    `;
    
    await pool.query(query, ['Test Admin', process.env.TEST_USER_EMAIL || 'alejandro@icebreaker.com', password_hash, 'Administración', true, true]);
    
    // Seed para proyectos y contratos
    await pool.query('INSERT INTO proyectos (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING', ['Proyecto Test']);
    await pool.query('INSERT INTO contratos (numero) VALUES ($1) ON CONFLICT (numero) DO NOTHING', ['CONT-2026-001']);

    console.log('✅ Datos de prueba insertados correctamente.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en el seeding:', err);
    process.exit(1);
  }
}

seed();
