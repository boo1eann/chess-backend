import { config } from '.';

export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export function getDatabaseConfig(): DatabaseConfig {
  return {
    ...config.db,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}
