export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LoggerConfig {
  serviceName: string;
  level: LogLevel;
  pretty: boolean;
  defaultMeta?: Record<string, unknown>;
  redactPaths?: string[];
  async?: boolean;
}
