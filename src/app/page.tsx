import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { TreePineIcon } from "lucide-react"

import { getCurrentUser } from "@/lib/session"
import { getFamilies } from "@/lib/families"
import { AppHeader } from "@/components/app-header"
import { FamilyDialog } from "@/components/families/family-dialog"
import { FamilyCard } from "@/components/families/family-card"

export default async function Home() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const t = await getTranslations("Families")
  const families = await getFamilies()

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-6 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("title")}
            </h1>
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
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {families.map((family) => (
              <FamilyCard key={family._id} family={family} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
