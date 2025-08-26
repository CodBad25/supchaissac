import type { Config } from 'drizzle-kit';

export default {
  schema: './shared/schema-pg.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/supchaissac'
  }
} satisfies Config;
