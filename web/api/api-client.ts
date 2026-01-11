import { Requests } from './types/requests';

export class Fetch {
  private static readonly baseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  static async post<T extends keyof Requests['POST']>(
    url: T,
    body: Requests['POST'][T]['body'],
    params?: Record<string, string>,
  ): Promise<Requests['POST'][T]['response']> {
    const response = await fetch(
      this.makeUrl(url, params),
      this.createOptions({
        method: 'POST',
        body: JSON.stringify(body),
      }),
    );
    return this.handleError(response);
  }

  static async get<T extends keyof Requests['GET']>(
    url: T,
    params?: Record<string, string>,
    options?: Omit<RequestInit, 'method' | 'body'>,
  ): Promise<Requests['GET'][T]['response']> {
    const response = await fetch(
      this.makeUrl(url, params),
      this.createOptions({ method: 'GET', ...options }),
    );
    return this.handleError(response);
  }

  static async put<T extends keyof Requests['PUT']>(
    url: T,
    body: Requests['PUT'][T]['body'],
    params?: Record<string, string>,
  ): Promise<Requests['PUT'][T]['response']> {
    const response = await fetch(
      this.makeUrl(url, params),
      this.createOptions({
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    );
    return this.handleError(response) as Requests['PUT'][T]['response'];
  }

  static async delete<T extends keyof Requests['DELETE']>(
    url: T,
    body: Requests['DELETE'][T]['body'],
    params?: Requests['DELETE'][T] extends { params: Record<string, string> }
      ? Requests['DELETE'][T]['params']
      : never,
  ): Promise<Requests['DELETE'][T]['response']> {
    const response = await fetch(
      this.makeUrl(url, params),
      this.createOptions({
        method: 'DELETE',
        body: JSON.stringify(body),
      }),
    );
    return this.handleError(response) as Requests['DELETE'][T]['response'];
  }

  private static async handleError(response: Response) {
    if (!response.ok) {
      const body = await response.json();
      throw new Error(body.message);
    }
    return response.json();
  }

  private static makeUrl(url: string, params?: Record<string, string>) {
    let finalUrl = this.baseUrl + url;

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        finalUrl = finalUrl.replace(`:${key}`, value);
      });
    }

    return finalUrl;
  }

  private static createOptions(options: RequestInit): RequestInit {
    // Convert headers to a plain object if it's a Headers instance
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      if (options.headers instanceof Headers) {
        for (const [key, value] of options.headers.entries()) {
          headers[key] = value;
        }
      } else if (Array.isArray(options.headers)) {
        for (const [key, value] of options.headers) {
          headers[key] = value;
        }
      } else if (typeof options.headers === 'object') {
        Object.assign(headers, options.headers);
      }
    }

    return Object.assign({}, options, {
      credentials: 'include',
      headers,
    });
  }
}
