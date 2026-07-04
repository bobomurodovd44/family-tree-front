import "server-only"

import { cookies } from "next/headers"
import { cache } from "react"

import { feathersFetch } from "@/lib/api"

const COOKIE_NAME = "shajara_session"
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days, matches the backend JWT lifetime

export type SessionUser = {
  _id: string
  email: string
  name: string
}

export async function createSession(accessToken: string) {
  const store = await cookies()
  store.set(COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  })
}

export async function deleteSession() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function getToken() {
  const store = await cookies()
  return store.get(COOKIE_NAME)?.value
}

/**
 * Validates the session cookie against Feathers (jwt strategy) and returns the
 * current user, or null. Memoized per request via React `cache`.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = await getToken()
  if (!token) return null

  const { ok, data } = await feathersFetch<{ user: SessionUser }>("/authentication", {
    method: "POST",
    body: JSON.stringify({ strategy: "jwt", accessToken: token }),
  })

  return ok ? (data?.user ?? null) : null
})
