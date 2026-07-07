"use server"

// Server actions for the interactive tree canvas. People are created/edited/removed through the
// Mongo `people` service (which projects the (:Person) node into Neo4j via its after-hooks);
// edges go through the Neo4j-native `relationships` service. Positions ride on the person as
// treeX/treeY. All calls are authenticated with the session token, like people/actions.ts.
//
// Ordering note: POST /people resolves only after its after-hook has upserted the Neo4j node, so
// it's safe to create a relationship referencing the new person immediately afterwards.

import { feathersFetch } from "@/lib/api"
import { getToken } from "@/lib/session"
import type { Gender, SpouseStatus } from "@/lib/tree-types"

// The canvas edits a small subset of the full person record (name, gender, life years). Years
// map onto the people schema's partial-date strings ("YYYY").
export interface TreePersonInput {
  firstName: string
  lastName?: string
  gender: Gender
  birthYear?: number
  deathYear?: number
  isLiving?: boolean
}

// Build the /people payload from the canvas's year-based input.
function personPayload(input: TreePersonInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    firstName: input.firstName,
    gender: input.gender,
  }
  if (input.lastName) payload.lastName = input.lastName
  if (input.birthYear != null) payload.birthDate = String(input.birthYear)
  if (input.deathYear != null) payload.deathDate = String(input.deathYear)
  if (input.isLiving != null) payload.isLiving = input.isLiving
  return payload
}

// Create a person in `familyId` at (x, y). Returns the new Mongo _id, or null on failure.
async function createPerson(
  familyId: string,
  input: TreePersonInput,
  x: number,
  y: number
): Promise<string | null> {
  const token = await getToken()
  if (!token) return null

  const { ok, data } = await feathersFetch<{ _id: string }>("/people", {
    method: "POST",
    token,
    body: JSON.stringify({ ...personPayload(input), familyId, treeX: x, treeY: y }),
  })
  return ok ? (data?._id ?? null) : null
}

async function linkParent(
  token: string,
  familyId: string,
  parentId: string,
  childId: string
): Promise<void> {
  await feathersFetch("/relationships", {
    method: "POST",
    token,
    body: JSON.stringify({ type: "parent", familyId, parentId, childId }),
  })
}

async function linkSpouse(
  token: string,
  familyId: string,
  aId: string,
  bId: string,
  status: SpouseStatus,
  order?: number
): Promise<void> {
  await feathersFetch("/relationships", {
    method: "POST",
    token,
    body: JSON.stringify({ type: "spouse", familyId, aId, bId, status, order }),
  })
}

/** A standalone new person (no relationship). */
export async function createTreePerson(
  familyId: string,
  input: TreePersonInput,
  x: number,
  y: number
): Promise<string | null> {
  return createPerson(familyId, input, x, y)
}

/** New person who becomes a parent of `childId`. */
export async function addParentAction(
  familyId: string,
  childId: string,
  input: TreePersonInput,
  x: number,
  y: number
): Promise<string | null> {
  const token = await getToken()
  if (!token) return null
  const parentId = await createPerson(familyId, input, x, y)
  if (!parentId) return null
  await linkParent(token, familyId, parentId, childId)
  return parentId
}

/** New person who becomes a child of `parentId` (and of `coParentId` when a co-parent exists). */
export async function addChildAction(
  familyId: string,
  parentId: string,
  coParentId: string | null,
  input: TreePersonInput,
  x: number,
  y: number
): Promise<string | null> {
  const token = await getToken()
  if (!token) return null
  const childId = await createPerson(familyId, input, x, y)
  if (!childId) return null
  await linkParent(token, familyId, parentId, childId)
  if (coParentId) await linkParent(token, familyId, coParentId, childId)
  return childId
}

/** New person who becomes the spouse of `personId`. */
export async function addSpouseAction(
  familyId: string,
  personId: string,
  status: SpouseStatus,
  order: number,
  input: TreePersonInput,
  x: number,
  y: number
): Promise<string | null> {
  const token = await getToken()
  if (!token) return null
  const spouseId = await createPerson(familyId, input, x, y)
  if (!spouseId) return null
  await linkSpouse(token, familyId, personId, spouseId, status, order)
  return spouseId
}

/** Update an existing person's editable fields. */
export async function patchTreePerson(
  _familyId: string,
  id: string,
  input: TreePersonInput
): Promise<boolean> {
  const token = await getToken()
  if (!token) return false
  const { ok } = await feathersFetch(`/people/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(personPayload(input)),
  })
  return ok
}

/** Persist a card's new canvas position (called debounced from the drag handler). */
export async function moveTreePerson(
  _familyId: string,
  id: string,
  x: number,
  y: number
): Promise<void> {
  const token = await getToken()
  if (!token) return
  await feathersFetch(`/people/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ treeX: x, treeY: y }),
  })
}

/** Set (or change) a couple's marriage status — an idempotent spouse MERGE on the backend. */
export async function setSpouseStatusAction(
  familyId: string,
  aId: string,
  bId: string,
  status: SpouseStatus
): Promise<void> {
  const token = await getToken()
  if (!token) return
  await linkSpouse(token, familyId, aId, bId, status)
}

/** Delete a person; the people remove-hook DETACH DELETEs the node and all its edges. */
export async function deleteTreePerson(_familyId: string, id: string): Promise<void> {
  const token = await getToken()
  if (!token) return
  await feathersFetch(`/people/${id}`, { method: "DELETE", token })
}
