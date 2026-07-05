"use client"

// Read-only-ish person details: identity + every relationship. Each related person is a chip
// that recenters the canvas on them. Spouse rows carry a status selector, which is how you turn
// a current wife into an ex-wife (or a widow) — the requested "make a wife an ex-wife" flow.

import { useTranslations } from "next-intl"
import { PencilIcon } from "lucide-react"

import {
  lifeYears,
  personName,
  siblingsOf,
  type PeopleMap,
  type SpouseStatus,
  type TreePerson,
} from "@/lib/tree-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"
import { PersonAvatar } from "@/components/people/person-avatar"

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <PersonAvatar name={name} src={person.avatar} className="size-14" sizes="56px" />
            <div className="flex flex-1 flex-col gap-1">
              <DialogTitle className="flex items-center gap-2">
                {name}
                <Badge variant={deceased ? "muted" : "default"}>
                  {deceased ? t("deceased") : t("living")}
                </Badge>
              </DialogTitle>
              <DialogDescription className="tabular-nums">
                {years || t("details")}
              </DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <PencilIcon />
              {t("edit")}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4">
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
                      onChange={(e) =>
                        onSetSpouseStatus(sp.id, e.target.value as SpouseStatus)
                      }
                      className="h-7 w-auto text-xs"
                      aria-label={t("relationshipStatus")}
                    >
                      <option value="married">{t("statusMarried")}</option>
                      <option value="divorced">{t("statusDivorced")}</option>
                      <option value="widowed">{t("statusWidowed")}</option>
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
      </DialogContent>
    </Dialog>
  )
}
