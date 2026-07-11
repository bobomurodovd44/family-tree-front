"use client"

// The infinite family-tree workspace. Orchestrates viewport (pan/zoom/pinch) + tree state +
// selection + overlays. Layered as: background/interaction surface → transformed world layer
// (SVG relationship lines + cards) → fixed overlays (toolbar, zoom, minimap, search, menu) →
// dialogs. Pan/zoom only mutates the world layer's transform; the memoized cards/lines don't
// re-render, which keeps large trees smooth.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence } from "motion/react"
import { useTranslations } from "next-intl"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EyeIcon,
  HeartIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  deriveEdges,
  personName,
  relationLabel,
  type PeopleMap,
  type SpouseStatus,
} from "@/lib/tree-types"
import { CARD_H, CARD_W, computeLayout, contentBounds } from "@/lib/tree-layout"
import { useCanvasViewport } from "@/hooks/use-canvas-viewport"
import { useFamilyTree, type PersonPatch } from "@/hooks/use-family-tree"
import { FamilyNode } from "@/components/family-tree/FamilyNode"
import { RelationshipLine } from "@/components/family-tree/RelationshipLine"
import { CanvasToolbar } from "@/components/family-tree/CanvasToolbar"
import { ZoomControls } from "@/components/family-tree/ZoomControls"
import { SearchBar } from "@/components/family-tree/SearchBar"
import { MiniMap } from "@/components/family-tree/MiniMap"
import { ContextMenu, type ContextMenuItem } from "@/components/family-tree/ContextMenu"
import { PersonDetailsDialog } from "@/components/family-tree/PersonDetailsDialog"
import { PersonFormDialog } from "@/components/family-tree/PersonFormDialog"

export interface FamilyCanvasProps {
  familyId: string
  initial: PeopleMap
}

