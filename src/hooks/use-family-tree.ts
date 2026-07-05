"use client"

// Client-side family-tree state: the people map + all mutating actions, persisted to
// localStorage per family (the demo stand-in for the future server actions). Two update paths:
//
//  • moveNode  — the hot drag path. Replaces ONLY the moved person object, so every other
//    memoized card/line keeps its identity and skips re-rendering (60fps target).
//  • everything else — structural edits routed through normalizeTree, which rebuilds derived
//    `children` + mirrored spouse links. Infrequent, so touching all nodes is fine.

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

const storageKey = (familyId: string) => `shajara:tree:${familyId}`

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

export interface FamilyTree {
  people: PeopleMap
  moveNode: (id: string, x: number, y: number) => void
  addPerson: (x: number, y: number, gender?: Gender) => string
  addParentTo: (childId: string) => string
  addChildTo: (parentId: string) => string
  addSpouseTo: (personId: string, status: SpouseStatus) => string
  editPerson: (id: string, patch: PersonPatch) => void
  setSpouseStatus: (aId: string, bId: string, status: SpouseStatus) => void
  deletePerson: (id: string) => void
  autoArrange: () => void
  resetTree: () => void
}

export function useFamilyTree(familyId: string, initial: PeopleMap): FamilyTree {
  const [people, setPeople] = useState<PeopleMap>(() => normalizeTree(initial))
  const initialRef = useRef(initial)
  const loaded = useRef(false)

  // Hydrate saved positions/edits once, after mount (localStorage is client-only).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(familyId))
      // Loading persisted state must happen after mount (localStorage is client-only), and
      // seeding it during render would cause an SSR/hydration mismatch — so this setState is
      // intentional despite the lint rule.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setPeople(normalizeTree(JSON.parse(raw) as PeopleMap))
    } catch {
      /* corrupt or unavailable storage — fall back to the seed already in state */
    }
    loaded.current = true
  }, [familyId])

  // Persist after every change (skips the hydration pass). Debounced so a drag — which fires
  // many moveNode updates per second — coalesces into a single write instead of thrashing.
  useEffect(() => {
    if (!loaded.current) return
    const t = setTimeout(() => {
      try {
        localStorage.setItem(storageKey(familyId), JSON.stringify(people))
      } catch {
        /* quota / private mode — non-fatal for a demo */
      }
    }, 300)
    return () => clearTimeout(t)
  }, [familyId, people])

  // Structural edit: apply `fn` to a shallow copy, then normalize.
  const structural = useCallback((fn: (draft: PeopleMap) => void) => {
    setPeople((cur) => {
      const draft: PeopleMap = { ...cur }
      fn(draft)
      return normalizeTree(draft)
    })
  }, [])

  const moveNode = useCallback((id: string, x: number, y: number) => {
    setPeople((cur) => {
      const p = cur[id]
      if (!p) return cur
      return { ...cur, [id]: { ...p, x, y } }
    })
  }, [])

  const addPerson = useCallback(
    (x: number, y: number, gender: Gender = "male") => {
      const person = placeholder(gender, x, y)
      structural((draft) => {
        draft[person.id] = person
      })
      return person.id
    },
    [structural]
  )

  const addChildTo = useCallback(
    (parentId: string) => {
      let id = ""
      structural((draft) => {
        const parent = draft[parentId]
        if (!parent) return
        const parents = [parentId]
        const spouse = currentSpouseId(draft, parentId)
        if (spouse) parents.push(spouse)
        const child = placeholder("male", parent.x, parent.y + ROW)
        child.parents = parents
        draft[child.id] = child
        id = child.id
      })
      return id
    },
    [structural]
  )

  const addParentTo = useCallback(
    (childId: string) => {
      let id = ""
      structural((draft) => {
        const child = draft[childId]
        if (!child) return
        const parent = placeholder("male", child.x, child.y - ROW)
        draft[parent.id] = parent
        draft[childId] = { ...child, parents: [...child.parents, parent.id] }
        id = parent.id
      })
      return id
    },
    [structural]
  )

  const addSpouseTo = useCallback(
    (personId: string, status: SpouseStatus) => {
      let id = ""
      structural((draft) => {
        const person = draft[personId]
        if (!person) return
        const spouse = placeholder(
          person.gender === "male" ? "female" : "male",
          person.x + CARD_W + H_GAP,
          person.y
        )
        draft[spouse.id] = spouse
        draft[personId] = {
          ...person,
          spouses: [...person.spouses, { id: spouse.id, status, order: person.spouses.length + 1 }],
        }
        id = spouse.id
      })
      return id
    },
    [structural]
  )

  const editPerson = useCallback(
    (id: string, patch: PersonPatch) => {
      structural((draft) => {
        const p = draft[id]
        if (!p) return
        draft[id] = { ...p, ...patch }
      })
    },
    [structural]
  )

  const setSpouseStatus = useCallback(
    (aId: string, bId: string, status: SpouseStatus) => {
      structural((draft) => {
        for (const [x, y] of [
          [aId, bId],
          [bId, aId],
        ]) {
          const p = draft[x]
          if (!p) continue
          draft[x] = {
            ...p,
            spouses: p.spouses.map((s) => (s.id === y ? { ...s, status } : s)),
          }
        }
      })
    },
    [structural]
  )

  const deletePerson = useCallback(
    (id: string) => {
      structural((draft) => {
        delete draft[id]
      })
    },
    [structural]
  )

  const autoArrange = useCallback(() => {
    setPeople((cur) => computeLayout(cur))
  }, [])

  const resetTree = useCallback(() => {
    try {
      localStorage.removeItem(storageKey(familyId))
    } catch {
      /* ignore */
    }
    setPeople(normalizeTree(initialRef.current))
  }, [familyId])

  return {
    people,
    moveNode,
    addPerson,
    addParentTo,
    addChildTo,
    addSpouseTo,
    editPerson,
    setSpouseStatus,
    deletePerson,
    autoArrange,
    resetTree,
  }
}
