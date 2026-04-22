import { z } from 'zod';

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().optional(),
  CLAUDE_MODEL: z.string().default('claude-sonnet-4-20250514'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  AI_PROVIDER: z.enum(['anthropic', 'gemini']).default('gemini'),
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MEMORY_SHORT_TERM_LIMIT: z.coerce.number().default(10),
  MEMORY_LONG_TERM_INJECT_LIMIT: z.coerce.number().default(5),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
