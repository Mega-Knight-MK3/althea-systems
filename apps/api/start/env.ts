import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),

  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  MONGO_URI: Env.schema.string(),
  MONGO_DATABASE: Env.schema.string(),

  MAIL_DRIVER: Env.schema.enum.optional(['smtp', 'log'] as const),
  MAIL_FROM_ADDRESS: Env.schema.string.optional(),
  MAIL_FROM_NAME: Env.schema.string.optional(),
  SMTP_HOST: Env.schema.string.optional({ format: 'host' }),
  SMTP_PORT: Env.schema.number.optional(),

  STOREFRONT_URL: Env.schema.string({ format: 'url', tld: false }),
  STRIPE_SECRET_KEY: Env.schema.string.optional(),
  STRIPE_CURRENCY: Env.schema.string.optional(),
})
