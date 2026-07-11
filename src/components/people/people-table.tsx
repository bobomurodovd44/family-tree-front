"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
  UserIcon,
  UsersIcon,
} from "lucide-react"

import { deletePerson } from "@/app/families/[familyId]/people/actions"
import { lifeYears, personName, type Person } from "@/lib/people-types"
import { cn } from "@/lib/utils"
import { PersonAvatar } from "@/components/people/person-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/**
 * The people data table. Reused in two places:
 *  - the global /people dashboard  → pass `familyNames` to show the Family column.
 *  - a single family's detail page → omit `familyNames` (all rows share one family).
 * Search filters the already-loaded page client-side (name / nickname / place / year).
 */
export function PeopleTable({
  people,
  familyNames,
}: {
  people: Person[]
  familyNames?: Record<string, string>
}) {
  const t = useTranslations("People")
  const tt = useTranslations("Table")
  const [query, setQuery] = useState("")
  const [toDelete, setToDelete] = useState<Person | null>(null)
  const [pending, startTransition] = useTransition()
  const showFamily = Boolean(familyNames)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return people
    return people.filter((person) =>
      [
        personName(person),
        person.nickname,
        person.birthPlace,
        person.deathPlace,
        lifeYears(person),
        showFamily ? familyNames?.[person.familyId] : undefined,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
  }, [people, query, showFamily, familyNames])

  if (people.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-16 text-center">
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
    <div className="flex flex-col gap-4">
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

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{tt("person")}</TableHead>
              {showFamily && (
                <TableHead className="hidden md:table-cell">
                  {tt("family")}
                </TableHead>
              )}
              <TableHead className="hidden sm:table-cell">
                {tt("gender")}
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                {tt("years")}
              </TableHead>
              <TableHead>{tt("status")}</TableHead>
              <TableHead className="w-10 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={showFamily ? 6 : 5}
                  className="py-10 text-center text-sm whitespace-normal text-muted-foreground"
                >
                  {t("noMatches", { query })}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((person) => {
                const name = personName(person)
                const years = lifeYears(person)
                return (
                  <TableRow key={person._id}>
                    <TableCell>
                      <Link
                        href={`/families/${person.familyId}/people/${person._id}`}
                        className="flex items-center gap-3 outline-none"
                      >
                        <PersonAvatar
                          name={name}
                          src={person.mainPhotoUrl}
                          className={cn(
                            "size-9 text-xs",
                            !person.isLiving && "opacity-75 grayscale"
                          )}
                          sizes="36px"
                        />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">
                            {name}
                            {person.nickname ? (
                              <span className="font-normal text-muted-foreground">
                                {" "}
                                “{person.nickname}”
                              </span>
                            ) : null}
                          </span>
                          {years ? (
                            <span className="text-xs text-muted-foreground lg:hidden">
                              {years}
                            </span>
                          ) : null}
                        </div>
                      </Link>
                    </TableCell>

                    {showFamily && (
                      <TableCell className="hidden md:table-cell">
                        <Link
                          href={`/families/${person.familyId}`}
                          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                        >
                          {familyNames?.[person.familyId] ?? "—"}
                        </Link>
                      </TableCell>
                    )}

                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {t(person.gender === "male" ? "genderMale" : "genderFemale")}
                    </TableCell>

                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                      {years || "—"}
                    </TableCell>

                    <TableCell>
                      <Badge variant={person.isLiving ? "default" : "muted"}>
                        {t(person.isLiving ? "living" : "deceased")}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={tt("actions")}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <MoreHorizontalIcon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/families/${person.familyId}/people/${person._id}`}
                            >
                              <UserIcon />
                              {tt("view")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/families/${person.familyId}/people/${person._id}/edit`}
                            >
                              <PencilIcon />
                              {t("edit")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setToDelete(person)}
                          >
                            <Trash2Icon />
                            {t("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>
              {toDelete
                ? t("deleteConfirm", { name: personName(toDelete) })
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setToDelete(null)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                if (!toDelete) return
                startTransition(async () => {
                  await deletePerson(toDelete.familyId, toDelete._id)
                  setToDelete(null)
                })
              }}
            >
              {pending && <Loader2Icon className="animate-spin" />}
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
