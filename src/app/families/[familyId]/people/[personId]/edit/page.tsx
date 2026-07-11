import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ArrowLeftIcon } from "lucide-react"

import { getCurrentUser } from "@/lib/session"
import { getPerson, personName } from "@/lib/people"
import { PersonForm } from "@/components/people/person-form"

export default async function EditPersonPage({
  params,
}: {
  params: Promise<{ familyId: string; personId: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const { familyId, personId } = await params
  const person = await getPerson(personId)
  if (!person || person.familyId !== familyId) notFound()

  const t = await getTranslations("People")
  const name = personName(person)

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-6 md:py-10">
      <Link
        href={`/families/${familyId}/people/${personId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {name}
      </Link>

      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        {t("editTitle")}
      </h1>

      <PersonForm familyId={familyId} person={person} />
    </div>
  )
}
