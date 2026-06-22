import type { ApiFailure, ApiSuccess } from "@business/contracts";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    const failure = (await response.json().catch(() => null)) as ApiFailure | null;
    throw new ApiClientError(
      failure?.error.message || "The server could not complete the request.",
      response.status,
      failure?.error.code || "REQUEST_FAILED",
      failure?.error.requestId,
    );
  }

  if (response.status === 204) return undefined as T;
  const payload = await response.json() as ApiSuccess<T>;
  return payload.data;
}
