"use client"

// Shared icon button with a tooltip, used across the canvas overlays (toolbar, zoom controls).

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function ToolButton({
  label,
  onClick,
  disabled,
  side = "left",
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  side?: "top" | "right" | "bottom" | "left"
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}
