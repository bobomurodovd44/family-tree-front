import "server-only"

import { feathersFetch } from "@/lib/api"
import { getToken } from "@/lib/session"
import { PAGE_SIZE, toPage, type Page } from "@/lib/pagination"

export type Family = {
  _id: string
  name: string
  ownerId: string
  createdAt: number
}

type Paginated<T> = {
  total: number
  limit: number
  skip: number
  data: T[]
}

/** Fetch all families (newest first). Shared workspace: every authenticated user is an admin
 * and sees every family — the backend applies no owner scoping.
 *
 * NOTE: capped at 50 by the backend `paginate.max`. Used by the overview dashboard and by the
 * People page's family-name lookup. List views that need every family should page instead
 * (see {@link getFamiliesPage}). */
export async function getFamilies(): Promise<Family[]> {
  const token = await getToken()
  if (!token) return []

  const { ok, data } = await feathersFetch<Paginated<Family>>(
    "/families?$sort[createdAt]=-1&$limit=50",
    { token }
  )

  return ok && Array.isArray(data?.data) ? data.data : []
}

/** One page of families (15 per page, newest first) — fetches only the requested page. */
export async function getFamiliesPage({
  page = 1,
  pageSize = PAGE_SIZE,
}: { page?: number; pageSize?: number } = {}): Promise<Page<Family>> {
  const token = await getToken()
  if (!token) return toPage<Family>([], 0, page, pageSize)

  const params = new URLSearchParams()
  params.set("$sort[createdAt]", "-1")
  params.set("$limit", String(pageSize))
  params.set("$skip", String((page - 1) * pageSize))

  const { ok, data } = await feathersFetch<Paginated<Family>>(`/families?${params}`, { token })
  if (!ok || !Array.isArray(data?.data)) return toPage<Family>([], 0, page, pageSize)

  return toPage(data.data, data.total ?? data.data.length, page, pageSize)
}

/** Look up a set of families by id → { id: name }. Lets a paginated people list show each
 * person's family name without fetching every family. Ids are deduped; empty input → {}.
 *
 * Fetched one-by-one via `GET /families/:id` (parallel). We deliberately avoid an `_id[$in]`
 * query: the ObjectId coercion that turns a hex string into a Mongo ObjectId applies to a scalar
 * `_id`, but NOT to elements inside `$in`, so that query silently matches nothing. A people page
 * holds ≤15 rows → only a handful of distinct families, so a few id lookups are cheap. */
export async function getFamiliesByIds(familyIds: string[]): Promise<Record<string, string>> {
  const token = await getToken()
  const ids = Array.from(new Set(familyIds))
  if (!token || ids.length === 0) return {}

  const entries = await Promise.all(
    ids.map(async (id) => {
      const { ok, data } = await feathersFetch<Family>(`/families/${id}`, { token })
      return [id, ok && data?.name ? data.name : null] as const
    })
  )
  return Object.fromEntries(
    entries.filter((entry): entry is readonly [string, string] => entry[1] !== null)
  )
}
