import { getTranslations } from "next-intl/server"
import { TreePineIcon } from "lucide-react"

// Decorative side panel for the auth pages. Uses a subtle traditional Uzbek-style
// geometric lattice (two overlapping squares form an 8-pointed "chorsi" star) over
// a brand-tinted gradient. Self-contained — no external image asset needed.
export async function AuthCover() {
  const t = await getTranslations("Common")

  return (
    <div className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:block">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />

      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full text-primary-foreground/[0.07]"
      >
        <defs>
          <pattern id="chorsi" width="56" height="56" patternUnits="userSpaceOnUse">
            <rect
              x="14"
              y="14"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <rect
              x="14"
              y="14"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              transform="rotate(45 28 28)"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#chorsi)" />
      </svg>

      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 px-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-foreground/10">
          <TreePineIcon className="size-7" />
        </span>
        <h2 className="text-2xl font-semibold tracking-tight">{t("appName")}</h2>
        <p className="max-w-xs text-sm text-primary-foreground/80">{t("tagline")}</p>
      </div>
    </div>
  )
}
