"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Loader2Icon, Trash2Icon } from "lucide-react"

import { deletePerson } from "@/app/families/[familyId]/people/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function DeletePersonButton({
  familyId,
  personId,
  name,
}: {
  familyId: string
  personId: string
  name: string
}) {
  const t = useTranslations("People")
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("delete")}
            onClick={() => setOpen(true)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("delete")}</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteConfirm", { name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await deletePerson(familyId, personId)
                })
              }
            >
              {pending && <Loader2Icon className="animate-spin" />}
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
