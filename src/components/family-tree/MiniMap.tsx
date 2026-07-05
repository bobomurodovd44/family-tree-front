"use client"

// Bottom-left overview map: every card as a tiny rect + a rectangle for the current viewport.
// Clicking recenters the canvas on the clicked world point.

import { motion } from "motion/react"

import { CARD_H, CARD_W, type Bounds } from "@/lib/tree-layout"
import type { TreePerson } from "@/lib/tree-types"
import type { Viewport } from "@/hooks/use-canvas-viewport"

const MW = 184
const MH = 124
const PAD = 10

export interface MiniMapProps {
  people: TreePerson[]
  bounds: Bounds
  viewport: Viewport
  containerSize: { width: number; height: number }
  onJump: (worldX: number, worldY: number) => void
}

export function MiniMap({ people, bounds, viewport, containerSize, onJump }: MiniMapProps) {
  const s = Math.min(
    (MW - PAD * 2) / Math.max(bounds.width, 1),
    (MH - PAD * 2) / Math.max(bounds.height, 1)
  )
  const offX = (MW - bounds.width * s) / 2
  const offY = (MH - bounds.height * s) / 2
  const toX = (wx: number) => offX + (wx - bounds.minX) * s
  const toY = (wy: number) => offY + (wy - bounds.minY) * s

  // Visible world region derived from the viewport transform.
  const vx = -viewport.x / viewport.scale
  const vy = -viewport.y / viewport.scale
  const vw = containerSize.width / viewport.scale
  const vh = containerSize.height / viewport.scale

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const wx = bounds.minX + (e.clientX - rect.left - offX) / s
    const wy = bounds.minY + (e.clientY - rect.top - offY) / s
    onJump(wx, wy)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="pointer-events-auto absolute bottom-4 left-4 z-30 hidden overflow-hidden rounded-2xl border bg-card/90 shadow-lg backdrop-blur sm:block"
    >
      <svg width={MW} height={MH} onClick={handleClick} className="block cursor-pointer">
        {people.map((p) => (
          <rect
            key={p.id}
            x={toX(p.x)}
            y={toY(p.y)}
            width={Math.max(2, CARD_W * s)}
            height={Math.max(2, CARD_H * s)}
            rx={1.5}
            className={p.gender === "female" ? "fill-rose-400/70" : "fill-sky-400/70"}
          />
        ))}
        <rect
          x={toX(vx)}
          y={toY(vy)}
          width={vw * s}
          height={vh * s}
          rx={3}
          strokeWidth={1.5}
          className="fill-primary/10 stroke-primary"
        />
      </svg>
    </motion.div>
  )
}
