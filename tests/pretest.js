import pool from '../src/db/database.js';
import { execSync } from 'child_process';

async function checkDB() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Base de datos disponible.');
    
    // Ejecutar migraciones antes del seeding
    console.log('📦 Ejecutando migraciones...');
    execSync('npm run migrate:up', { 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'test' }
    });

    // Ejecutar el seeding antes de continuar
    console.log('🌱 Ejecutando seed de datos...');
    execSync('node tests/seed.js', { 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'test' }
    });
    
    console.log('✅ Entorno listo para pruebas.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error: La base de datos no está disponible o el seeding falló.', err);
    process.exit(1);
  }
}

checkDB();
