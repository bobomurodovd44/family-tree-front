"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { MoonIcon, SunIcon } from "lucide-react"

import { setTheme } from "@/app/actions"
import type { Theme } from "@/lib/theme"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ThemeToggle({ current }: { current: Theme }) {
  const t = useTranslations("Common")
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const next: Theme = current === "dark" ? "light" : "dark"
  const label = current === "dark" ? t("lightMode") : t("darkMode")

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await setTheme(next)
              router.refresh()
            })
          }
          className="text-muted-foreground hover:text-foreground"
        >
          {current === "dark" ? <SunIcon /> : <MoonIcon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
