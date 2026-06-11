export async function up(pgm) {
    await pgm.sql(`
        -- Tablas de soporte nuevas
        CREATE TABLE proyectos (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL UNIQUE,
            is_active BOOLEAN DEFAULT true
        );

        CREATE TABLE contratos (
            id SERIAL PRIMARY KEY,
            numero VARCHAR(255) NOT NULL UNIQUE,
            is_active BOOLEAN DEFAULT true
        );

        CREATE TABLE conformidades (
            id SERIAL PRIMARY KEY,
            concepto TEXT,
            entidad_id INTEGER REFERENCES entidades(id),
            proyecto_id INTEGER REFERENCES proyectos(id),
            contrato_id INTEGER REFERENCES contratos(id),
            responsable_id INTEGER REFERENCES abogados(id),
            solicitante_id INTEGER REFERENCES abogados(id),
            fecha_recepcion DATE,
            fecha_solicitud DATE,
            ot VARCHAR(100),
            wbe VARCHAR(100),
            valor DECIMAL(15, 2),
            link_acta TEXT,
            
            -- Nuevos campos solicitados
            hoja_contable_normal VARCHAR(100),
            hoja_contable_reembolsable VARCHAR(100),
            numero_conformidad VARCHAR(100),
            
            estado VARCHAR(50),
            soportes_link TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE conformidad_trazabilidad (
            id SERIAL PRIMARY KEY,
            conformidad_id INTEGER REFERENCES conformidades(id),
            usuario_id INTEGER REFERENCES abogados(id),
            estado_anterior VARCHAR(50),
            estado_nuevo VARCHAR(50),
            comentario TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE conformidad_estados (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(50) NOT NULL,
            orden INTEGER,
            is_active BOOLEAN DEFAULT true
        );

        CREATE TABLE conformidad_grupos (
            id SERIAL PRIMARY KEY,
            conformidad_id INTEGER REFERENCES conformidades(id),
            grupo_id INTEGER REFERENCES grupos(id)
        );

        -- Seed inicial de estados actualizados
        INSERT INTO conformidad_estados (nombre, orden, is_active) VALUES 
        ('SOLICITADO', 1, true),
        ('CREACION DE BAREMOS', 2, true),
        ('ENVIADO PARA LIBERAR', 3, true),
        ('LIBERADO', 4, true),
        ('CREACION HOJA CONTABLE', 5, true),
        ('ENVIADO PARA LIBERACION CONTABLE', 6, true),
        ('CONFORMADO', 7, true);
    `);
}

export async function down(pgm) {
    await pgm.sql(`
        DROP TABLE IF EXISTS conformidad_grupos;
        DROP TABLE IF EXISTS conformidad_estados;
        DROP TABLE IF EXISTS conformidad_trazabilidad;
        DROP TABLE IF EXISTS conformidades;
        DROP TABLE IF EXISTS contratos;
        DROP TABLE IF EXISTS proyectos;
    `);
}
