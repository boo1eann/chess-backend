import { PostgresClient } from '../src/shared/database/PostgresClient';
import { initLogger } from '../src/shared/lib/logger';
import { loggerConfig } from '../src/config/logger.config';
import path from 'node:path';
import { readdirSync, readFileSync } from 'node:fs';

const logger = initLogger(loggerConfig);

async function migrate(): Promise<void> {
  const db = new PostgresClient(logger);
  await db.connect();

  const migrationDir = path.join(process.cwd(), 'db/migrations');
  const files = readdirSync(migrationDir).sort();

  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      ran_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  for (const file of files) {
    const { rows } = await db.query('SELECT id FROM _migrations WHERE filename = $1', [file]);

    if (rows.length === 0) {
      const sql = readFileSync(path.join(migrationDir, file), 'utf-8');
      await db.query(sql);
      await db.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      logger.info(`Ran migration: ${file}`);
    } else {
      logger.debug(`Skipping migration: ${file}`);
    }
  }

  await db.disconnect();
  logger.info('Migrations complete');
}

migrate().catch((err) => {
  logger.fatal({ err }, 'Migration failed');
  process.exit(1);
});
