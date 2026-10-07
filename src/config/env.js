import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL debe ser una URL válida"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET debe tener al menos 16 caracteres para mayor seguridad"),
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url("FRONTEND_URL debe ser una URL válida"),
  EMBEDDING_MODEL: z.string().default('Xenova/all-MiniLM-L6-v2'),
  // ECCP (#173) — corte de emergencia para fusion:'alpha_fb', con prioridad
  // absoluta sobre el flag de system_config: apagado instantáneo sin
  // depender de la base de datos.
  RAG_ALPHA_FB_KILL: z.preprocess((v) => v === 'true' || v === '1', z.boolean()),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Error fatal: Variables de entorno inválidas');
  console.error(_env.error.format());
  process.exit(1);
}

export const env = _env.data;
