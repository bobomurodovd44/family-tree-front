import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ArrowLeftIcon, PlusIcon, TreePineIcon } from "lucide-react"

import { getCurrentUser } from "@/lib/session"
import { getFamily, getPeople } from "@/lib/people"
import { AppHeader } from "@/components/app-header"
import { PeopleDirectory } from "@/components/people/people-directory"
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
    <div className="flex min-h-svh flex-col">
      <AppHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-6 md:py-10">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          {t("backToFamilies")}
        </Link>

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

        <PeopleDirectory people={people} />
      </main>
    </div>
  )
}
