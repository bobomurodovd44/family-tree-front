import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { getCurrentUser } from "@/lib/session"
import { getFamilies } from "@/lib/families"
import { getAllPeople } from "@/lib/people"
import { PeopleTable } from "@/components/people/people-table"

export default async function PeoplePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const t = await getTranslations("People")
  const tNav = await getTranslations("Nav")
  const [people, families] = await Promise.all([getAllPeople(), getFamilies()])

  // Map familyId → name so the table can show which tree each person belongs to.
  const familyNames: Record<string, string> = {}
  for (const family of families) {
    familyNames[family._id] = family.name
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {tNav("people")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("count", { count: people.length })}
        </p>
      </div>

      <PeopleTable people={people} familyNames={familyNames} />
    </div>
  )
}
