export async function up(pgm) {
    pgm.addColumns('tutelas', {
        lock_owner_id: { type: 'uuid', references: 'global_usuarios(id)', nullable: true },
        lock_expires_at: { type: 'timestamp with time zone', nullable: true }
    });
}

export async function down(pgm) {
    pgm.dropColumns('tutelas', ['lock_owner_id', 'lock_expires_at']);
}