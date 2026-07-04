"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Loader2Icon } from "lucide-react"

import { signup, type SignupState } from "@/app/signup/actions"
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

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [state, action, pending] = useActionState<SignupState, FormData>(
    signup,
    undefined
  )

  return (
    <form className={cn("flex flex-col gap-6", className)} action={action} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Fill in the form below to create your account
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
          <FieldLabel htmlFor="name">Full Name</FieldLabel>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            autoComplete="name"
            aria-invalid={Boolean(state?.fieldErrors?.name)}
            required
            className="bg-background"
          />
          {state?.fieldErrors?.name && (
            <FieldError>{state.fieldErrors.name}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            aria-invalid={Boolean(state?.fieldErrors?.email)}
            required
            className="bg-background"
          />
          {state?.fieldErrors?.email ? (
            <FieldError>{state.fieldErrors.email}</FieldError>
          ) : (
            <FieldDescription>
              We&apos;ll use this to contact you. We will not share your email
              with anyone else.
            </FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(state?.fieldErrors?.password)}
            required
            className="bg-background"
          />
          {state?.fieldErrors?.password ? (
            <FieldError>{state.fieldErrors.password}</FieldError>
          ) : (
            <FieldDescription>
              Must be at least 8 characters long.
            </FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(state?.fieldErrors?.confirmPassword)}
            required
            className="bg-background"
          />
          {state?.fieldErrors?.confirmPassword ? (
            <FieldError>{state.fieldErrors.confirmPassword}</FieldError>
          ) : (
            <FieldDescription>Please confirm your password.</FieldDescription>
          )}
        </Field>
        <Field>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2Icon className="animate-spin" />}
            Create Account
          </Button>
          <FieldDescription className="text-center">
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-4">
              Sign in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
