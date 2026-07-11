import "server-only"

import { feathersFetch } from "@/lib/api"
import { getToken } from "@/lib/session"
import type { Family } from "@/lib/families"
import type { Person } from "@/lib/people-types"

// Re-export the client-safe types + helpers so server callers can keep importing from
// "@/lib/people". Client components must import these from "@/lib/people-types" directly to
// avoid pulling this server-only module (next/headers) into the browser bundle.
export type { Gender, Privacy, Person } from "@/lib/people-types"
export { personName, lifeYears } from "@/lib/people-types"

type Paginated<T> = {
  total: number
  limit: number
  skip: number
  data: T[]
}

/** Fetch a single family the caller owns, or null (also covers not-found / no access). */
export async function getFamily(id: string): Promise<Family | null> {
  const token = await getToken()
  if (!token) return null

  const { ok, data } = await feathersFetch<Family>(`/families/${id}`, { token })
  return ok ? (data ?? null) : null
}

/**
 * People in a family, sorted by name. Access is scoped server-side to families the caller
 * owns (people.hooks.ts). Limited to one page for now — server-side search + pagination is a
 * later concern (the tree view in Phase 5 owns large-scale traversal/search).
 */
export async function getPeople(familyId: string): Promise<Person[]> {
  const token = await getToken()
  if (!token) return []

  const { ok, data } = await feathersFetch<Paginated<Person>>(
    `/people?familyId=${familyId}&$sort[firstName]=1&$limit=50`,
    { token }
  )
  return ok && Array.isArray(data?.data) ? data.data : []
}

/**
 * Every person across all families the caller owns, sorted by name. The backend `people`
 * service scopes an un-filtered query to owned families (people.hooks.ts), so omitting
 * `familyId` returns exactly the caller's people — what the global People dashboard needs.
 */
export async function getAllPeople(): Promise<Person[]> {
  const token = await getToken()
  if (!token) return []

  const { ok, data } = await feathersFetch<Paginated<Person>>(
    "/people?$sort[firstName]=1&$limit=1000",
    { token }
  )
  return ok && Array.isArray(data?.data) ? data.data : []
}

/** A single person by id, or null (scoped to owned families server-side). */
export async function getPerson(id: string): Promise<Person | null> {
  const token = await getToken()
  if (!token) return null

  const { ok, data } = await feathersFetch<Person>(`/people/${id}`, { token })
  return ok ? (data ?? null) : null
}
