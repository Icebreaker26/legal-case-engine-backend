import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL debe ser una URL válida"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET debe tener al menos 16 caracteres para mayor seguridad"),
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url("FRONTEND_URL debe ser una URL válida")
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Error fatal: Variables de entorno inválidas');
  console.error(_env.error.format());
  process.exit(1);
}

export const env = _env.data;
