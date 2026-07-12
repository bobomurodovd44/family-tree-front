// Client-safe family-tree domain model + pure display helpers. NOTHING `server-only` may be
// imported here — the canvas client components import this directly. The shape deliberately
// mirrors the future Neo4j `tree` read-service output (docs/ARCHITECTURE.md): a lightweight
// person projection plus the relationship arrays, so wiring the real backend later needs no
// change to the UI. Edges (marriage + parent→child) are DERIVED from these arrays, never a
// separate source of truth — that's what lets a relationship line follow a card as it moves.

export type Gender = "male" | "female"

// Marriage status. `divorced` renders as EX-WIFE / EX-HUSBAND, `widowed` as WIDOW / WIDOWER.
// Maps 1:1 to the planned Neo4j SPOUSE_OF { status } edge.
export type SpouseStatus = "married" | "divorced" | "widowed"

// Parent link kind — maps to the planned Neo4j PARENT_OF { kind } edge.
export type ParentKind = "biological" | "adoptive" | "step"

export interface SpouseLink {
  id: string
  status: SpouseStatus
  /** 1-based marriage order; distinguishes multiple marriages of the same person. */
  order?: number
}

export interface TreePerson {
  id: string
  firstName: string
  middleName?: string
  lastName?: string
  /** Presigned photo URL when we have one; cards fall back to initials otherwise. */
  avatar?: string
  gender: Gender
  maritalStatus?: SpouseStatus | "single"
  birthYear?: number
  deathYear?: number
  isLiving?: boolean
  /** Biography (tarjimai hol). NOT loaded by the tree read service (kept off the graph node); it's
   * lazy-loaded into the edit form and set here after a local edit, so the narration cache key
   * reflects bio changes. Undefined for freshly-loaded people. */
  bio?: string
  /** World-space coordinates (top-left of the card). Positions are data, never hard-coded. */
  x: number
  y: number
  parents: string[] // parent person ids (father/mother inferred from the parent's gender)
  spouses: SpouseLink[]
  children: string[] // kept in sync from `parents` by normalizeTree — do not hand-edit
}

/** People keyed by id for O(1) lookup while dragging / editing. */
export type PeopleMap = Record<string, TreePerson>

// ── Display helpers ───────────────────────────────────────────────────────────────────────

/** Full display name; falls back to a placeholder for freshly-added, unnamed people. */
export function personName(p: Pick<TreePerson, "firstName" | "lastName">): string {
  const name = [p.firstName, p.lastName].filter(Boolean).join(" ").trim()
  return name || "New person"
}

/** "1950 – 2001" | "1950 –" | "– 2001" | "" — the year label under a person's name. */
export function lifeYears(p: Pick<TreePerson, "birthYear" | "deathYear">): string {
  const { birthYear: b, deathYear: d } = p
  if (b && d) return `${b} – ${d}`
  if (b) return `${b} –`
  if (d) return `– ${d}`
  return ""
}

/** Relationship badge for a spouse, from their gender + the marriage status. */
export function spouseLabel(spouseGender: Gender, status: SpouseStatus, t: (key: string) => string): string {
  const female = spouseGender === "female"
  if (status === "divorced") return female ? t("exWife") : t("exHusband")
  if (status === "widowed") return female ? t("widow") : t("widower")
  return female ? t("wife") : t("husband")
}

export function childLabel(childGender: Gender, t: (key: string) => string): string {
  return childGender === "female" ? t("daughter") : t("son")
}

export function parentLabel(parentGender: Gender, t: (key: string) => string): string {
  return parentGender === "female" ? t("mother") : t("father")
}

/**
 * Client-side cache key for a person's narration audio, over the narration-relevant fields the
 * in-tree form can edit. When it changes, the ListenButton refetches (the backend hash is the
 * authoritative gate and also covers off-card fields like birthplace/profession across reloads).
 */
export function narrationSignature(
  p: Pick<TreePerson, "firstName" | "middleName" | "lastName" | "birthYear" | "deathYear" | "isLiving" | "bio">
): string {
  return [
    p.firstName ?? "",
    p.middleName ?? "",
    p.lastName ?? "",
    p.birthYear ?? "",
    p.deathYear ?? "",
    p.isLiving ?? "",
    p.bio ?? "",
  ].join("|")
}

