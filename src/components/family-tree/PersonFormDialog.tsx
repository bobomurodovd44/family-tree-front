"use client"

// Add / edit a person. The canvas creates a placeholder first (so the new card + its lines
// appear immediately), then opens this dialog to fill in the details — so `person` is always
// present. The inner form mounts fresh per person (keyed), initializing its fields from props,
// so there's no state-syncing effect. `isLiving` is derived from whether a death year was given.

import { useState } from "react"
import { useTranslations } from "next-intl"

import { type Gender, type TreePerson } from "@/lib/tree-types"
import type { PersonPatch } from "@/hooks/use-family-tree"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

export interface PersonFormDialogProps {
  open: boolean
  person: TreePerson | null
  onOpenChange: (open: boolean) => void
  onSubmit: (patch: PersonPatch) => void
}

function PersonForm({
  person,
  onSubmit,
}: {
  person: TreePerson
  onSubmit: (patch: PersonPatch) => void
}) {
  const t = useTranslations("Tree")
  const [firstName, setFirstName] = useState(person.firstName ?? "")
  const [lastName, setLastName] = useState(person.lastName ?? "")
  const [gender, setGender] = useState<Gender>(person.gender)
  const [birthYear, setBirthYear] = useState(person.birthYear ? String(person.birthYear) : "")
  const [deathYear, setDeathYear] = useState(person.deathYear ? String(person.deathYear) : "")

  const isNew = !person.firstName

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const by = Number.parseInt(birthYear, 10)
    const dy = Number.parseInt(deathYear, 10)
    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      gender,
      birthYear: Number.isFinite(by) ? by : undefined,
      deathYear: Number.isFinite(dy) ? dy : undefined,
      isLiving: !Number.isFinite(dy),
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isNew ? t("addTitle") : t("editTitle")}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="tf-first">{t("firstName")}</FieldLabel>
            <Input
              id="tf-first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoFocus
              autoComplete="off"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="tf-last">{t("lastName")}</FieldLabel>
            <Input
              id="tf-last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="off"
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="tf-gender">{t("gender")}</FieldLabel>
          <Select id="tf-gender" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
            <option value="male">{t("male")}</option>
            <option value="female">{t("female")}</option>
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="tf-birth">{t("birthYear")}</FieldLabel>
            <Input
              id="tf-birth"
              inputMode="numeric"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              placeholder="1958"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="tf-death">{t("deathYear")}</FieldLabel>
            <Input
              id="tf-death"
              inputMode="numeric"
              value={deathYear}
              onChange={(e) => setDeathYear(e.target.value)}
              placeholder="—"
            />
          </Field>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("cancel")}
            </Button>
          </DialogClose>
          <Button type="submit">{t("save")}</Button>
        </DialogFooter>
      </form>
    </>
  )
}

export function PersonFormDialog({ open, person, onOpenChange, onSubmit }: PersonFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {person && (
          <PersonForm
            key={person.id}
            person={person}
            onSubmit={(patch) => {
              onSubmit(patch)
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
