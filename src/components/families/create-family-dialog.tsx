"use client"

import { useRef, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Loader2Icon, PlusIcon } from "lucide-react"

import { createFamily, type CreateFamilyState } from "@/app/families/actions"
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

export function CreateFamilyDialog({
  variant = "default",
}: {
  variant?: "default" | "outline"
}) {
  const t = useTranslations("Families")
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<CreateFamilyState>(undefined)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createFamily(undefined, formData)
      setState(result)
      // Close and reset only on success; keep the dialog open to show errors.
      if (result?.ok) {
        setOpen(false)
        formRef.current?.reset()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant={variant}>
              <PlusIcon />
              {t("create")}
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{t("createTooltip")}</TooltipContent>
      </Tooltip>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("createTitle")}</DialogTitle>
          <DialogDescription>{t("createSubtitle")}</DialogDescription>
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
              {t("createSubmit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
