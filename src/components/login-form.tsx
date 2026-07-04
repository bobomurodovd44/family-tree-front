"use client"

import Link from "next/link"
import { useActionState } from "react"
import { useTranslations } from "next-intl"
import { Loader2Icon } from "lucide-react"

import { login, type LoginState } from "@/app/login/actions"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/password-input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const t = useTranslations("Auth")
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined
  )

  return (
    <form className={cn("flex flex-col gap-6", className)} action={action} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">{t("loginTitle")}</h1>
          <p className="text-sm text-balance text-muted-foreground">
            {t("loginSubtitle")}
          </p>
        </div>
        {state?.error && (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
          >
            {state.error}
          </p>
        )}
        <Field>
          <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            aria-invalid={Boolean(state?.fieldErrors?.email)}
            required
            className="bg-background"
          />
          {state?.fieldErrors?.email && (
            <FieldError>{state.fieldErrors.email}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            aria-invalid={Boolean(state?.fieldErrors?.password)}
            required
            className="bg-background"
          />
          {state?.fieldErrors?.password && (
            <FieldError>{state.fieldErrors.password}</FieldError>
          )}
        </Field>
        <Field>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2Icon className="animate-spin" />}
            {t("loginButton")}
          </Button>
          <FieldDescription className="text-center">
            {t("noAccount")}{" "}
            <Link href="/signup" className="underline underline-offset-4">
              {t("goToSignup")}
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