export function FamilyCanvas({ familyId, initial }: FamilyCanvasProps) {
  const t = useTranslations("Tree")
  const containerRef = useRef<HTMLDivElement>(null)

  const tree = useFamilyTree(familyId, initial)
  const { people, moveNode } = tree

  const {
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
  } = useCanvasViewport(containerRef)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [formId, setFormId] = useState<string | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [panning, setPanning] = useState(false)

  // Latest people for stable (memoized) callbacks — synced after commit, read only in handlers.
  const peopleRef = useRef(people)
  useEffect(() => {
    peopleRef.current = people
  }, [people])

  const peopleList = useMemo(() => Object.values(people), [people])
  const edges = useMemo(() => deriveEdges(people), [people])
  const bounds = useMemo(() => contentBounds(people), [people])

  // Relationship-to-selected labels; recomputed only when the tree or selection changes (never
  // on pan/zoom), so cards stay memo-stable while panning.
  const relationLabels = useMemo(() => {
    const map: Record<string, string | null> = {}
    if (selectedId) for (const p of peopleList) map[p.id] = relationLabel(people, selectedId, p.id, t)
    return map
  }, [people, peopleList, selectedId, t])

  // ── measure container + initial fit ──
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const didFit = useRef(false)
  useEffect(() => {
    if (didFit.current || size.width === 0) return
    didFit.current = true
    fitToContent(contentBounds(peopleRef.current), false)
  }, [size.width, fitToContent])

  // ── wheel zoom (native, non-passive so we can preventDefault the page scroll) ──
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      stopAnimation()
      const rect = el.getBoundingClientRect()
      const factor = Math.exp(-e.deltaY * 0.0015)
      zoomTo(getScale() * factor, e.clientX - rect.left, e.clientY - rect.top, false)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [stopAnimation, zoomTo, getScale])

  // ── background pan / pinch (pointer events on the interaction surface) ──
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const panPrev = useRef<{ x: number; y: number } | null>(null)
  const pinchDist = useRef<number | null>(null)

  const surfacePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button === 2) return
      stopAnimation()
      setMenu(null)
      e.currentTarget.setPointerCapture(e.pointerId)
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.current.size === 1) {
        setSelectedId(null)
        panPrev.current = { x: e.clientX, y: e.clientY }
        setPanning(true)
      } else if (pointers.current.size === 2) {
        panPrev.current = null
        const [a, b] = [...pointers.current.values()]
        pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y)
      }
    },
    [stopAnimation]
  )

  const surfacePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (pointers.current.size >= 2 && pinchDist.current != null) {
        const [a, b] = [...pointers.current.values()]
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        const rect = containerRef.current!.getBoundingClientRect()
        const midX = (a.x + b.x) / 2 - rect.left
        const midY = (a.y + b.y) / 2 - rect.top
        zoomTo(getScale() * (dist / pinchDist.current), midX, midY, false)
        pinchDist.current = dist
      } else if (panPrev.current) {
        panBy(e.clientX - panPrev.current.x, e.clientY - panPrev.current.y)
        panPrev.current = { x: e.clientX, y: e.clientY }
      }
    },
    [getScale, panBy, zoomTo]
  )

  const surfacePointerUp = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchDist.current = null
    if (pointers.current.size === 0) {
      panPrev.current = null
      setPanning(false)
    } else {
      const [only] = [...pointers.current.values()]
      panPrev.current = only
    }
  }, [])

  // ── stable node callbacks ──
  const handleSelect = useCallback((id: string) => setSelectedId(id), [])
  const handleContextMenu = useCallback((id: string, x: number, y: number) => {
    setSelectedId(id)
    setMenu({ id, x, y })
  }, [])
  const handleOpenDetails = useCallback(
    (id: string) => {
      setSelectedId(id)
      setDetailsId(id)
      const p = peopleRef.current[id]
      if (p) centerOn(p.x + CARD_W / 2, p.y + CARD_H / 2)
    },
    [centerOn]
  )

  // ── higher-level actions (overlays / menu) ──
  const focusPerson = useCallback(
    (id: string) => {
      setSelectedId(id)
      const p = peopleRef.current[id]
      if (p) centerOn(p.x + CARD_W / 2, p.y + CARD_H / 2)
    },
    [centerOn]
  )

  const addAndEdit = (id: string) => {
    if (!id) return
    setSelectedId(id)
    setFormId(id)
  }

  const handleAddPerson = () => {
    const c = screenToWorld(size.width / 2, size.height / 2)
    addAndEdit(tree.addPerson(c.x - CARD_W / 2, c.y - CARD_H / 2))
  }
  const handleAddParent = (id?: string) => {
    const target = id ?? selectedId
    if (target) addAndEdit(tree.addParentTo(target))
  }
  const handleAddChild = (id?: string) => {
    const target = id ?? selectedId
    if (target) addAndEdit(tree.addChildTo(target))
  }
  const handleAddSpouse = (id?: string) => {
    const target = id ?? selectedId
    if (target) addAndEdit(tree.addSpouseTo(target, "married"))
  }
  const handleDelete = (id: string) => {
    const p = people[id]
    if (p && !window.confirm(t("deleteConfirm", { name: personName(p) }))) return
    tree.deletePerson(id)
    if (selectedId === id) setSelectedId(null)
    if (detailsId === id) setDetailsId(null)
  }

  const handleAutoArrange = () => {
    tree.autoArrange()
    const arranged = contentBounds(computeLayout(people))
    requestAnimationFrame(() => fitToContent(arranged))
  }

  const handleFormSubmit = (patch: PersonPatch) => {
    if (formId) tree.commitPerson(formId, patch)
  }

  // ── context-menu items ──
  const menuItems: ContextMenuItem[] = menu
    ? [
        { key: "edit", label: t("edit"), icon: <PencilIcon />, onClick: () => addAndEdit(menu.id) },
        { key: "view", label: t("viewProfile"), icon: <EyeIcon />, onClick: () => setDetailsId(menu.id) },
        { separator: true },
        { key: "parent", label: t("addParent"), icon: <ArrowUpIcon />, onClick: () => handleAddParent(menu.id) },
        { key: "child", label: t("addChild"), icon: <ArrowDownIcon />, onClick: () => handleAddChild(menu.id) },
        { key: "spouse", label: t("addSpouse"), icon: <HeartIcon />, onClick: () => handleAddSpouse(menu.id) },
        { separator: true },
        { key: "delete", label: t("delete"), icon: <Trash2Icon />, destructive: true, onClick: () => handleDelete(menu.id) },
      ]
    : []

  const detailsPerson = detailsId ? people[detailsId] ?? null : null
  const formPerson = formId ? people[formId] ?? null : null

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none overflow-hidden overscroll-none bg-background select-none"
    >
      {/* interaction + grid surface (empty-canvas clicks land here) */}
      <div
        onPointerDown={surfacePointerDown}
        onPointerMove={surfacePointerMove}
        onPointerUp={surfacePointerUp}
        onPointerCancel={surfacePointerUp}
        className={cn("absolute inset-0", panning ? "cursor-grabbing" : "cursor-grab")}
        style={{
          backgroundImage: "radial-gradient(circle, var(--color-border) 1.1px, transparent 1.1px)",
          backgroundSize: `${24 * viewport.scale}px ${24 * viewport.scale}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
        }}
      />

      {/* world layer — one transform for the whole scene */}
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
        }}
      >
        <svg
          className="pointer-events-none absolute top-0 left-0 overflow-visible"
          width={1}
          height={1}
        >
          {edges.parents.map((e) => (
            <RelationshipLine
              key={e.id}
              kind="parent-child"
              from={people[e.parent]}
              to={people[e.child]}
              active={selectedId === e.parent || selectedId === e.child}
            />
          ))}
          {edges.marriages.map((e) => (
            <RelationshipLine
              key={e.id}
              kind="marriage"
              from={people[e.a]}
              to={people[e.b]}
              status={e.status}
              active={selectedId === e.a || selectedId === e.b}
            />
          ))}
        </svg>

        {peopleList.map((person) => (
          <FamilyNode
            key={person.id}
            person={person}
            selected={selectedId === person.id}
            relationLabel={relationLabels[person.id] ?? null}
            dimmed={false}
            getScale={getScale}
            onSelect={handleSelect}
            onMove={moveNode}
            onOpenDetails={handleOpenDetails}
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>

      {/* overlays (this wrapper ignores pointer events; each child re-enables them) */}
      <div className="pointer-events-none absolute inset-0">
        <CanvasToolbar
          hasSelection={selectedId != null}
          onAddPerson={handleAddPerson}
          onAddParent={() => handleAddParent()}
          onAddChild={() => handleAddChild()}
          onAddSpouse={() => handleAddSpouse()}
          onAutoArrange={handleAutoArrange}
          onSearch={() => setSearchOpen(true)}
        />

        <ZoomControls
          scale={viewport.scale}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onFit={() => fitToContent(bounds)}
          onReset={() => reset(bounds)}
        />

        <MiniMap
          people={peopleList}
          bounds={bounds}
          viewport={viewport}
          containerSize={size}
          onJump={(x, y) => centerOn(x, y)}
        />

        <AnimatePresence>
          {searchOpen && (
            <SearchBar
              people={peopleList}
              onSelect={focusPerson}
              onClose={() => setSearchOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* context menu */}
      <AnimatePresence>
        {menu && (
          <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />
        )}
      </AnimatePresence>

      {/* dialogs */}
      <PersonDetailsDialog
        open={detailsId != null}
        person={detailsPerson}
        people={people}
        onOpenChange={(o) => !o && setDetailsId(null)}
        onFocusPerson={(id) => {
          setDetailsId(null)
          focusPerson(id)
        }}
        onSetSpouseStatus={(spouseId, status: SpouseStatus) =>
          detailsId && tree.setSpouseStatus(detailsId, spouseId, status)
        }
        onEdit={() => {
          if (detailsId) {
            const id = detailsId
            setDetailsId(null)
            addAndEdit(id)
          }
        }}
      />

      <PersonFormDialog
        open={formId != null}
        person={formPerson}
        onOpenChange={(o) => !o && setFormId(null)}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
