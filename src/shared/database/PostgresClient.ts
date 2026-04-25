import { type DatabaseConfig, getDatabaseConfig } from '@/config/database.config';
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import type { Logger } from 'pino';
import { isPgError } from '../errors/postgres';
import type { Queryable } from './types';

export class PostgresClient {
  private pool: Pool;

  constructor(private logger: Logger) {
    const config: DatabaseConfig = getDatabaseConfig();
    this.pool = new Pool(config);
    this.pool.on('error', (err) => {
      this.logger.error({ err }, 'Unexpected error on idle client');
    });
  }

  async connect(): Promise<void> {
    try {
      await this.pool.query('SELECT NOW()');
      this.logger.info('Database connected successfully');
    } catch (err) {
      this.logger.error({ err }, 'Database connection failed');
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
    this.logger.info('Database disconnected');
  }

  async query<T extends QueryResultRow = any>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      this.logger.debug({ text, duration, rows: result.rowCount }, 'Executed query');
      return result;
    } catch (err) {
      const duration = Date.now() - start;
      if (isPgError(err) && err.code?.startsWith('23')) {
        // Это не сбой БД, это юзер прислал плохие данные → debug
        this.logger.debug({ text, duration, code: err.code }, 'Query rejected by constraint');
      } else {
        // Реальный сбой (потеря соединения, плохой SQL, OOM) → error
        this.logger.error({ text, duration, err }, 'Query error');
      }
      throw err;
    }
  }

  async transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        this.logger.error({ err: rollbackErr }, 'ROLLBACK failed');
      }
      throw err;
    } finally {
      client.release();
    }
  }

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  getPool(): Pool {
    return this.pool;
  }
}
