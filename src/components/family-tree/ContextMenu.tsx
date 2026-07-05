"use client"

// Pointer-anchored right-click menu. Custom (not radix) because it opens at arbitrary cursor
// coordinates. Closes on outside pointerdown, Escape, wheel, or resize. Clamps into the viewport.

import { useEffect, useLayoutEffect, useRef } from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

export type ContextMenuItem =
  | { separator: true }
  | {
      separator?: false
      key: string
      label: string
      icon?: React.ReactNode
      onClick: () => void
      destructive?: boolean
      disabled?: boolean
    }

export interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

const MENU_W = 210

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Clamp within the viewport once we can measure the menu height (imperative — no re-render).
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.left = `${Math.max(8, Math.min(x, window.innerWidth - MENU_W - 8))}px`
    el.style.top = `${Math.max(8, Math.min(y, window.innerHeight - el.offsetHeight - 8))}px`
  }, [x, y])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener("pointerdown", onDown, true)
    window.addEventListener("keydown", onKey)
    window.addEventListener("wheel", onClose, { passive: true })
    window.addEventListener("resize", onClose)
    return () => {
      window.removeEventListener("pointerdown", onDown, true)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("wheel", onClose)
      window.removeEventListener("resize", onClose)
    }
  }, [onClose])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.12 }}
      style={{ position: "fixed", top: y, left: x, width: MENU_W, transformOrigin: "top left" }}
      className="z-50 overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-xl"
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) =>
        item.separator ? (
          <div key={`sep-${i}`} className="my-1 h-px bg-border" />
        ) : (
          <button
            key={item.key}
            type="button"
            disabled={item.disabled}
            onClick={() => {
              item.onClick()
              onClose()
            }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:text-muted-foreground",
              item.destructive
                ? "text-destructive hover:bg-destructive/10 [&_svg]:text-destructive"
                : "hover:bg-muted"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        )
      )}
    </motion.div>
  )
}
