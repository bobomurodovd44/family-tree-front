// Shared, client-safe pagination helpers. No "server-only" import here so both server fetchers
// and client components (Pagination) can use the type/constants.

/** How many rows we show per page across the app (families, people). */
export const PAGE_SIZE = 15

/** A single page of results, mirroring what the Feathers paginated response gives us. */
export type Page<T> = {
  items: T[]
  total: number
  /** 1-based current page. */
  page: number
  pageSize: number
  /** Total number of pages (at least 1, even when empty). */
  pageCount: number
}

/** Coerce an unknown `?page=` search param into a safe 1-based page number. */
export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value
  const n = Number.parseInt(raw ?? "", 10)
  return Number.isFinite(n) && n >= 1 ? n : 1
}

/** Read a single-valued search param (first value if it arrived as an array). */
export function firstParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value
  return (raw ?? "").trim()
}

/** Build a `Page<T>` from a total count + the page we requested. */
export function toPage<T>(items: T[], total: number, page: number, pageSize = PAGE_SIZE): Page<T> {
  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) }
}
