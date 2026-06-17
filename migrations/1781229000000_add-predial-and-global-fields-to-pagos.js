export async function up(pgm) {
    await pgm.sql(`
        -- 1. Añadir campos globales
        ALTER TABLE pagos ADD COLUMN IF NOT EXISTS tipo_pago VARCHAR(50) DEFAULT 'ESTANDAR';
        ALTER TABLE pagos ADD COLUMN IF NOT EXISTS proyecto_id INTEGER REFERENCES global_proyectos(id);
        ALTER TABLE pagos ADD COLUMN IF NOT EXISTS wbe VARCHAR(100);
        ALTER TABLE pagos ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(50); -- CHEQUE / TRANSFERENCIA
        
        -- 2. Añadir campo específico para prediales
        ALTER TABLE pagos ADD COLUMN IF NOT EXISTS codigo_sig VARCHAR(100);

        -- 3. Comentario aclaratorio en la base de datos
        COMMENT ON COLUMN pagos.codigo_sig IS 'Campo exclusivo para pagos de tipo PREDIAL';
    `);
}

export async function down(pgm) {
    await pgm.sql(`
        ALTER TABLE pagos DROP COLUMN IF EXISTS codigo_sig;
        ALTER TABLE pagos DROP COLUMN IF EXISTS metodo_pago;
        ALTER TABLE pagos DROP COLUMN IF EXISTS wbe;
        ALTER TABLE pagos DROP COLUMN IF EXISTS proyecto_id;
        ALTER TABLE pagos DROP COLUMN IF EXISTS tipo_pago;
    `);
}
