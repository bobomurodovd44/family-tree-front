"use client"

import { useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { SearchIcon } from "lucide-react"

import { Input } from "@/components/ui/input"

/**
 * Server-side people search box. Debounced, and drives the URL `?q=` param (dropping `page` so
 * results start at page 1). The page reads `q` server-side, so search runs across ALL people and
 * the matches are paginated — not just filtering the current page. Uncontrolled input (the URL is
 * the source of truth) to avoid setState-in-effect, which is a build error in this Next setup.
 */
export function PeopleSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const t = useTranslations("People")
  const router = useRouter()
  const pathname = usePathname()
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const commit = (value: string) => {
    const q = value.trim()
    const href = q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname
    router.replace(href, { scroll: false })
  }

  const onChange = (value: string) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => commit(value), 300)
  }

  return (
    <div className="relative max-w-sm">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        name="q"
        defaultValue={initialQuery}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
        className="h-9 pl-8"
      />
    </div>
  )
}
