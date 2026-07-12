import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { PlusIcon, TreePineIcon } from "lucide-react"

import { getCurrentUser } from "@/lib/session"
import { getFamily, getPeoplePage } from "@/lib/people"
import { firstParam, parsePage } from "@/lib/pagination"
import { PeopleTable } from "@/components/people/people-table"
import { PeopleSearch } from "@/components/people/people-search"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"

export default async function FamilyPeoplePage({
  params,
  searchParams,
}: {
  params: Promise<{ familyId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const { familyId } = await params
  const family = await getFamily(familyId)
  if (!family) notFound()

  const t = await getTranslations("People")
  const tTree = await getTranslations("Tree")
  const sp = await searchParams
  const page = parsePage(sp.page)
  const q = firstParam(sp.q)

  // Only this page of the family's people is fetched; search is scoped to this family server-side.
  const { items: people, page: current, pageCount, total } = await getPeoplePage({
    familyId,
    page,
    q,
  })

  const showSearch = total > 0 || Boolean(q)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{family.name}</h1>
          <p className="text-sm text-muted-foreground">
            {t("count", { count: total })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/families/${familyId}/tree`}>
              <TreePineIcon />
              {tTree("open")}
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/families/${familyId}/people/new`}>
              <PlusIcon />
              {t("addPerson")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {showSearch && <PeopleSearch initialQuery={q} />}
        <PeopleTable people={people} query={q} />
        <Pagination page={current} pageCount={pageCount} keep={{ q: q || undefined }} />
      </div>
    </div>
  )
}
