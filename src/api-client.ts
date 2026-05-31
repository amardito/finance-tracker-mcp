import { config } from './config.js';

export class FinanceTrackerApiClient {
  private readonly baseUrl = config.FINTRACK_API_BASE_URL.replace(/\/$/, '');

  async health(): Promise<{ status: string }> {
    return this.get('/api/health');
  }

  async get<T>(path: string, context: ApiRequestContext = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: this.headers(context),
    });
    if (!res.ok) {
      throw new Error(`Finance Tracker API ${path} returned ${res.status}`);
    }
    return (await res.json()) as T;
  }

  private headers(context: ApiRequestContext): Record<string, string> {
    return {
      ...(config.FINTRACK_API_SERVICE_TOKEN
        ? { authorization: `Bearer ${config.FINTRACK_API_SERVICE_TOKEN}` }
        : {}),
      ...(context.cookie ? { cookie: context.cookie } : {}),
    };
  }
}

export type ApiRequestContext = {
  cookie?: string;
};
