import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ArrowLeftIcon } from "lucide-react"

import { getCurrentUser } from "@/lib/session"
import { getFamily } from "@/lib/people"
import { getTree, treeToPeopleMap } from "@/lib/tree"
import { FamilyCanvas } from "@/components/family-tree/FamilyCanvas"
import { Button } from "@/components/ui/button"

// Full-bleed interactive tree. Auth-gated like the rest of the app; the canvas fetches real
// people + relationships from the Neo4j tree service and seeds the canvas with them.
export default async function FamilyTreePage({
  params,
}: {
  params: Promise<{ familyId: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const { familyId } = await params
  const family = await getFamily(familyId)
  if (!family) notFound()

  const t = await getTranslations("Tree")

  const rows = await getTree(familyId)
  const initial = treeToPeopleMap(rows)

  return (
    <div className="relative h-svh w-full overflow-hidden">
      <FamilyCanvas familyId={familyId} initial={initial} />

      {/* back to the family */}
      <div className="pointer-events-none absolute top-4 left-4 z-40">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="pointer-events-auto bg-card/90 shadow-sm backdrop-blur"
        >
          <Link href={`/families/${familyId}`}>
            <ArrowLeftIcon />
            {t("back")}
          </Link>
        </Button>
      </div>

      <p className="pointer-events-none absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 text-xs font-medium text-muted-foreground md:block">
        {family.name}
      </p>
    </div>
  )
}
