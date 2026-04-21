import { z } from 'zod';

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, 'Anthropic API key is required'),
  CLAUDE_MODEL: z.string().default('claude-sonnet-4-20250514'),
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
