import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ArrowLeftIcon } from "lucide-react"

import { getCurrentUser } from "@/lib/session"
import { getFamily } from "@/lib/people"
import { AppHeader } from "@/components/app-header"
import { PersonForm } from "@/components/people/person-form"

export default async function NewPersonPage({
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

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 md:px-6 md:py-10">
        <Link
          href={`/families/${familyId}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          {family.name}
        </Link>

        <h1 className="mb-6 text-2xl font-semibold tracking-tight">
          {t("addTitle")}
        </h1>

        <PersonForm familyId={familyId} />
      </main>
    </div>
  )
}
