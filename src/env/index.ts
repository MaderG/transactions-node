import { config } from 'dotenv'
import { z } from 'zod'

if (process.env.NODE_ENV === 'test') {
  config({
    path: '.env.test',
  })
} else {
  config()
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  DATABASE_URL: z.string(),
  PORT: z.number().default(3000),
})

const _env = envSchema.safeParse(process.env)
if (!_env.success) {
  console.error('Environment validation failed', _env.error.format())
  process.exit(1)
}

export const env = _env.data
