import "server-only"

// Base URL of the Feathers backend. Server-side only — never exposed to the client.
export const API_URL = process.env.FEATHERS_API_URL ?? "http://localhost:3030"

export type FeathersErrorBody = {
  name?: string
  message?: string
  code?: number
  className?: string
}

export type FeathersResponse<T> = {
  ok: boolean
  status: number
  data: T
}

/**
 * Thin server-side wrapper around the Feathers REST API.
 * Pass `token` to send an `Authorization: Bearer` header.
 */
export async function feathersFetch<T = unknown>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<FeathersResponse<T>> {
  const { token, headers, ...rest } = options

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      cache: "no-store",
    })
  } catch {
    // Backend unreachable (connection refused, DNS, etc.). Surface as a
    // non-ok response so callers degrade gracefully instead of throwing.
    return { ok: false, status: 0, data: null as T }
  }

  const data = (await res.json().catch(() => null)) as T
  return { ok: res.ok, status: res.status, data }
}
