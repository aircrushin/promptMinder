import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '@/drizzle/schema/index'

export const db = drizzle(process.env.DATABASE_URL!, { schema })
