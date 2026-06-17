export async function up(pgm) {
    await pgm.sql(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        CREATE TABLE global_usuarios (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            nombre VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255),
            rol VARCHAR(50),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

export async function down(pgm) {
    await pgm.sql(`DROP TABLE IF EXISTS global_usuarios;`);
}
