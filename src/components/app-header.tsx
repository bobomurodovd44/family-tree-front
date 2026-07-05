import { getTranslations } from "next-intl/server"
import { LogOutIcon, TreePineIcon } from "lucide-react"

import { getTheme } from "@/lib/theme"
import { logout } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export async function AppHeader() {
  const t = await getTranslations()
  const theme = await getTheme()

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b bg-background/80 px-4 py-2.5 backdrop-blur md:px-6">
      <div className="flex items-center gap-2 font-medium">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <TreePineIcon className="size-4" />
        </span>
        <span className="hidden sm:inline">{t("Common.appName")}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <LanguageSwitcher />
        <ThemeToggle current={theme} />
        <form action={logout}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                variant="ghost"
                size="icon-sm"
                aria-label={t("Home.logout")}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOutIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("Home.logout")}</TooltipContent>
          </Tooltip>
        </form>
      </div>
    </header>
  )
}
