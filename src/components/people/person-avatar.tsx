import Image from "next/image"

import { cn } from "@/lib/utils"

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

/**
 * A person's photo, or their initials on a tinted circle when there's no photo. `src` is the
 * presigned URL from the backend (person.mainPhotoUrl).
 */
export function PersonAvatar({
  name,
  src,
  className,
  sizes = "48px",
}: {
  name: string
  src?: string
  className?: string
  sizes?: string
}) {
  return (
    <span
      className={cn(
        "relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-medium text-primary select-none",
        className
      )}
    >
      {src ? (
        <Image src={src} alt={name} fill sizes={sizes} className="object-cover" />
      ) : (
        (initials(name) || "?")
      )}
    </span>
  )
}
