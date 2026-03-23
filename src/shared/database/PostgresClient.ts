import { type DatabaseConfig, getDatabaseConfig } from '@/config/database.config';
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import type { Logger } from 'pino';

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
      this.logger.error({ text, err }, 'Query error');
      throw err;
    }
  }

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  getPool(): Pool {
    return this.pool;
  }
}
