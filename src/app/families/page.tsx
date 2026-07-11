import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { TreePineIcon } from "lucide-react"

import { getCurrentUser } from "@/lib/session"
import { getFamilies } from "@/lib/families"
import { getAllPeople } from "@/lib/people"
import { FamiliesTable } from "@/components/families/families-table"
import { FamilyDialog } from "@/components/families/family-dialog"

export default async function FamiliesPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const t = await getTranslations("Families")
  const [families, people] = await Promise.all([getFamilies(), getAllPeople()])

  // People-per-family counts for the table's "People" column.
  const counts: Record<string, number> = {}
  for (const person of people) {
    counts[person.familyId] = (counts[person.familyId] ?? 0) + 1
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {families.length > 0 && <FamilyDialog />}
      </div>

      {families.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <TreePineIcon className="size-7" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-medium">{t("emptyTitle")}</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("emptySubtitle")}
            </p>
          </div>
          <FamilyDialog />
        </div>
      ) : (
        <div className="mt-6">
          <FamiliesTable families={families} counts={counts} />
        </div>
      )}
    </div>
  )
}
