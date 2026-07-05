"use client"

// One relationship edge as an animated SVG path. Lives in the world-space <svg> layer beneath
// the cards. The `d` is recomputed from the live endpoint cards on every render, so a line
// tracks its people as they move. Memoized on the endpoint person objects, so a drag only
// re-renders the handful of lines actually touching the moved card.

import { memo } from "react"
import { motion } from "motion/react"

import {
  marriagePath,
  parentChildPath,
  type Point,
} from "@/lib/tree-layout"
import type { SpouseStatus } from "@/lib/tree-types"

export interface RelationshipLineProps {
  kind: "marriage" | "parent-child"
  from: Point
  to: Point
  status?: SpouseStatus
  active: boolean
}

function RelationshipLineImpl({ kind, from, to, status, active }: RelationshipLineProps) {
  const d = kind === "marriage" ? marriagePath(from, to) : parentChildPath(from, to)
  // Divorced marriages read as a dashed, muted line; everything else is solid.
  const dashed = kind === "marriage" && status === "divorced"

  const stroke = active
    ? "var(--color-primary)"
    : kind === "marriage"
      ? "var(--color-muted-foreground)"
      : "var(--color-border)"

  return (
    <motion.path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={kind === "marriage" ? 2.5 : 2}
      strokeLinecap="round"
      strokeDasharray={dashed ? "6 6" : undefined}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: active ? 1 : kind === "marriage" ? 0.9 : 0.7 }}
      transition={{ pathLength: { duration: 0.6, ease: "easeInOut" }, opacity: { duration: 0.3 } }}
    />
  )
}

export const RelationshipLine = memo(RelationshipLineImpl)
