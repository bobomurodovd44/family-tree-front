"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/**
 * URL-driven pager. Renders Prev / "Page X of Y" / Next as links that only change `page` while
 * preserving any other params the page passes in `keep` (e.g. `{ q }`). Server components read
 * the page from the URL, so navigation is a plain link — no client state. Hidden when ≤1 page.
 */
export function Pagination({
  page,
  pageCount,
  keep = {},
}: {
  page: number
  pageCount: number
  keep?: Record<string, string | undefined>
}) {
  const t = useTranslations("Pagination")
  const pathname = usePathname()

  if (pageCount <= 1) return null

  const href = (target: number) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(keep)) {
      if (value) params.set(key, value)
    }
    if (target > 1) params.set("page", String(target))
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  const atStart = page <= 1
  const atEnd = page >= pageCount

  return (
    <nav className="flex items-center justify-between gap-4" aria-label={t("label")}>
      <PagerLink href={href(page - 1)} disabled={atStart} rel="prev">
        <ChevronLeftIcon />
        <span className="hidden sm:inline">{t("previous")}</span>
      </PagerLink>

      <span className="text-sm text-muted-foreground tabular-nums">
        {t("page", { page, pageCount })}
      </span>

      <PagerLink href={href(page + 1)} disabled={atEnd} rel="next">
        <span className="hidden sm:inline">{t("next")}</span>
        <ChevronRightIcon />
      </PagerLink>
    </nav>
  )
}

/** A prev/next control: a real link when enabled, an inert styled span when at the boundary. */
function PagerLink({
  href,
  disabled,
  rel,
  children,
}: {
  href: string
  disabled: boolean
  rel: "prev" | "next"
  children: React.ReactNode
}) {
  const className = cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")

  if (disabled) {
    return (
      <span aria-disabled="true" className={cn(className, "pointer-events-none opacity-50")}>
        {children}
      </span>
    )
  }

  return (
    <Link href={href} rel={rel} className={className}>
      {children}
    </Link>
  )
}
