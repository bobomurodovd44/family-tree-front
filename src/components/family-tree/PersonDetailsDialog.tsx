"use client"

// Read-only-ish person details: identity + every relationship. Each related person is a chip
// that recenters the canvas on them. Spouse rows carry a status selector, which is how you turn
// a current wife into an ex-wife (or a widow) — the requested "make a wife an ex-wife" flow.

import { useTranslations } from "next-intl"
import { PencilIcon, XIcon } from "lucide-react"

import {
  lifeYears,
  narrationSignature,
  personName,
  siblingsOf,
  type PeopleMap,
  type SpouseStatus,
  type TreePerson,
} from "@/lib/tree-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { PersonAvatar } from "@/components/people/person-avatar"
import { ListenButton } from "@/components/family-tree/ListenButton"

export interface PersonDetailsDialogProps {
  open: boolean
  person: TreePerson | null
  people: PeopleMap
  onOpenChange: (open: boolean) => void
  onFocusPerson: (id: string) => void
  onSetSpouseStatus: (spouseId: string, status: SpouseStatus) => void
  onEdit: () => void
}

function PersonChip({ person, onClick }: { person: TreePerson; onClick: () => void }) {
  const name = personName(person)
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-full border bg-background py-1 pr-3 pl-1 text-sm transition-colors hover:border-primary/40 hover:bg-muted"
    >
      <PersonAvatar name={name} src={person.avatar} className="size-6" sizes="24px" />
      <span className="truncate">{name}</span>
    </button>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  )
}

export function PersonDetailsDialog({
  open,
  person,
  people,
  onOpenChange,
  onFocusPerson,
  onSetSpouseStatus,
  onEdit,
}: PersonDetailsDialogProps) {
  const t = useTranslations("Tree")
  if (!person) return null

  const name = personName(person)
  const years = lifeYears(person)
  const parents = person.parents.map((id) => people[id]).filter(Boolean)
  const children = person.children.map((id) => people[id]).filter(Boolean)
  const siblings = siblingsOf(people, person.id)
  const deceased = person.isLiving === false || person.deathYear != null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        className="w-full sm:w-[600px] sm:max-w-none overflow-y-auto p-0 [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="px-4 sm:px-6 pt-6">
          <SheetHeader className="mb-6">
            <div className="flex items-start gap-3">
              <SheetClose asChild>
                <Button type="button" variant="ghost" size="icon" className="shrink-0 -ml-2">
                  <XIcon className="size-5" />
                </Button>
              </SheetClose>
              <PersonAvatar name={name} src={person.avatar} className="size-14 shrink-0" sizes="56px" />
            <div className="flex flex-1 flex-col gap-1 text-left min-w-0">
              <SheetTitle className="flex items-center gap-2 text-lg">
                <span className="truncate">{name}</span>
                <Badge variant={deceased ? "muted" : "default"} className="shrink-0">
                  {deceased ? t("deceased") : t("living")}
                </Badge>
              </SheetTitle>
              <SheetDescription className="tabular-nums">
                {years || t("details")}
              </SheetDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onEdit} className="shrink-0 hidden sm:flex">
              <PencilIcon />
              {t("edit")}
            </Button>
            <Button variant="outline" size="icon" onClick={onEdit} className="shrink-0 sm:hidden">
              <PencilIcon className="size-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6 pb-8">
          <Section label={t("listen")}>
            <ListenButton
              personId={person.id}
              signature={narrationSignature(person)}
              variant="panel"
            />
          </Section>

          <Section label={t("maritalStatus", { fallback: "Marital Status" })}>
            <span className="text-sm">
              {person.maritalStatus === "single" && t("statusSingle", { fallback: "Single" })}
              {person.maritalStatus === "married" && t("statusMarried")}
              {person.maritalStatus === "divorced" && t("statusDivorced")}
              {person.maritalStatus === "widowed" && t("statusWidowed")}
              {!person.maritalStatus && t("none")}
            </span>
          </Section>

          <Section label={t("parents")}>
            {parents.length ? (
              parents.map((p) => (
                <PersonChip key={p.id} person={p} onClick={() => onFocusPerson(p.id)} />
              ))
            ) : (
              <span className="text-sm text-muted-foreground">{t("none")}</span>
            )}
          </Section>

          <Section label={t("spouses")}>
            {person.spouses.length ? (
              person.spouses.map((link) => {
                const sp = people[link.id]
                if (!sp) return null
                return (
                  <div
                    key={link.id}
                    className="flex items-center gap-2 rounded-xl border bg-background p-1"
                  >
                    <PersonChip person={sp} onClick={() => onFocusPerson(sp.id)} />
                    <Select
                      value={link.status}
                      onValueChange={(val) =>
                        onSetSpouseStatus(sp.id, val as SpouseStatus)
                      }
                    >
                      <SelectTrigger className="h-7 w-[110px] text-xs">
                        <SelectValue aria-label={t("relationshipStatus")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="married">{t("statusMarried")}</SelectItem>
                        <SelectItem value="divorced">{t("statusDivorced")}</SelectItem>
                        <SelectItem value="widowed">{t("statusWidowed")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )
              })
            ) : (
              <span className="text-sm text-muted-foreground">{t("none")}</span>
            )}
          </Section>

          <Section label={t("children")}>
            {children.length ? (
              children.map((c) => (
                <PersonChip key={c.id} person={c} onClick={() => onFocusPerson(c.id)} />
              ))
            ) : (
              <span className="text-sm text-muted-foreground">{t("none")}</span>
            )}
          </Section>

          <Section label={t("siblings")}>
            {siblings.length ? (
              siblings.map((s) => (
                <PersonChip key={s.id} person={s} onClick={() => onFocusPerson(s.id)} />
              ))
            ) : (
              <span className="text-sm text-muted-foreground">{t("none")}</span>
            )}
          </Section>
        </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