// ── Derivation & normalization ──────────────────────────────────────────────────────────────

export interface MarriageEdge {
  id: string
  a: string
  b: string
  status: SpouseStatus
}

export interface ParentEdge {
  id: string
  parent: string
  child: string
}

/** All relationship edges, deduped. Marriage edges are undirected (one per couple). */
export function deriveEdges(people: PeopleMap): {
  marriages: MarriageEdge[]
  parents: ParentEdge[]
} {
  const marriages: MarriageEdge[] = []
  const seen = new Set<string>()
  for (const p of Object.values(people)) {
    for (const link of p.spouses) {
      if (!people[link.id]) continue
      const key = [p.id, link.id].sort().join("~")
      if (seen.has(key)) continue
      seen.add(key)
      marriages.push({ id: `m:${key}`, a: p.id, b: link.id, status: link.status })
    }
  }

  const parents: ParentEdge[] = []
  for (const p of Object.values(people)) {
    for (const childId of p.children) {
      if (!people[childId]) continue
      parents.push({ id: `pc:${p.id}->${childId}`, parent: p.id, child: childId })
    }
  }
  return { marriages, parents }
}

/**
 * Label describing how `personId` relates to the currently-selected person (for the on-card
 * relationship badge — WIFE / EX-WIFE / SON / MOTHER / SIBLING …). Null when unrelated.
 */
export function relationLabel(
  people: PeopleMap,
  selectedId: string,
  personId: string,
  t: (key: string) => string
): string | null {
  if (selectedId === personId) return null
  const sel = people[selectedId]
  const person = people[personId]
  if (!sel || !person) return null

  const spouse = sel.spouses.find((s) => s.id === personId)
  if (spouse) return spouseLabel(person.gender, spouse.status, t)
  if (sel.children.includes(personId)) return childLabel(person.gender, t)
  if (sel.parents.includes(personId)) return parentLabel(person.gender, t)

  const parentSet = new Set(sel.parents)
  if (sel.parents.length > 0 && person.parents.some((pid) => parentSet.has(pid))) return t("sibling")
  return null
}

/** People who share at least one parent with `id` — siblings are derived, never stored. */
export function siblingsOf(people: PeopleMap, id: string): TreePerson[] {
  const self = people[id]
  if (!self || self.parents.length === 0) return []
  const parentSet = new Set(self.parents)
  return Object.values(people).filter(
    (other) => other.id !== id && other.parents.some((pid) => parentSet.has(pid))
  )
}

/** The person's current (married) spouse, if any — used to co-parent newly added children. */
export function currentSpouseId(people: PeopleMap, id: string): string | undefined {
  const p = people[id]
  return p?.spouses.find((s) => s.status === "married" && people[s.id])?.id
}

/**
 * Return a consistent copy of the tree: `children` recomputed from `parents`, spouse links
 * mirrored on both partners, and dangling ids dropped. Every person object is freshly copied,
 * so callers get an immutable result — but this touches every node, so use it for structural
 * edits only (add/remove/link), never on the hot drag path (see moveNode in use-family-tree).
 */
export function normalizeTree(people: PeopleMap): PeopleMap {
  const next: PeopleMap = {}
  for (const id in people) {
    const p = people[id]
    next[id] = {
      ...p,
      parents: [...new Set(p.parents.filter((pid) => people[pid]))],
      spouses: p.spouses.filter((s) => people[s.id]).map((s) => ({ ...s })),
      children: [],
    }
  }

  // Mirror spouse links so both partners reference each other with the same status/order.
  for (const id in next) {
    for (const link of next[id].spouses) {
      const other = next[link.id]
      if (!other) continue
      const back = other.spouses.find((s) => s.id === id)
      if (!back) {
        other.spouses.push({ id, status: link.status, order: link.order })
      } else {
        back.status = link.status // keep couple's status in agreement
      }
    }
  }

  // Recompute children from parents.
  for (const id in next) {
    for (const pid of next[id].parents) {
      if (next[pid] && !next[pid].children.includes(id)) next[pid].children.push(id)
    }
  }

  return next
}
