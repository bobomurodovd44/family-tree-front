"use client"

// Bottom-right zoom cluster: −  <live %>  +  |  fit  reset.

import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import { Maximize2Icon, RotateCcwIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import { ToolButton } from "@/components/family-tree/ToolButton"

export interface ZoomControlsProps {
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onReset: () => void
}

export function ZoomControls({ scale, onZoomIn, onZoomOut, onFit, onReset }: ZoomControlsProps) {
  const t = useTranslations("Tree")

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="pointer-events-auto absolute right-4 bottom-4 z-30 flex items-center gap-1 rounded-2xl border bg-card/90 p-1.5 shadow-lg backdrop-blur"
    >
      <ToolButton label={t("zoomOut")} onClick={onZoomOut} side="top">
        <ZoomOutIcon />
      </ToolButton>
      <span className="w-11 text-center text-xs font-medium tabular-nums text-muted-foreground">
        {Math.round(scale * 100)}%
      </span>
      <ToolButton label={t("zoomIn")} onClick={onZoomIn} side="top">
        <ZoomInIcon />
      </ToolButton>
      <Separator orientation="vertical" className="mx-0.5 h-6" />
      <ToolButton label={t("fitTree")} onClick={onFit} side="top">
        <Maximize2Icon />
      </ToolButton>
      <ToolButton label={t("resetView")} onClick={onReset} side="top">
        <RotateCcwIcon />
      </ToolButton>
    </motion.div>
  )
}
