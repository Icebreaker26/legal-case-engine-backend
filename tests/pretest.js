import pool from '../src/db/database.js';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function checkDB() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Base de datos disponible.');
    
    // Ejecutar las migraciones sin borrar el esquema existente
    console.log('📦 Ejecutando migraciones...');
    execSync('npm run migrate:up', { 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'test' }
    });

    console.log('🌱 Ejecutando seed de datos...');
    execSync('node tests/seed.js', { 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'test' }
    });
    
    console.log('✅ Entorno listo para pruebas.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en pretest:', err);
    process.exit(1);
  }
}

checkDB();
