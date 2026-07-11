import Link from "next/link"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import {
  ArrowRightIcon,
  TreePineIcon,
  UsersIcon,
} from "lucide-react"

import { getCurrentUser } from "@/lib/session"
import { getFamilies } from "@/lib/families"
import { getAllPeople } from "@/lib/people"
import { FamiliesTable } from "@/components/families/families-table"
import { FamilyDialog } from "@/components/families/family-dialog"
import { Button } from "@/components/ui/button"

export default async function OverviewPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const t = await getTranslations("Dashboard")
  const tFamilies = await getTranslations("Families")
  const [families, people] = await Promise.all([getFamilies(), getAllPeople()])

  const living = people.filter((person) => person.isLiving).length
  const deceased = people.length - living

  const counts: Record<string, number> = {}
  for (const person of people) {
    counts[person.familyId] = (counts[person.familyId] ?? 0) + 1
  }

  const stats = [
    { label: t("families"), value: families.length, icon: <TreePineIcon className="size-4" /> },
    { label: t("people"), value: people.length, icon: <UsersIcon className="size-4" /> },
    { label: t("living"), value: living, dot: "bg-primary" },
    { label: t("deceased"), value: deceased, dot: "bg-muted-foreground/40" },
  ]

  const recent = families.slice(0, 5)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("welcome", { name: user.name })}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <FamilyDialog />
      </div>

      <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-1.5 rounded-xl border p-4"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {stat.icon ?? (
                <span className={`size-2 rounded-full ${stat.dot}`} />
              )}
              {stat.label}
            </div>
            <div className="text-2xl font-semibold tabular-nums">
              {stat.value}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-lg font-medium tracking-tight">
            {t("recentFamilies")}
          </h2>
          {families.length > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/families">
                {t("viewAll")}
                <ArrowRightIcon />
              </Link>
            </Button>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <TreePineIcon className="size-7" />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-medium">{tFamilies("emptyTitle")}</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                {tFamilies("emptySubtitle")}
              </p>
            </div>
            <FamilyDialog />
          </div>
        ) : (
          <FamiliesTable families={recent} counts={counts} />
        )}
      </section>
    </div>
  )
}
