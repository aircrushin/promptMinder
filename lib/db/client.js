import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

function ensureEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

// 获取数据库连接URL
function getDatabaseUrl() {
  // 优先使用 DATABASE_URL，如果没有则尝试从 Supabase URL 构建
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  if (process.env.SUPABASE_DATABASE_URL) {
    return process.env.SUPABASE_DATABASE_URL;
  }
  
  // 如果有 Supabase URL 和 Service Role Key，构建连接字符串
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && supabaseKey) {
    // 从 Supabase URL 提取项目 ID
    const projectId = supabaseUrl.match(/https:\/\/(.*)\.supabase\.co/)?.[1];
    if (projectId) {
      return `postgresql://postgres:${supabaseKey}@db.${projectId}.supabase.co:5432/postgres`;
    }
  }
  
  throw new Error(
    'Missing database connection. Please set DATABASE_URL, SUPABASE_DATABASE_URL, ' +
    'or both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  );
}

// 创建 PostgreSQL 客户端
function createPostgresClient() {
  const connectionString = getDatabaseUrl();
  
  // 创建客户端，用于查询
  const client = postgres(connectionString, {
    max: 10, // 连接池大小
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // 禁用 prepared statements 以提高兼容性
  });
  
  return client;
}

// 创建 Drizzle ORM 实例
function createDrizzleClient() {
  const client = createPostgresClient();
  return drizzle(client, { schema });
}

// 单例模式
let dbInstance = null;
let postgresClient = null;

export function getDb() {
  if (!dbInstance) {
    postgresClient = createPostgresClient();
    dbInstance = drizzle(postgresClient, { schema });
  }
  return dbInstance;
}

export function getRawClient() {
  if (!postgresClient) {
    postgresClient = createPostgresClient();
  }
  return postgresClient;
}

// 用于事务处理
export async function withTransaction(callback) {
  const db = getDb();
  return await db.transaction(callback);
}

// 重新导出 schema 以便其他地方使用
export { schema };
export * from './schema.js';

// 默认导出 db 实例
export default getDb();
