export async function up(pgm) {
    await pgm.sql(`
        -- 1. Crear Tablas Globales
        CREATE TABLE global_entidades (id SERIAL PRIMARY KEY, nombre VARCHAR(255) NOT NULL UNIQUE, is_active BOOLEAN DEFAULT true);
        CREATE TABLE global_proyectos (id SERIAL PRIMARY KEY, nombre VARCHAR(255) NOT NULL UNIQUE, is_active BOOLEAN DEFAULT true);
        CREATE TABLE global_contratos (id SERIAL PRIMARY KEY, numero VARCHAR(255) NOT NULL UNIQUE, is_active BOOLEAN DEFAULT true);
        CREATE TABLE global_grupos (id SERIAL PRIMARY KEY, nombre VARCHAR(100) NOT NULL UNIQUE, is_active BOOLEAN DEFAULT true);
        CREATE TABLE global_areas_equipos (id SERIAL PRIMARY KEY, nombre VARCHAR(100) NOT NULL UNIQUE, is_active BOOLEAN DEFAULT true);
        CREATE TABLE global_categorias (id SERIAL PRIMARY KEY, nombre VARCHAR(100) NOT NULL UNIQUE, is_active BOOLEAN DEFAULT true);
        CREATE TABLE global_tipos_documento (id SERIAL PRIMARY KEY, nombre VARCHAR(100) NOT NULL UNIQUE, is_active BOOLEAN DEFAULT true);
    `);
    
    // (Añadir lógica de remapeo de FKs después de poblar datos de prueba si fuera necesario)
}

export async function down(pgm) {
    await pgm.sql(`
        DROP TABLE IF EXISTS global_tipos_documento;
        DROP TABLE IF EXISTS global_categorias;
        DROP TABLE IF EXISTS global_areas_equipos;
        DROP TABLE IF EXISTS global_grupos;
        DROP TABLE IF EXISTS global_contratos;
        DROP TABLE IF EXISTS global_proyectos;
        DROP TABLE IF EXISTS global_entidades;
    `);
}
