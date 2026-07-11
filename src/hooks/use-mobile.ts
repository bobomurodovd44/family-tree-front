"use client"

import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Reactive "is the viewport below the mobile breakpoint?" flag. Implemented with
// useSyncExternalStore so there's no setState-in-effect (this modified Next treats the
// react-hooks/set-state-in-effect lint rule as a build error) and SSR stays consistent
// (the server snapshot is always `false`, matching the desktop-first render).
function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.innerWidth < MOBILE_BREAKPOINT,
    () => false
  )
}
