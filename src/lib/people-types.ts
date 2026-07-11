// Client-safe person types + pure helpers. Kept separate from lib/people.ts (which is
// `server-only` and pulls in next/headers) so client components can import the type and these
// formatters without dragging server code into the browser bundle.

export type Gender = "male" | "female"
export type Privacy = "public" | "family" | "private"
export type MaritalStatus = "single" | "married" | "divorced" | "widowed"

// Mirrors the backend Person (people.schema.ts). `mainPhotoKey` is the stored S3 key;
// `mainPhotoUrl` is a presigned, ready-to-render URL the backend computes on read.
export type Person = {
  _id: string
  familyId: string
  firstName: string
  middleName?: string
  lastName?: string
  nickname?: string
  gender: Gender
  birthDate?: string
  deathDate?: string
  maritalStatus?: MaritalStatus
  birthPlace?: string
  deathPlace?: string
  isLiving: boolean
  bio?: string
  profession?: string
  clan?: string
  tribe?: string
  nationality?: string
  privacy: Privacy
  mainPhotoKey?: string
  mainPhotoUrl?: string
  // Photo archive: `photos` are durable S3 keys, `photoUrls` the presigned URLs the backend
  // computes on read (same order). `mainPhotoKey` designates which one is the avatar.
  photos?: string[]
  photoUrls?: string[]
  createdBy: string
  createdAt: number
  updatedAt?: number
}

/** Full display name, folding in an optional nickname. */
export function personName(person: Pick<Person, "firstName" | "middleName" | "lastName">): string {
  return [person.firstName, person.middleName, person.lastName].filter(Boolean).join(" ")
}

/** "1950 – 2001" | "b. 1950" | "" — the year label under a person's name. */
export function lifeYears(person: Pick<Person, "birthDate" | "deathDate">): string {
  const birth = person.birthDate?.slice(0, 4)
  const death = person.deathDate?.slice(0, 4)
  if (birth && death) return `${birth} – ${death}`
  if (birth) return `${birth} –`
  if (death) return `– ${death}`
  return ""
}
