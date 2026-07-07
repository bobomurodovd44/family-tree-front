"use client"

// Client-side family-tree state backed by the real Neo4j/Mongo backend. Holds the people map as
// optimistic local state (so the canvas stays 60fps-snappy) and mirrors every change to the
// server via the tree server actions. Two update paths, as before:
//
//  • moveNode  — the hot drag path. Replaces ONLY the moved person object (memoized cards/lines
//    keep their identity), and persists the new position with a debounced PATCH.
//  • everything else — structural edits routed through normalizeTree, which rebuilds derived
//    `children` + mirrored spouse links.
//
// Adds use a PENDING-PLACEHOLDER pattern: "add parent/child/spouse/person" drops a LOCAL-ONLY
// placeholder card (temp id) and opens the form; nothing is written until the user saves
// (commitPerson) — at which point the person + its relationship are created and the temp id is
// swapped for the real Mongo _id. Cancelling (closing the form unsaved) discards the placeholder.
// This keeps temp→real reconciliation to a single childless node.

import { useCallback, useEffect, useRef, useState } from "react"

import {
  currentSpouseId,
  normalizeTree,
  type Gender,
  type PeopleMap,
  type SpouseStatus,
  type TreePerson,
} from "@/lib/tree-types"
import { CARD_W, computeLayout, H_GAP, ROW } from "@/lib/tree-layout"
import {
  addChildAction,
  addParentAction,
  addSpouseAction,
  createTreePerson,
  deleteTreePerson,
  moveTreePerson,
  patchTreePerson,
  setSpouseStatusAction,
  type TreePersonInput,
} from "@/app/families/[familyId]/tree/actions"

const MOVE_DEBOUNCE_MS = 400

let seq = 0
const newId = () => `p_${Date.now().toString(36)}${(seq++).toString(36)}`

function placeholder(gender: Gender, x: number, y: number): TreePerson {
  return { id: newId(), firstName: "", gender, isLiving: true, x, y, parents: [], spouses: [], children: [] }
}

export interface PersonPatch {
  firstName?: string
  lastName?: string
  gender?: Gender
  birthYear?: number
  deathYear?: number
  isLiving?: boolean
  avatar?: string
}

// What still-unsaved placeholder to create on commit, and how to link it.
type Pending =
  | { kind: "person" }
  | { kind: "parent"; childId: string }
  | { kind: "child"; parentId: string; coParentId: string | null }
  | { kind: "spouse"; personId: string; status: SpouseStatus; order: number }

export interface FamilyTree {
  people: PeopleMap
  moveNode: (id: string, x: number, y: number) => void
  addPerson: (x: number, y: number, gender?: Gender) => string
  addParentTo: (childId: string) => string
  addChildTo: (parentId: string) => string
  addSpouseTo: (personId: string, status: SpouseStatus) => string
  /** Save a person's form: creates+links a pending placeholder, or patches an existing person. */
  commitPerson: (id: string, patch: PersonPatch) => void
  /** Discard an unsaved placeholder (form closed without saving). */
  cancelPending: (id: string) => void
  setSpouseStatus: (aId: string, bId: string, status: SpouseStatus) => void
  deletePerson: (id: string) => void
  autoArrange: () => void
}

// Build the server input from the form patch (falling back to the current node where the patch
// omits a field — e.g. gender on a fresh placeholder).
function toInput(patch: PersonPatch, node?: TreePerson): TreePersonInput {
  return {
    firstName: (patch.firstName ?? node?.firstName ?? "").trim(),
    lastName: patch.lastName ?? node?.lastName,
    gender: patch.gender ?? node?.gender ?? "male",
    birthYear: patch.birthYear,
    deathYear: patch.deathYear,
    isLiving: patch.isLiving,
  }
}

