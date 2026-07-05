"use client"

// Top-center search. Filters people by name or year; selecting a result asks the canvas to
// smoothly center + highlight that person. Esc closes, Enter jumps to the first match.

import { useMemo, useRef, useState } from "react"
import { useEffect } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useTranslations } from "next-intl"
import { SearchIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { lifeYears, personName, type TreePerson } from "@/lib/tree-types"
import { Input } from "@/components/ui/input"
import { PersonAvatar } from "@/components/people/person-avatar"

export interface SearchBarProps {
  people: TreePerson[]
  onSelect: (id: string) => void
  onClose: () => void
}

export function SearchBar({ people, onSelect, onClose }: SearchBarProps) {
  const t = useTranslations("Tree")
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return people
      .filter((p) => {
        const hay = `${personName(p)} ${p.birthYear ?? ""} ${p.deathYear ?? ""}`.toLowerCase()
        return hay.includes(q)
      })
      .slice(0, 8)
  }, [people, query])

  function choose(id: string) {
    onSelect(id)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-auto absolute top-4 left-1/2 z-40 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2"
    >
      <div className="flex items-center gap-2 rounded-2xl border bg-card/95 px-3 py-2 shadow-lg backdrop-blur">
        <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose()
            if (e.key === "Enter" && results[0]) choose(results[0].id)
          }}
          placeholder={t("searchPlaceholder")}
          className="h-7 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label={t("cancel")}
          className="rounded-md p-0.5 text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      <AnimatePresence>
        {query.trim() && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="mt-2 max-h-72 overflow-auto rounded-2xl border bg-popover p-1.5 shadow-lg"
          >
            {results.length === 0 ? (
              <li className="px-2 py-3 text-center text-sm text-muted-foreground">
                {t("noResults")}
              </li>
            ) : (
              results.map((p) => {
                const name = personName(p)
                const years = lifeYears(p)
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => choose(p.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors",
                        "hover:bg-muted"
                      )}
                    >
                      <PersonAvatar name={name} src={p.avatar} className="size-8" sizes="32px" />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">{name}</span>
                        {years ? (
                          <span className="text-xs text-muted-foreground tabular-nums">{years}</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                )
              })
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
