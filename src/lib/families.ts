import "server-only"

import { feathersFetch } from "@/lib/api"
import { getToken } from "@/lib/session"

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

/** Fetch the current user's families (newest first). Scoped server-side by owner. */
export async function getFamilies(): Promise<Family[]> {
  const token = await getToken()
  if (!token) return []

  const { ok, data } = await feathersFetch<Paginated<Family>>(
    "/families?$sort[createdAt]=-1&$limit=50",
    { token }
  )

  return ok && Array.isArray(data?.data) ? data.data : []
}
