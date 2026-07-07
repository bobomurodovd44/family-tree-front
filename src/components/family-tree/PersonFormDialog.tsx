"use client"

// Add / edit a person. The canvas creates a placeholder first (so the new card + its lines
// appear immediately), then opens this dialog to fill in the details — so `person` is always
// present. The inner form mounts fresh per person (keyed), initializing its fields from props,
// so there's no state-syncing effect. `isLiving` is derived from the toggle.

import { useCallback, useState } from "react"
import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "motion/react"
import { MinusIcon, PlusIcon, UserIcon } from "lucide-react"

import { type Gender, type TreePerson } from "@/lib/tree-types"
import type { PersonPatch } from "@/hooks/use-family-tree"
import { cn } from "@/lib/utils"
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

/* ── Gender toggle (pill with icons) ─────────────────────────────────────── */

function GenderToggle({
  value,
  onChange,
}: {
  value: Gender
  onChange: (g: Gender) => void
}) {
  const t = useTranslations("Tree")
  return (
    <div className="relative flex h-10 w-full items-center rounded-xl border border-input bg-muted/50 p-1">
      {/* animated pill background — pure CSS transition, no layout recalc on parent re-render */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg shadow-sm transition-transform duration-200 ease-out",
          value === "female" && "translate-x-[calc(100%+4px)]"
        )}
      >
        <div
          className={cn(
            "h-full w-full rounded-lg transition-colors duration-200",
            value === "male"
              ? "bg-sky-500/15 dark:bg-sky-400/20"
              : "bg-rose-500/15 dark:bg-rose-400/20"
          )}
        />
      </div>
      <button
        type="button"
        onClick={() => onChange("male")}
        className={cn(
          "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1 text-sm font-medium transition-colors",
          value === "male"
            ? "text-sky-600 dark:text-sky-400"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <MaleIcon className="size-4" />
        {t("male")}
      </button>
      <button
        type="button"
        onClick={() => onChange("female")}
        className={cn(
          "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1 text-sm font-medium transition-colors",
          value === "female"
            ? "text-rose-600 dark:text-rose-400"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <FemaleIcon className="size-4" />
        {t("female")}
      </button>
    </div>
  )
}

function MaleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="10" cy="14" r="5" />
      <path d="M19 5l-5.4 5.4M15 5h4v4" />
    </svg>
  )
}

function FemaleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14v7M9 18h6" />
    </svg>
  )
}

/* ── Year spinner (input with ± buttons) ─────────────────────────────────── */

function YearSpinner({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  const bump = useCallback(
    (delta: number) => {
      const n = Number.parseInt(value, 10)
      if (Number.isFinite(n)) {
        onChange(String(n + delta))
      } else {
        onChange(String(new Date().getFullYear() + delta))
      }
    },
    [value, onChange]
  )

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div
        className={cn(
          "flex items-center rounded-lg border border-input transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          disabled && "pointer-events-none opacity-40"
        )}
      >
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => bump(-1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <MinusIcon className="size-3.5" />
        </button>
        <input
          id={id}
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "—"}
          disabled={disabled}
          className="h-8 w-full min-w-0 bg-transparent text-center text-sm tabular-nums outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => bump(1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <PlusIcon className="size-3.5" />
        </button>
      </div>
    </Field>
  )
}

/* ── Living / Deceased toggle ───────────────────────────────────────────── */

function LivingToggle({
  isLiving,
  onChange,
}: {
  isLiving: boolean
  onChange: (living: boolean) => void
}) {
  const t = useTranslations("Tree")
  return (
    <div className="relative flex h-10 w-full items-center rounded-xl border border-input bg-muted/50 p-1">
      {/* animated pill */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg shadow-sm transition-transform duration-200 ease-out",
          !isLiving && "translate-x-[calc(100%+4px)]"
        )}
      >
        <div
          className={cn(
            "h-full w-full rounded-lg transition-colors duration-200",
            isLiving
              ? "bg-emerald-500/15 dark:bg-emerald-400/20"
              : "bg-zinc-500/15 dark:bg-zinc-400/20"
          )}
        />
      </div>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1 text-sm font-medium transition-colors",
          isLiving
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span className="size-2 rounded-full bg-emerald-500" />
        {t("living")}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1 text-sm font-medium transition-colors",
          !isLiving
            ? "text-zinc-600 dark:text-zinc-400"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span className="size-2 rounded-full bg-zinc-400 dark:bg-zinc-500" />
        {t("deceased")}
      </button>
    </div>
  )
}

/* ── Initials avatar preview ─────────────────────────────────────────────── */

function AvatarPreview({
  firstName,
  lastName,
  gender,
}: {
  firstName: string
  lastName: string
  gender: Gender
}) {
  const initials = [firstName, lastName]
    .map((s) => s.trim().charAt(0).toUpperCase())
    .filter(Boolean)
    .join("")

  return (
    <div
      className={cn(
        "mx-auto flex size-16 items-center justify-center rounded-2xl text-xl font-bold tracking-tight transition-colors",
        gender === "female"
          ? "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
          : "bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
      )}
    >
      {initials || <UserIcon className="size-6 opacity-40" />}
    </div>
  )
}

/* ── The form ────────────────────────────────────────────────────────────── */

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
  const [isLiving, setIsLiving] = useState(person.isLiving !== false && !person.deathYear)

  const isNew = !person.firstName

  function handleLivingToggle(living: boolean) {
    setIsLiving(living)
    if (living) setDeathYear("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const by = Number.parseInt(birthYear, 10)
    const dy = Number.parseInt(deathYear, 10)
    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      gender,
      birthYear: Number.isFinite(by) ? by : undefined,
      deathYear: !isLiving && Number.isFinite(dy) ? dy : undefined,
      isLiving,
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isNew ? t("addTitle") : t("editTitle")}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* avatar preview */}
        <AvatarPreview firstName={firstName} lastName={lastName} gender={gender} />

        {/* name fields */}
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="tf-first">{t("firstName")}</FieldLabel>
            <Input
              id="tf-first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoFocus
              autoComplete="off"
              placeholder="Aziz"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="tf-last">{t("lastName")}</FieldLabel>
            <Input
              id="tf-last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="off"
              placeholder="Karimov"
            />
          </Field>
        </div>

        {/* gender toggle */}
        <Field>
          <FieldLabel>{t("gender")}</FieldLabel>
          <GenderToggle value={gender} onChange={setGender} />
        </Field>

        {/* year fields */}
        <div className="grid grid-cols-2 gap-3">
          <YearSpinner
            id="tf-birth"
            label={t("birthYear")}
            value={birthYear}
            onChange={setBirthYear}
            placeholder="1958"
          />
          <AnimatePresence mode="wait">
            {!isLiving ? (
              <motion.div
                key="death"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
              >
                <YearSpinner
                  id="tf-death"
                  label={t("deathYear")}
                  value={deathYear}
                  onChange={setDeathYear}
                  placeholder="2020"
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-end pb-0.5"
              >
                {/* spacer — keeps the grid balanced */}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* living/deceased toggle */}
        <LivingToggle isLiving={isLiving} onChange={handleLivingToggle} />

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
