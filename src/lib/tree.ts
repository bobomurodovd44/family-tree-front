import "server-only"

// Server-only reader for the Neo4j `tree` service. Fetches every person in a family plus their
// relationship arrays (already shaped as TreePerson by the backend) and folds them into the
// PeopleMap the canvas consumes. This is the seam that replaces the demo seed.

import { feathersFetch } from "@/lib/api"
import { getToken } from "@/lib/session"
import { computeLayout } from "@/lib/tree-layout"
import type { PeopleMap, SpouseLink, TreePerson } from "@/lib/tree-types"

// The `tree` service returns TreePerson without `children` (derived client-side) and with
// optional x/y (absent until a card is placed).
type TreeApiPerson = Omit<TreePerson, "children" | "x" | "y"> & {
  x?: number | null
  y?: number | null
}

/** Fetch the family's tree from the backend, or [] on any failure (auth, network, no access). */
export async function getTree(familyId: string): Promise<TreeApiPerson[]> {
  const token = await getToken()
  if (!token) return []

  const { ok, data } = await feathersFetch<TreeApiPerson[]>(
    `/tree?familyId=${encodeURIComponent(familyId)}`,
    { token }
  )
  return ok && Array.isArray(data) ? data : []
}

/**
 * Fold the API rows into a PeopleMap. Missing coordinates default to 0; if NO person has a
 * stored position yet (e.g. people were created in the directory, never placed on the canvas),
 * seed a tidy layout once with computeLayout so the first paint looks intentional. `children`
 * is left empty — the hook's normalizeTree derives it from `parents`.
 */
export function treeToPeopleMap(rows: TreeApiPerson[]): PeopleMap {
  const hasAnyCoords = rows.some((p) => p.x != null && p.y != null)

  const map: PeopleMap = {}
  for (const row of rows) {
    map[row.id] = {
      ...row,
      x: row.x ?? 0,
      y: row.y ?? 0,
      spouses: row.spouses.map((s: SpouseLink) => ({ ...s })),
      children: [],
    }
  }

  return hasAnyCoords ? map : computeLayout(map)
}
