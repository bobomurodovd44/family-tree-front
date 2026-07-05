"use client"

// Canvas viewport: the pan/zoom transform applied ONCE to the world layer. Screen↔world math
// lives here, plus animated controls (zoom, fit, reset, center-on). The transform is
// `translate(x, y) scale(scale)` with a 0,0 origin, so: screen = world * scale + {x, y}.
//
// Perf: viewport lives in React state, but cards/lines are memoized on their own data, so a
// pan/zoom only re-renders the single transformed wrapper — not the hundreds of cards inside it.

import { useCallback, useRef, useState } from "react"

import { clamp, type Bounds } from "@/lib/tree-layout"

export interface Viewport {
  x: number
  y: number
  scale: number
}

export const MIN_SCALE = 0.15
export const MAX_SCALE = 2.5
const INITIAL: Viewport = { x: 80, y: 80, scale: 1 }

export interface CanvasViewport {
  viewport: Viewport
  /** Read the current scale without subscribing to re-renders (for the drag hot path). */
  getScale: () => number
  /** Convert a point in container-relative screen px to world coordinates. */
  screenToWorld: (sx: number, sy: number) => { x: number; y: number }
  /** Cancel any running transition (call at the start of a user gesture). */
  stopAnimation: () => void
  /** Pan by a screen-space delta (immediate). */
  panBy: (dx: number, dy: number) => void
  /** Zoom to a target scale, keeping the given container-relative screen point fixed. */
  zoomTo: (nextScale: number, sx: number, sy: number, animate?: boolean) => void
  zoomIn: () => void
  zoomOut: () => void
  /** Frame all content in view. */
  fitToContent: (bounds: Bounds, animate?: boolean) => void
  /** Return to the default scale, content near the top-left. */
  reset: (bounds: Bounds) => void
  /** Smoothly center a world point in the viewport (optionally at a new scale). */
  centerOn: (wx: number, wy: number, scale?: number) => void
}

export function useCanvasViewport(
  containerRef: React.RefObject<HTMLDivElement | null>
): CanvasViewport {
  const [viewport, setViewport] = useState<Viewport>(INITIAL)
  const vpRef = useRef<Viewport>(INITIAL)
  const rafRef = useRef<number | null>(null)

  const commit = useCallback((v: Viewport) => {
    vpRef.current = v
    setViewport(v)
  }, [])

  const stopAnimation = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const animateTo = useCallback(
    (target: Viewport, duration = 380) => {
      stopAnimation()
      const from = vpRef.current
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        const e = 1 - Math.pow(1 - t, 3) // easeOutCubic
        commit({
          x: from.x + (target.x - from.x) * e,
          y: from.y + (target.y - from.y) * e,
          scale: from.scale + (target.scale - from.scale) * e,
        })
        rafRef.current = t < 1 ? requestAnimationFrame(tick) : null
      }
      rafRef.current = requestAnimationFrame(tick)
    },
    [commit, stopAnimation]
  )

  const getScale = useCallback(() => vpRef.current.scale, [])

  const screenToWorld = useCallback((sx: number, sy: number) => {
    const v = vpRef.current
    return { x: (sx - v.x) / v.scale, y: (sy - v.y) / v.scale }
  }, [])

  const panBy = useCallback(
    (dx: number, dy: number) => {
      const v = vpRef.current
      commit({ x: v.x + dx, y: v.y + dy, scale: v.scale })
    },
    [commit]
  )

  const zoomTo = useCallback(
    (nextScaleRaw: number, sx: number, sy: number, animate = false) => {
      const v = vpRef.current
      const nextScale = clamp(nextScaleRaw, MIN_SCALE, MAX_SCALE)
      const k = nextScale / v.scale
      // Keep the world point under (sx, sy) fixed while scaling.
      const target: Viewport = { x: sx - (sx - v.x) * k, y: sy - (sy - v.y) * k, scale: nextScale }
      if (animate) animateTo(target)
      else commit(target)
    },
    [animateTo, commit]
  )

  const containerCenter = useCallback(() => {
    const r = containerRef.current?.getBoundingClientRect()
    return { cx: (r?.width ?? 0) / 2, cy: (r?.height ?? 0) / 2 }
  }, [containerRef])

  const zoomIn = useCallback(() => {
    const { cx, cy } = containerCenter()
    zoomTo(vpRef.current.scale * 1.3, cx, cy, true)
  }, [containerCenter, zoomTo])

  const zoomOut = useCallback(() => {
    const { cx, cy } = containerCenter()
    zoomTo(vpRef.current.scale / 1.3, cx, cy, true)
  }, [containerCenter, zoomTo])

  const fitToContent = useCallback(
    (bounds: Bounds, animate = true) => {
      const r = containerRef.current?.getBoundingClientRect()
      if (!r) return
      const pad = 96
      const scale = clamp(
        Math.min((r.width - pad) / bounds.width, (r.height - pad) / bounds.height),
        MIN_SCALE,
        MAX_SCALE
      )
      const cx = bounds.minX + bounds.width / 2
      const cy = bounds.minY + bounds.height / 2
      const target: Viewport = { x: r.width / 2 - cx * scale, y: r.height / 2 - cy * scale, scale }
      if (animate) animateTo(target)
      else commit(target)
    },
    [animateTo, commit, containerRef]
  )

  const reset = useCallback(
    (bounds: Bounds) => {
      animateTo({ x: 80 - bounds.minX, y: 80 - bounds.minY, scale: 1 })
    },
    [animateTo]
  )

  const centerOn = useCallback(
    (wx: number, wy: number, scale?: number) => {
      const r = containerRef.current?.getBoundingClientRect()
      if (!r) return
      const s = clamp(scale ?? vpRef.current.scale, MIN_SCALE, MAX_SCALE)
      animateTo({ x: r.width / 2 - wx * s, y: r.height / 2 - wy * s, scale: s })
    },
    [animateTo, containerRef]
  )

  return {
    viewport,
    getScale,
    screenToWorld,
    stopAnimation,
    panBy,
    zoomTo,
    zoomIn,
    zoomOut,
    fitToContent,
    reset,
    centerOn,
  }
}
