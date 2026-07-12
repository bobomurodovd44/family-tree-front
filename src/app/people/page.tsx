import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { getCurrentUser } from "@/lib/session"
import { getFamiliesByIds } from "@/lib/families"
import { getPeoplePage } from "@/lib/people"
import { firstParam, parsePage } from "@/lib/pagination"
import { PeopleTable } from "@/components/people/people-table"
import { PeopleSearch } from "@/components/people/people-search"
import { Pagination } from "@/components/pagination"

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const t = await getTranslations("People")
  const tNav = await getTranslations("Nav")
  const sp = await searchParams
  const page = parsePage(sp.page)
  const q = firstParam(sp.q)

  // Server-side: only this page of matches is fetched (search runs across all people).
  const { items: people, page: current, pageCount, total } = await getPeoplePage({ page, q })
  // Names for just the families referenced on this page — no full families load.
  const familyNames = await getFamiliesByIds(people.map((person) => person.familyId))

  const showSearch = total > 0 || Boolean(q)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {tNav("people")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("count", { count: total })}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {showSearch && <PeopleSearch initialQuery={q} />}
        <PeopleTable people={people} familyNames={familyNames} query={q} />
        <Pagination page={current} pageCount={pageCount} keep={{ q: q || undefined }} />
      </div>
    </div>
  )
}
