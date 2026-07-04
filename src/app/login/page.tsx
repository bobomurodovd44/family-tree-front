import Link from "next/link"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { TreePineIcon } from "lucide-react"

import { getCurrentUser } from "@/lib/session"
import { AuthCover } from "@/components/auth-cover"
import { LanguageSwitcher } from "@/components/language-switcher"
import { LoginForm } from "@/components/login-form"

export default async function LoginPage() {
  // Already signed in with a valid session? Skip the auth pages.
  if (await getCurrentUser()) redirect("/")

  const t = await getTranslations("Common")

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex items-center justify-between gap-2">
          <Link href="/login" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <TreePineIcon className="size-4" />
            </div>
            {t("appName")}
          </Link>
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <AuthCover />
    </div>
  )
}
