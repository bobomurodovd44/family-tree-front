"use client"

// Plays a person's spoken Uzbek narration (name, birth, profession, …) synthesized by the Aisha
// TTS backend. The audio is generated + cached server-side on first listen and only regenerated
// when the person's spoken details change (see back/src/services/narration). Here we additionally
// cache the presigned URL per `signature` so replays don't refetch, and refetch when it changes.
//
// Two looks via `variant`: a compact icon on a tree card, and a labeled button in the details sheet.
// Rendered nowhere for unsaved placeholder cards (their id isn't a real Mongo _id yet).

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2Icon, PauseIcon, Volume2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getNarrationAction } from "@/app/families/[familyId]/tree/actions"

// A real person id is a 24-char Mongo ObjectId hex; placeholder ids look like `p_...`.
const REAL_ID = /^[a-f0-9]{24}$/i

type Status = "idle" | "loading" | "playing" | "error"

export interface ListenButtonProps {
  personId: string
  /** Client cache key — see narrationSignature(). Changing it invalidates the cached URL. */
  signature: string
  variant: "card" | "panel"
  className?: string
}

export function ListenButton({ personId, signature, variant, className }: ListenButtonProps) {
  const t = useTranslations("Tree")
  const [status, setStatus] = useState<Status>("idle")
  const audioRef = useRef<HTMLAudioElement>(null)
  const cacheRef = useRef<{ sig: string; url: string } | null>(null)

  // Pause any playing audio if the card unmounts.
  useEffect(() => () => audioRef.current?.pause(), [])

  if (!REAL_ID.test(personId)) return null

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()

    const audio = audioRef.current
    if (!audio) return

    if (status === "playing") {
      audio.pause()
      setStatus("idle")
      return
    }

    let url = cacheRef.current?.sig === signature ? cacheRef.current.url : null
    if (!url) {
      setStatus("loading")
      const result = await getNarrationAction(personId)
      if (!result?.audioUrl) {
        setStatus("error")
        return
      }
      url = result.audioUrl
      cacheRef.current = { sig: signature, url }
    }

    if (audio.src !== url) audio.src = url
    try {
      await audio.play()
      setStatus("playing")
    } catch {
      setStatus("error")
    }
  }

  const loading = status === "loading"
  const playing = status === "playing"
  const label = status === "error" ? t("listenError") : t("listen")

  const icon = loading ? (
    <Loader2Icon className="animate-spin" />
  ) : playing ? (
    <PauseIcon />
  ) : (
    <Volume2Icon />
  )

  const audioEl = (
    <audio
      ref={audioRef}
      preload="none"
      className="hidden"
      onEnded={() => setStatus("idle")}
      onError={() => setStatus("error")}
    />
  )

  if (variant === "card") {
    return (
      <>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          aria-label={label}
          title={label}
          disabled={loading}
          onPointerDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onClick={handleClick}
          className={cn(
            "rounded-full shadow-sm",
            status === "error" && "text-destructive",
            className
          )}
        >
          {icon}
        </Button>
        {audioEl}
      </>
    )
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={handleClick}
        className={cn(status === "error" && "text-destructive", className)}
      >
        {icon}
        {label}
      </Button>
      {audioEl}
    </>
  )
}
