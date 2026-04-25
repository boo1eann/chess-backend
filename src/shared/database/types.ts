import type { QueryResult, QueryResultRow } from 'pg';

export interface Queryable {
  query<T extends QueryResultRow = any>(tex: string, params?: unknown[]): Promise<QueryResult<T>>;
}
