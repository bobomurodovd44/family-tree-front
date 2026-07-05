import "server-only"

import { cookies } from "next/headers"

// Theme is stored in a cookie (no flash: read server-side and applied to <html>
// on first render), mirroring the locale mechanism in i18n/config.ts.
export type Theme = "light" | "dark"

export const THEME_COOKIE = "theme"
export const defaultTheme: Theme = "light"

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark"
}

export async function getTheme(): Promise<Theme> {
  const store = await cookies()
  const value = store.get(THEME_COOKIE)?.value
  return isTheme(value) ? value : defaultTheme
}
