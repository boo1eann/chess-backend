declare module 'node:http' {
  interface ServerResponse {
    err?: unknown;
  }
}
