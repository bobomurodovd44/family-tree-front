"use client"

import { useRef, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Loader2Icon, PencilIcon, PlusIcon } from "lucide-react"

import {
  createFamily,
  updateFamily,
  type FamilyFormState,
} from "@/app/families/actions"
import type { Family } from "@/lib/families"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * Create a family (no `family` prop) or rename an existing one (`family` given).
 * Both flows share the same name field, validation, and submit handling.
 */
export function FamilyDialog({
  family,
  variant = "default",
}: {
  family?: Family
  variant?: "default" | "outline"
}) {
  const t = useTranslations("Families")
  const isEdit = Boolean(family)
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<FamilyFormState>(undefined)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = family
        ? await updateFamily(family._id, formData)
        : await createFamily(undefined, formData)
      setState(result)
      if (result?.ok) {
        setOpen(false)
        if (!isEdit) formRef.current?.reset()
      }
    })
  }

  // Reset transient error state whenever the dialog is (re)opened.
  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) setState(undefined)
  }

  const trigger = isEdit ? (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={t("edit")}
      className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
    >
      <PencilIcon />
    </Button>
  ) : (
    <Button variant={variant}>
      <PlusIcon />
      {t("create")}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>{trigger}</DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {isEdit ? t("editTooltip") : t("createTooltip")}
        </TooltipContent>
      </Tooltip>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("createTitle")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("editSubtitle") : t("createSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={onSubmit} className="flex flex-col gap-4">
          {state?.error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.error}
            </p>
          )}
          <Field>
            <FieldLabel htmlFor="family-name">{t("nameLabel")}</FieldLabel>
            <Input
              id="family-name"
              name="name"
              placeholder={t("namePlaceholder")}
              defaultValue={family?.name}
              autoComplete="off"
              autoFocus
              required
              aria-invalid={Boolean(state?.fieldError)}
            />
            {state?.fieldError && <FieldError>{state.fieldError}</FieldError>}
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="animate-spin" />}
              {isEdit ? t("editSubmit") : t("createSubmit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
