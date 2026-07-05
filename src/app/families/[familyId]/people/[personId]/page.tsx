import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ArrowLeftIcon, PencilIcon } from "lucide-react"

import { getCurrentUser } from "@/lib/session"
import { getPerson, lifeYears, personName } from "@/lib/people"
import { AppHeader } from "@/components/app-header"
import { PersonAvatar } from "@/components/people/person-avatar"
import { DeletePersonButton } from "@/components/people/delete-person-button"
import { Button } from "@/components/ui/button"

export default async function PersonProfilePage({
  params,
}: {
  params: Promise<{ familyId: string; personId: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const { familyId, personId } = await params
  const person = await getPerson(personId)
  // Guard against a mismatched family in the URL (backend already scopes to owned families).
  if (!person || person.familyId !== familyId) notFound()

  const t = await getTranslations("People")
  const name = personName(person)
  const years = lifeYears(person)

  const details: Array<{ label: string; value?: string }> = [
    { label: t("birthDate"), value: person.birthDate },
    { label: t("birthPlace"), value: person.birthPlace },
    { label: t("deathDate"), value: person.deathDate },
    { label: t("deathPlace"), value: person.deathPlace },
    { label: t("profession"), value: person.profession },
    { label: t("nationality"), value: person.nationality },
    { label: t("clan"), value: person.clan },
    { label: t("tribe"), value: person.tribe },
  ].filter((item) => item.value)

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:px-6 md:py-10">
        <Link
          href={`/families/${familyId}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          {t("backToDirectory")}
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <PersonAvatar
              name={name}
              src={person.mainPhotoUrl}
              className="size-20 text-xl"
              sizes="80px"
            />
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                {name}
                {person.nickname ? (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    “{person.nickname}”
                  </span>
                ) : null}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {years && <span>{years}</span>}
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
                  {t(person.gender === "male" ? "genderMale" : "genderFemale")}
                </span>
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
                  {t(person.isLiving ? "living" : "deceased")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button asChild variant="outline" size="sm">
              <Link href={`/families/${familyId}/people/${personId}/edit`}>
                <PencilIcon />
                {t("edit")}
              </Link>
            </Button>
            <DeletePersonButton familyId={familyId} personId={personId} name={name} />
          </div>
        </div>

        {details.length > 0 && (
          <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-4 rounded-2xl border p-5 sm:grid-cols-2">
            {details.map((item) => (
              <div key={item.label} className="flex flex-col gap-0.5">
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {item.label}
                </dt>
                <dd className="text-sm">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {person.bio && (
          <section className="mt-8">
            <h2 className="mb-2 text-sm font-medium tracking-wide text-muted-foreground uppercase">
              {t("bio")}
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {person.bio}
            </p>
          </section>
        )}
      </main>
    </div>
  )
}
