import { TokenProvider } from "../auth/TokenProvider";

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  
  headers.set("Accept", "application/json");
  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = TokenProvider.getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`/api/v1${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: response.statusText };
    }
    
    // The API's error envelope is { error: { code, message, details } } — see
    // errorHandlerMiddleware. Reading errorData.message directly always missed it, so every
    // failure in the app surfaced as "An unexpected error occurred" and hid the real reason
    // (e.g. a 404 "ApprovalRecord with ID ... was not found"). The flat shape is kept as a
    // fallback for the response.statusText path above.
    const apiError = errorData?.error ?? errorData;

    throw new ApiError(
      response.status,
      apiError?.message || "An unexpected error occurred",
      apiError?.code,
      apiError?.details
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const ApiClient = {
  fetch: apiFetch,

  get<T>(endpoint: string, options?: RequestInit) {
    return apiFetch<T>(endpoint, { ...options, method: "GET" });
  },

  post<T>(endpoint: string, data?: any, options?: RequestInit) {
    return apiFetch<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  patch<T>(endpoint: string, data: any, options?: RequestInit) {
    return apiFetch<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

