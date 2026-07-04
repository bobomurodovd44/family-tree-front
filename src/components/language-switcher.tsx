"use client"

import { useTransition } from "react"
import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"

import { setLocale } from "@/i18n/actions"
import { locales, type Locale } from "@/i18n/config"
import { cn } from "@/lib/utils"

const LABELS: Record<Locale, string> = {
  uz: "UZ",
  ru: "RU",
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const active = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const choose = (locale: Locale) => {
    if (locale === active || pending) return
    startTransition(async () => {
      await setLocale(locale)
      router.refresh()
    })
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-background/80 p-0.5 text-xs font-medium backdrop-blur",
        className
      )}
    >
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => choose(locale)}
          disabled={pending}
          aria-pressed={locale === active}
          className={cn(
            "rounded-full px-2.5 py-1 transition-colors disabled:opacity-70",
            locale === active
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {LABELS[locale]}
        </button>
      ))}
    </div>
  )
}