// Replace a committed placeholder's temp id with the real Mongo _id, fixing the one edge that
// referenced it (normalizeTree, run by the caller, rebuilds mirrors + derived children).
function swapId(draft: PeopleMap, tempId: string, realId: string, pending: Pending): void {
  const node = draft[tempId]
  if (!node) return
  draft[realId] = { ...node, id: realId }
  delete draft[tempId]

  if (pending.kind === "parent") {
    const child = draft[pending.childId]
    if (child) {
      draft[pending.childId] = {
        ...child,
        parents: child.parents.map((p) => (p === tempId ? realId : p)),
      }
    }
  } else if (pending.kind === "spouse") {
    const person = draft[pending.personId]
    if (person) {
      draft[pending.personId] = {
        ...person,
        spouses: person.spouses.map((s) => (s.id === tempId ? { ...s, id: realId } : s)),
      }
    }
  }
  // "child"/"person": the node's own parents already hold real ids; nothing else points at tempId.
}

export function useFamilyTree(familyId: string, initial: PeopleMap): FamilyTree {
  const [people, setPeople] = useState<PeopleMap>(() => normalizeTree(initial))

  // Latest people for reads inside stable callbacks (synced after commit).
  const peopleRef = useRef(people)
  useEffect(() => {
    peopleRef.current = people
  }, [people])

  // Unsaved placeholders and the links to create for them; ids currently mid-save (so a close
  // event doesn't cancel a save in flight); and per-node debounced position-save timers.
  const pendingRef = useRef<Map<string, Pending>>(new Map())
  const committingRef = useRef<Set<string>>(new Set())
  const moveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(
    () => () => {
      for (const t of moveTimers.current.values()) clearTimeout(t)
    },
    []
  )

  // Structural edit: apply `fn` to a shallow copy, then normalize.
  const structural = useCallback((fn: (draft: PeopleMap) => void) => {
    setPeople((cur) => {
      const draft: PeopleMap = { ...cur }
      fn(draft)
      return normalizeTree(draft)
    })
  }, [])

  const scheduleMove = useCallback(
    (id: string, x: number, y: number) => {
      if (pendingRef.current.has(id)) return // unsaved placeholder — no server row yet
      const timers = moveTimers.current
      const prev = timers.get(id)
      if (prev) clearTimeout(prev)
      timers.set(
        id,
        setTimeout(() => {
          timers.delete(id)
          void moveTreePerson(familyId, id, x, y)
        }, MOVE_DEBOUNCE_MS)
      )
    },
    [familyId]
  )

  const moveNode = useCallback(
    (id: string, x: number, y: number) => {
      setPeople((cur) => {
        const p = cur[id]
        if (!p) return cur
        return { ...cur, [id]: { ...p, x, y } }
      })
      scheduleMove(id, x, y)
    },
    [scheduleMove]
  )

  const addPerson = useCallback(
    (x: number, y: number, gender: Gender = "male") => {
      const person = placeholder(gender, x, y)
      pendingRef.current.set(person.id, { kind: "person" })
      structural((draft) => {
        draft[person.id] = person
      })
      return person.id
    },
    [structural]
  )

  const addParentTo = useCallback(
    (childId: string) => {
      const child = peopleRef.current[childId]
      if (!child) return ""
      const parent = placeholder("male", child.x, child.y - ROW)
      pendingRef.current.set(parent.id, { kind: "parent", childId })
      structural((draft) => {
        const c = draft[childId]
        if (!c) return
        draft[parent.id] = parent
        draft[childId] = { ...c, parents: [...c.parents, parent.id] }
      })
      return parent.id
    },
    [structural]
  )

  const addChildTo = useCallback(
    (parentId: string) => {
      const parent = peopleRef.current[parentId]
      if (!parent) return ""
      const coParentId = currentSpouseId(peopleRef.current, parentId) ?? null
      const child = placeholder("male", parent.x, parent.y + ROW)
      child.parents = coParentId ? [parentId, coParentId] : [parentId]
      pendingRef.current.set(child.id, { kind: "child", parentId, coParentId })
      structural((draft) => {
        if (!draft[parentId]) return
        draft[child.id] = child
      })
      return child.id
    },
    [structural]
  )

  const addSpouseTo = useCallback(
    (personId: string, status: SpouseStatus) => {
      const person = peopleRef.current[personId]
      if (!person) return ""
      const order = person.spouses.length + 1
      const spouse = placeholder(
        person.gender === "male" ? "female" : "male",
        person.x + CARD_W + H_GAP,
        person.y
      )
      pendingRef.current.set(spouse.id, { kind: "spouse", personId, status, order })
      structural((draft) => {
        const p = draft[personId]
        if (!p) return
        draft[spouse.id] = spouse
        draft[personId] = { ...p, spouses: [...p.spouses, { id: spouse.id, status, order }] }
      })
      return spouse.id
    },
    [structural]
  )

  const commitPerson = useCallback(
    (id: string, patch: PersonPatch) => {
      const pending = pendingRef.current.get(id)
      // Optimistic: reflect the entered fields on the card immediately.
      structural((draft) => {
        const p = draft[id]
        if (p) draft[id] = { ...p, ...patch }
      })

      if (!pending) {
        void patchTreePerson(familyId, id, toInput(patch, peopleRef.current[id]))
        return
      }

      committingRef.current.add(id) // guard against a concurrent cancel from the dialog close
      void (async () => {
        const node = peopleRef.current[id]
        const input = toInput(patch, node)
        const x = node?.x ?? 0
        const y = node?.y ?? 0
        let realId: string | null = null
        try {
          if (pending.kind === "person") realId = await createTreePerson(familyId, input, x, y)
          else if (pending.kind === "parent")
            realId = await addParentAction(familyId, pending.childId, input, x, y)
          else if (pending.kind === "child")
            realId = await addChildAction(familyId, pending.parentId, pending.coParentId, input, x, y)
          else realId = await addSpouseAction(familyId, pending.personId, pending.status, pending.order, input, x, y)
        } catch (error) {
          console.error("Failed to save person", error)
        }
        committingRef.current.delete(id)
        pendingRef.current.delete(id)
        if (!realId) return // keep the local card; the change just isn't persisted
        setPeople((cur) => {
          const draft = { ...cur }
          swapId(draft, id, realId, pending)
          return normalizeTree(draft)
        })
      })()
    },
    [structural, familyId]
  )

  const cancelPending = useCallback((id: string) => {
    if (!pendingRef.current.has(id) || committingRef.current.has(id)) return
    pendingRef.current.delete(id)
    setPeople((cur) => {
      const draft = { ...cur }
      delete draft[id]
      return normalizeTree(draft)
    })
  }, [])

  const setSpouseStatus = useCallback(
    (aId: string, bId: string, status: SpouseStatus) => {
      structural((draft) => {
        for (const [x, y] of [
          [aId, bId],
          [bId, aId],
        ]) {
          const p = draft[x]
          if (!p) continue
          draft[x] = { ...p, spouses: p.spouses.map((s) => (s.id === y ? { ...s, status } : s)) }
        }
      })
      // Persist only once both partners exist server-side (a pending partner carries the status
      // into its own create).
      if (!pendingRef.current.has(aId) && !pendingRef.current.has(bId)) {
        void setSpouseStatusAction(familyId, aId, bId, status)
      }
    },
    [structural, familyId]
  )

  const deletePerson = useCallback(
    (id: string) => {
      const wasPending = pendingRef.current.has(id)
      pendingRef.current.delete(id)
      structural((draft) => {
        delete draft[id]
      })
      if (!wasPending) void deleteTreePerson(familyId, id)
    },
    [structural, familyId]
  )

  const autoArrange = useCallback(() => {
    const laid = computeLayout(peopleRef.current)
    setPeople(laid)
    for (const id in laid) {
      if (!pendingRef.current.has(id)) scheduleMove(id, laid[id].x, laid[id].y)
    }
  }, [scheduleMove])

  return {
    people,
    moveNode,
    addPerson,
    addParentTo,
    addChildTo,
    addSpouseTo,
    commitPerson,
    cancelPending,
    setSpouseStatus,
    deletePerson,
    autoArrange,
  }
}
