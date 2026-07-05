import Link from "next/link"

import { lifeYears, personName, type Person } from "@/lib/people-types"
import { PersonAvatar } from "@/components/people/person-avatar"
import { Card } from "@/components/ui/card"

/** A single person tile in the directory grid; links through to the profile. */
export function PersonCard({ person }: { person: Person }) {
  const name = personName(person)
  const years = lifeYears(person)

  return (
    <Link
      href={`/families/${person.familyId}/people/${person._id}`}
      className="rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="group h-full flex-row items-center gap-3 p-4 transition-colors hover:bg-muted/50">
        <PersonAvatar name={name} src={person.mainPhotoUrl} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="truncate font-medium leading-tight tracking-tight">
            {name}
            {person.nickname ? (
              <span className="text-muted-foreground"> “{person.nickname}”</span>
            ) : null}
          </h3>
          {years ? (
            <p className="text-xs text-muted-foreground">{years}</p>
          ) : null}
        </div>
      </Card>
    </Link>
  )
}
