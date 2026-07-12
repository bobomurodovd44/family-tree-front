"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/**
 * URL-driven numbered pager: `‹ 1 2 3 … 10 ›`. Renders first/last, a window around the current
 * page, and `…` for the gaps — all as links that only change `page` while preserving any other
 * params passed in `keep` (e.g. `{ q }`). Server components read the page from the URL, so
 * navigation is a plain link — no client state. Hidden when there's ≤1 page.
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

  const items = paginationRange(page, pageCount)

  return (
    <nav className="flex items-center justify-center gap-1" aria-label={t("label")}>
      <Arrow href={href(page - 1)} disabled={page <= 1} label={t("previous")} rel="prev">
        <ChevronLeftIcon />
      </Arrow>

      {items.map((item, index) =>
        item === ELLIPSIS ? (
          <span
            key={`gap-${index}`}
            aria-hidden="true"
            className="inline-flex h-7 min-w-7 items-center justify-center text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <PageLink
            key={item}
            href={href(item)}
            page={item}
            active={item === page}
            label={t("goToPage", { page: item })}
          />
        )
      )}

      <Arrow href={href(page + 1)} disabled={page >= pageCount} label={t("next")} rel="next">
        <ChevronRightIcon />
      </Arrow>
    </nav>
  )
}

/** A single page-number control: filled + inert for the current page, a link otherwise. */
function PageLink({
  href,
  page,
  active,
  label,
}: {
  href: string
  page: number
  active: boolean
  label: string
}) {
  const className = cn(
    buttonVariants({ variant: active ? "default" : "ghost", size: "sm" }),
    "min-w-8 justify-center px-1.5 tabular-nums"
  )

  if (active) {
    return (
      <span className={className} aria-current="page" aria-label={label}>
        {page}
      </span>
    )
  }

  return (
    <Link href={href} className={className} aria-label={label}>
      {page}
    </Link>
  )
}

/** Prev/next chevron: a real link when enabled, an inert styled span at the boundary. */
function Arrow({
  href,
  disabled,
  label,
  rel,
  children,
}: {
  href: string
  disabled: boolean
  label: string
  rel: "prev" | "next"
  children: React.ReactNode
}) {
  const className = buttonVariants({ variant: "ghost", size: "icon-sm" })

  if (disabled) {
    return (
      <span aria-disabled="true" aria-label={label} className={cn(className, "opacity-40")}>
        {children}
      </span>
    )
  }

  return (
    <Link href={href} rel={rel} aria-label={label} className={className}>
      {children}
    </Link>
  )
}

const ELLIPSIS = "ellipsis" as const

/**
 * Build the list of page items to show: always the first and last page, a window of `siblings`
 * pages either side of the current one, and an `ELLIPSIS` marker wherever pages are skipped.
 * Mirrors the well-known MUI `usePagination` logic.
 */
function paginationRange(
  current: number,
  total: number,
  siblings = 1
): (number | typeof ELLIPSIS)[] {
  // first + last + current + 2 siblings + 2 ellipsis slots — if everything fits, show it all.
  const maxSlots = siblings * 2 + 5
  if (total <= maxSlots) return range(1, total)

  const leftSibling = Math.max(current - siblings, 1)
  const rightSibling = Math.min(current + siblings, total)
  const showLeftGap = leftSibling > 2
  const showRightGap = rightSibling < total - 1
  const edgeCount = 3 + siblings * 2

  if (!showLeftGap && showRightGap) {
    return [...range(1, edgeCount), ELLIPSIS, total]
  }
  if (showLeftGap && !showRightGap) {
    return [1, ELLIPSIS, ...range(total - edgeCount + 1, total)]
  }
  return [1, ELLIPSIS, ...range(leftSibling, rightSibling), ELLIPSIS, total]
}

function range(start: number, end: number): number[] {
  const out: number[] = []
  for (let i = start; i <= end; i++) out.push(i)
  return out
}
