import * as React from "react"

/**
 * SSR-safe media query hook built on useSyncExternalStore.
 * `serverFallback` is what the server (and first hydration pass) assumes.
 * Defaulting to `true` means "desktop", so the Dialog is the server render.
 */
export function useMediaQuery(query: string, serverFallback = true) {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    [query]
  )

  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverFallback
  )
}
