import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { PlusIcon, TreePineIcon } from "lucide-react"

import { getCurrentUser } from "@/lib/session"
import { getFamily, getPeople } from "@/lib/people"
import { PeopleTable } from "@/components/people/people-table"
import { Button } from "@/components/ui/button"

export default async function FamilyPeoplePage({
  params,
}: {
  params: Promise<{ familyId: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const { familyId } = await params
  const family = await getFamily(familyId)
  if (!family) notFound()

  const t = await getTranslations("People")
  const tTree = await getTranslations("Tree")
  const people = await getPeople(familyId)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{family.name}</h1>
          <p className="text-sm text-muted-foreground">
            {t("count", { count: people.length })}
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

      <div className="mt-6">
        <PeopleTable people={people} />
      </div>
    </div>
  )
}
