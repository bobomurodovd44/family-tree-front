// Pure geometry + auto-layout for the family-tree canvas. Client-safe (no `server-only`), no
// React. Everything works in WORLD coordinates (the untransformed coordinate space the cards
// live in); the canvas applies pan/zoom as a single transform on the world layer.

import type { PeopleMap } from "@/lib/tree-types"

// Card + spacing constants. Kept here so both the layout and the card component agree on size.
export const CARD_W = 208
export const CARD_H = 132
export const H_GAP = 44 // horizontal gap between cards within a generation
export const V_GAP = 116 // vertical gap between generations
export const COL = CARD_W + H_GAP
export const ROW = CARD_H + V_GAP

export interface Point {
  x: number
  y: number
}

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

// ── Card anchor points (world space) ────────────────────────────────────────────────────────

export const cardCenter = (p: Point): Point => ({ x: p.x + CARD_W / 2, y: p.y + CARD_H / 2 })
export const cardTop = (p: Point): Point => ({ x: p.x + CARD_W / 2, y: p.y })
export const cardBottom = (p: Point): Point => ({ x: p.x + CARD_W / 2, y: p.y + CARD_H })
export const cardLeft = (p: Point): Point => ({ x: p.x, y: p.y + CARD_H / 2 })
export const cardRight = (p: Point): Point => ({ x: p.x + CARD_W, y: p.y + CARD_H / 2 })

// ── SVG path builders (return the `d` attribute) ──────────────────────────────────────────────

/** A smooth vertical bezier from a parent's bottom to a child's top (React-Flow-like). */
export function parentChildPath(parent: Point, child: Point): string {
  const s = cardBottom(parent)
  const e = cardTop(child)
  const dy = Math.max(28, (e.y - s.y) / 2)
  return `M ${s.x},${s.y} C ${s.x},${s.y + dy} ${e.x},${e.y - dy} ${e.x},${e.y}`
}

/** A short horizontal connector between the facing inner edges of two spouse cards. */
export function marriagePath(a: Point, b: Point): string {
  const [left, right] = a.x <= b.x ? [a, b] : [b, a]
  const s = cardRight(left)
  const e = cardLeft(right)
  const mx = (s.x + e.x) / 2
  return `M ${s.x},${s.y} C ${mx},${s.y} ${mx},${e.y} ${e.x},${e.y}`
}

/** Midpoint of a couple's cards — where their children's connectors fan out from. */
export function coupleAnchor(a: Point, b: Point): Point {
  return { x: (cardCenter(a).x + cardCenter(b).x) / 2, y: Math.max(cardBottom(a).y, cardBottom(b).y) }
}

// ── Bounds ────────────────────────────────────────────────────────────────────────────────

/** World-space bounding box of all cards (empty → a small box at the origin). */
export function contentBounds(people: PeopleMap): Bounds {
  const list = Object.values(people)
  if (list.length === 0) {
    return { minX: 0, minY: 0, maxX: CARD_W, maxY: CARD_H, width: CARD_W, height: CARD_H }
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of list) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x + CARD_W)
    maxY = Math.max(maxY, p.y + CARD_H)
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

// ── Auto-layout ─────────────────────────────────────────────────────────────────────────────

/** Generation (row) index per person = longest path from a root, with a cycle guard. */
function generations(people: PeopleMap): Record<string, number> {
  const gen: Record<string, number> = {}
  const visiting = new Set<string>()
  const depth = (id: string): number => {
    if (gen[id] != null) return gen[id]
    if (visiting.has(id)) return 0 // defensive: never recurse through a cycle
    visiting.add(id)
    const parents = people[id].parents.filter((pid) => people[pid])
    const g = parents.length === 0 ? 0 : Math.max(...parents.map(depth)) + 1
    visiting.delete(id)
    return (gen[id] = g)
  }
  for (const id in people) depth(id)
  return gen
}

/**
 * Compute a tidy genealogy layout: generations become rows, spouses sit adjacent, and each
 * generation is ordered by the average position of its parents (barycenter) to reduce crossings.
 * Rows are centered against the widest row so the tree looks balanced. Deterministic. Used to
 * seed positions for people without saved coordinates and to power the "Auto-arrange" button.
 */
export function computeLayout(people: PeopleMap): PeopleMap {
  const ids = Object.keys(people)
  if (ids.length === 0) return people

  const gen = generations(people)
  const rows: string[][] = []
  for (const id of ids) (rows[gen[id]] ||= []).push(id)

  const slot: Record<string, number> = {} // horizontal slot index, assigned row by row

  rows.forEach((row, g) => {
    if (!row) return
    const parentBary = (id: string): number => {
      const ps = people[id].parents.filter((pid) => gen[pid] === g - 1 && slot[pid] != null)
      if (ps.length === 0) return Number.MAX_SAFE_INTEGER // unparented → drift to the end
      return ps.reduce((sum, pid) => sum + slot[pid], 0) / ps.length
    }

    const ordered = g === 0 ? [...row] : [...row].sort((a, b) => parentBary(a) - parentBary(b))

    // Emit the order, pulling each person's same-row spouses in right after them so couples
    // stay adjacent.
    const placed = new Set<string>()
    const inRow = new Set(row)
    let index = 0
    for (const id of ordered) {
      if (placed.has(id)) continue
      slot[id] = index++
      placed.add(id)
      for (const link of people[id].spouses) {
        if (inRow.has(link.id) && !placed.has(link.id)) {
          slot[link.id] = index++
          placed.add(link.id)
        }
      }
    }
  })

  const widths = rows.map((row) => (row ? Math.max(...row.map((id) => slot[id])) + 1 : 0))
  const maxWidth = Math.max(1, ...widths)

  const out: PeopleMap = {}
  rows.forEach((row, g) => {
    if (!row) return
    const offset = ((maxWidth - widths[g]) / 2) * COL
    for (const id of row) {
      out[id] = { ...people[id], x: offset + slot[id] * COL, y: g * ROW }
    }
  })
  return out
}
