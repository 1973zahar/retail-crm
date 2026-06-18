export interface SqlApiAdapterConfig {
  baseUrl: string;
  timeoutMs: number;
}

export interface SqlApiAdapterRequest {
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
}

export interface SqlApiAdapter {
  getJson<T>(request: SqlApiAdapterRequest): Promise<T>;
}
