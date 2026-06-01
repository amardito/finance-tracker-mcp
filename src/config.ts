import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4100),
  LOG_LEVEL: z.string().default('info'),
  FINTRACK_API_BASE_URL: z.string().url().default('http://localhost:4000'),
  FINTRACK_API_SERVICE_TOKEN: z.string().optional(),
  FINTRACK_MCP_SERVICE_TOKEN: z.string().min(16).optional(),
});

export const config = envSchema.parse(process.env);
