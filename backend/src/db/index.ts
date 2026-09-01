import { Pool, PoolConfig } from 'pg';
import { env } from '../config/env.js';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not configured. Please check your .env file.');
    }

    const config: PoolConfig = {
      connectionString: env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    // Auto-enable SSL for cloud databases (Neon, Supabase, Render, ElephantSQL, RDS)
    if (
      env.DATABASE_URL.includes('neon.tech') ||
      env.DATABASE_URL.includes('supabase') ||
      env.DATABASE_URL.includes('render.com') ||
      env.DATABASE_URL.includes('amazonaws.com') ||
      env.DATABASE_URL.includes('sslmode=require')
    ) {
      config.ssl = { rejectUnauthorized: false };
    }

    pool = new Pool(config);

    pool.on('error', (err) => {
      console.error('[Database Pool Error]:', err.message);
    });
  }

  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number | null }> {
  const dbPool = getDbPool();
  return dbPool.query<any>(text, params);
}

export async function checkDbConnection(): Promise<{ ok: boolean; message: string; vectorExtension?: boolean }> {
  try {
    if (!env.DATABASE_URL) {
      return { ok: false, message: 'DATABASE_URL is missing' };
    }
    const result = await query('SELECT NOW() as now, current_database() as db');
    const extResult = await query(
      "SELECT extname FROM pg_extension WHERE extname = 'vector'"
    );
    const hasVector = extResult.rows.length > 0;
    return {
      ok: true,
      message: `Connected to ${result.rows[0].db}`,
      vectorExtension: hasVector,
    };
  } catch (error: any) {
    return {
      ok: false,
      message: error.message || 'Failed to connect to database',
    };
  }
}
