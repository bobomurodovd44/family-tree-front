import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes reachable without a session. Everything else requires auth.
const PUBLIC_ROUTES = ["/login", "/signup"]

const SESSION_COOKIE = "shajara_session"

// Optimistic guard: only looks at cookie presence (no DB/network call) to keep
// unauthenticated users off protected routes. Real validation — and redirecting
// an already-authenticated user away from the auth pages — happens server-side in
// the pages via getCurrentUser(), so a stale/expired cookie can't cause a redirect
// loop between "/" and "/login".
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = request.cookies.has(SESSION_COOKIE)
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (!hasSession && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except Next internals, API routes, and static assets.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)",
  ],
}
