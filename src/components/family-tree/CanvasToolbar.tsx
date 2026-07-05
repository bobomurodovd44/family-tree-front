"use client"

// Floating top-right toolbar. Two groups: add-relationship actions (need a selected person) and
// view actions (always available). Every button carries a localized tooltip.

import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  HeartIcon,
  LayoutGridIcon,
  SearchIcon,
  UserPlusIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { ToolButton } from "@/components/family-tree/ToolButton"

export interface CanvasToolbarProps {
  hasSelection: boolean
  onAddPerson: () => void
  onAddParent: () => void
  onAddChild: () => void
  onAddSpouse: () => void
  onAutoArrange: () => void
  onSearch: () => void
}

export function CanvasToolbar({
  hasSelection,
  onAddPerson,
  onAddParent,
  onAddChild,
  onAddSpouse,
  onAutoArrange,
  onSearch,
}: CanvasToolbarProps) {
  const t = useTranslations("Tree")

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "pointer-events-auto absolute top-4 right-4 z-30 flex flex-col items-center gap-1",
        "rounded-2xl border bg-card/90 p-1.5 shadow-lg backdrop-blur"
      )}
    >
      <ToolButton label={t("addPerson")} onClick={onAddPerson}>
        <UserPlusIcon />
      </ToolButton>
      <ToolButton label={t("addParent")} onClick={onAddParent} disabled={!hasSelection}>
        <ArrowUpIcon />
      </ToolButton>
      <ToolButton label={t("addChild")} onClick={onAddChild} disabled={!hasSelection}>
        <ArrowDownIcon />
      </ToolButton>
      <ToolButton label={t("addSpouse")} onClick={onAddSpouse} disabled={!hasSelection}>
        <HeartIcon />
      </ToolButton>

      <Separator className="my-0.5 w-6" />

      <ToolButton label={t("autoArrange")} onClick={onAutoArrange}>
        <LayoutGridIcon />
      </ToolButton>
      <ToolButton label={t("search")} onClick={onSearch}>
        <SearchIcon />
      </ToolButton>
    </motion.div>
  )
}
