"use client"

// A single person card, positioned in WORLD space inside the transformed canvas layer. Dragging
// is handled manually (not motion's `drag`) so we can divide the pointer delta by the live zoom
// scale — otherwise a card would race away from the cursor when zoomed. The component is memoized
// so pan/zoom (which only changes the parent transform) never re-renders it.

import { memo } from "react"
import { useRef, useState } from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { lifeYears, personName, type TreePerson } from "@/lib/tree-types"
import { CARD_H, CARD_W } from "@/lib/tree-layout"
import { PersonAvatar } from "@/components/people/person-avatar"
import { Badge } from "@/components/ui/badge"

export interface FamilyNodeProps {
  person: TreePerson
  selected: boolean
  /** Relationship-to-selected label (WIFE / SON / …), shown only while another card is selected. */
  relationLabel: string | null
  dimmed: boolean
  getScale: () => number
  onSelect: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
  onOpenDetails: (id: string) => void
  onContextMenu: (id: string, clientX: number, clientY: number) => void
}

const DRAG_THRESHOLD = 3

function FamilyNodeImpl({
  person,
  selected,
  relationLabel,
  dimmed,
  getScale,
  onSelect,
  onMove,
  onOpenDetails,
  onContextMenu,
}: FamilyNodeProps) {
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ px: number; py: number; ox: number; oy: number; moved: boolean } | null>(
    null
  )

  const name = personName(person)
  const years = lifeYears(person)
  const deceased = person.isLiving === false || person.deathYear != null

  function handlePointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return // left button drives select + drag; right opens the context menu
    e.stopPropagation() // don't let the canvas background start a pan
    onSelect(person.id)
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { px: e.clientX, py: e.clientY, ox: person.x, oy: person.y, moved: false }
  }

  function handlePointerMove(e: React.PointerEvent) {
    const d = drag.current
    if (!d) return
    if (!d.moved && Math.hypot(e.clientX - d.px, e.clientY - d.py) < DRAG_THRESHOLD) return
    if (!d.moved) {
      d.moved = true
      setDragging(true)
    }
    const scale = getScale()
    onMove(person.id, d.ox + (e.clientX - d.px) / scale, d.oy + (e.clientY - d.py) / scale)
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (drag.current) e.currentTarget.releasePointerCapture(e.pointerId)
    drag.current = null
    setDragging(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{
        opacity: dimmed ? 0.4 : 1,
        scale: selected ? 1.04 : 1,
        x: person.x,
        y: person.y,
      }}
      transition={dragging ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 42 }}
      whileHover={{ scale: selected ? 1.05 : 1.03 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onOpenDetails(person.id)
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onSelect(person.id)
        onContextMenu(person.id, e.clientX, e.clientY)
      }}
      style={{ position: "absolute", top: 0, left: 0, width: CARD_W, minHeight: CARD_H }}
      className={cn(
        "group flex select-none flex-col items-center gap-1.5 rounded-[20px] border bg-card px-4 pt-4 pb-3 text-center shadow-sm",
        "transition-[box-shadow,border-color] duration-200",
        dragging ? "cursor-grabbing" : "cursor-grab",
        selected
          ? "border-primary shadow-lg shadow-primary/25 ring-4 ring-primary/20"
          : "border-border hover:border-primary/40 hover:shadow-md",
        deceased && "bg-muted/40"
      )}
    >
      {/* living / deceased dot */}
      <span
        aria-hidden
        className={cn(
          "absolute top-3 left-3 size-2 rounded-full",
          deceased ? "bg-muted-foreground/50" : "bg-emerald-500"
        )}
      />
      {/* gender dot */}
      <span
        aria-hidden
        title={person.gender}
        className={cn(
          "absolute top-3 right-3 size-2 rounded-full",
          person.gender === "female" ? "bg-rose-400" : "bg-sky-400"
        )}
      />

      <PersonAvatar
        name={name}
        src={person.avatar}
        className={cn(
          "size-14 ring-2 ring-offset-2 ring-offset-card",
          person.gender === "female" ? "ring-rose-200 dark:ring-rose-400/40" : "ring-sky-200 dark:ring-sky-400/40"
        )}
        sizes="56px"
      />

      <div className="flex min-w-0 flex-col items-center gap-0.5">
        <p
          className={cn(
            "max-w-full truncate text-sm font-semibold leading-tight tracking-tight",
            !person.firstName && "text-muted-foreground italic"
          )}
        >
          {name}
        </p>
        {years ? <p className="text-xs text-muted-foreground tabular-nums">{years}</p> : null}
      </div>

      {relationLabel ? (
        <Badge variant="secondary" className="mt-0.5">
          {relationLabel}
        </Badge>
      ) : null}
    </motion.div>
  )
}

export const FamilyNode = memo(FamilyNodeImpl)
