import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { TreePineIcon } from "lucide-react"

import { getCurrentUser } from "@/lib/session"
import { getFamiliesPage } from "@/lib/families"
import { getPeopleCounts } from "@/lib/people"
import { parsePage } from "@/lib/pagination"
import { FamiliesTable } from "@/components/families/families-table"
import { FamilyDialog } from "@/components/families/family-dialog"
import { Pagination } from "@/components/pagination"

export default async function FamiliesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const t = await getTranslations("Families")
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)

  // Only the current page of families is fetched; people counts for those families come from
  // cheap count-only queries (no full people load).
  const { items: families, page: current, pageCount, total } = await getFamiliesPage({ page })
  const counts = await getPeopleCounts(families.map((family) => family._id))

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {total > 0 && <FamilyDialog />}
      </div>

      {total === 0 ? (
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
        <div className="mt-6 flex flex-col gap-4">
          <FamiliesTable families={families} counts={counts} />
          <Pagination page={current} pageCount={pageCount} />
        </div>
      )}
    </div>
  )
}
