/** @type {import('drizzle-kit').Config} */
export default {
  schema: './lib/db/schema.js',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL,
  },
  verbose: true,
  strict: true,
};
