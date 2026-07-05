"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { SearchIcon, UsersIcon } from "lucide-react"

import { lifeYears, personName, type Person } from "@/lib/people-types"
import { PersonCard } from "@/components/people/person-card"
import { Input } from "@/components/ui/input"

/**
 * The people grid with an instant client-side filter (name / nickname / place / year). The
 * list is already scoped to one family and one page, so filtering in the browser keeps search
 * snappy without a server round-trip. Large-scale search is the tree view's job (Phase 5).
 */
export function PeopleDirectory({ people }: { people: Person[] }) {
  const t = useTranslations("People")
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return people
    return people.filter((person) => {
      const haystack = [
        personName(person),
        person.nickname,
        person.birthPlace,
        person.deathPlace,
        lifeYears(person),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [people, query])

  if (people.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UsersIcon className="size-7" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium">{t("emptyTitle")}</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            {t("emptySubtitle")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 flex flex-col gap-5">
      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="h-9 pl-8"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          {t("noMatches", { query })}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((person) => (
            <PersonCard key={person._id} person={person} />
          ))}
        </div>
      )}
    </div>
  )
}
