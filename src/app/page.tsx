import { redirect } from "next/navigation"
import { LogOutIcon, TreePineIcon } from "lucide-react"

import { getCurrentUser } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { logout } from "./actions"

export default async function Home() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <TreePineIcon className="size-7" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Xush kelibsiz, {user.name}
        </h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
      <form action={logout}>
        <Button type="submit" variant="outline">
          <LogOutIcon />
          Chiqish
        </Button>
      </form>
    </div>
  )
}
