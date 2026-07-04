import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { LogOutIcon, TreePineIcon } from "lucide-react"

import { getCurrentUser } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { logout } from "./actions"

export default async function Home() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const t = await getTranslations("Home")

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <TreePineIcon className="size-7" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("welcome", { name: user.name })}
        </h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
      <form action={logout}>
        <Button type="submit" variant="outline">
          <LogOutIcon />
          {t("logout")}
        </Button>
      </form>
    </div>
  )
}
