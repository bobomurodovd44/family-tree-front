// Seed family for the canvas while the Neo4j relationships backend is still pending. Authored
// with parents + spouse links only; `normalizeTree` fills in the mirrored spouse links and the
// derived `children` arrays. Coordinates are hand-placed so the first paint looks intentional
// (the "Auto-arrange" button re-runs computeLayout at any time).
//
// It intentionally exercises every relationship/badge type: a divorce (ex-wife), a living widow,
// a second marriage, and four generations.

import { normalizeTree, type PeopleMap, type TreePerson } from "@/lib/tree-types"

type Seed = Omit<TreePerson, "children">

const seed: Seed[] = [
  // ── Generation 0 — grandparents ──
  {
    id: "zebo",
    firstName: "Zebo",
    lastName: "Rahimova",
    gender: "female",
    birthYear: 1938,
    isLiving: true,
    x: 120,
    y: 0,
    parents: [],
    spouses: [],
  },
  {
    id: "bobojon",
    firstName: "Bobojon",
    lastName: "Karimov",
    gender: "male",
    birthYear: 1930,
    deathYear: 2008,
    isLiving: false,
    x: 372,
    y: 0,
    parents: [],
    // Two marriages: divorced from Zebo (ex-wife), later married to Oysha.
    spouses: [
      { id: "zebo", status: "divorced", order: 1 },
      { id: "oysha", status: "married", order: 2 },
    ],
  },
  {
    id: "oysha",
    firstName: "Oysha",
    lastName: "Karimova",
    gender: "female",
    birthYear: 1935,
    deathYear: 2015,
    isLiving: false,
    x: 624,
    y: 0,
    parents: [],
    spouses: [],
  },

  // ── Generation 1 — children + their spouses ──
  {
    id: "aziz",
    firstName: "Aziz",
    lastName: "Karimov",
    gender: "male",
    birthYear: 1955,
    isLiving: true,
    x: 60,
    y: 248,
    parents: ["bobojon", "zebo"],
    spouses: [],
  },
  {
    id: "karim",
    firstName: "Karim",
    lastName: "Karimov",
    gender: "male",
    birthYear: 1958,
    isLiving: true,
    x: 372,
    y: 248,
    parents: ["bobojon", "oysha"],
    spouses: [{ id: "dilbar", status: "married", order: 1 }],
  },
  {
    id: "dilbar",
    firstName: "Dilbar",
    lastName: "Karimova",
    gender: "female",
    birthYear: 1962,
    isLiving: true,
    x: 624,
    y: 248,
    parents: [],
    spouses: [],
  },
  {
    id: "nodira",
    firstName: "Nodira",
    lastName: "Yusupova",
    gender: "female",
    birthYear: 1960,
    isLiving: true,
    x: 940,
    y: 248,
    parents: ["bobojon", "oysha"],
    // Widowed — Rustam is deceased, so her card shows the WIDOW badge.
    spouses: [{ id: "rustam", status: "widowed", order: 1 }],
  },
  {
    id: "rustam",
    firstName: "Rustam",
    lastName: "Yusupov",
    gender: "male",
    birthYear: 1957,
    deathYear: 2018,
    isLiving: false,
    x: 1192,
    y: 248,
    parents: [],
    spouses: [],
  },

  // ── Generation 2 — grandchildren ──
  {
    id: "sardor",
    firstName: "Sardor",
    lastName: "Karimov",
    gender: "male",
    birthYear: 1985,
    isLiving: true,
    x: 372,
    y: 496,
    parents: ["karim", "dilbar"],
    spouses: [],
  },
  {
    id: "malika",
    firstName: "Malika",
    lastName: "Karimova",
    gender: "female",
    birthYear: 1988,
    isLiving: true,
    x: 624,
    y: 496,
    parents: ["karim", "dilbar"],
    spouses: [{ id: "jahongir", status: "married", order: 1 }],
  },
  {
    id: "jahongir",
    firstName: "Jahongir",
    lastName: "Aliyev",
    gender: "male",
    birthYear: 1986,
    isLiving: true,
    x: 876,
    y: 496,
    parents: [],
    spouses: [],
  },
  {
    id: "kamola",
    firstName: "Kamola",
    lastName: "Yusupova",
    gender: "female",
    birthYear: 1990,
    isLiving: true,
    x: 1066,
    y: 496,
    parents: ["nodira", "rustam"],
    spouses: [],
  },

  // ── Generation 3 — great-grandchildren ──
  {
    id: "ali",
    firstName: "Ali",
    lastName: "Aliyev",
    gender: "male",
    birthYear: 2010,
    isLiving: true,
    x: 690,
    y: 744,
    parents: ["malika", "jahongir"],
    spouses: [],
  },
  {
    id: "zaynab",
    firstName: "Zaynab",
    lastName: "Aliyeva",
    gender: "female",
    birthYear: 2013,
    isLiving: true,
    x: 890,
    y: 744,
    parents: ["malika", "jahongir"],
    spouses: [],
  },
]

/** A fresh, normalized copy of the demo tree. */
export function demoPeople(): PeopleMap {
  const map: PeopleMap = {}
  for (const s of seed) map[s.id] = { ...s, children: [] }
  return normalizeTree(map)
}
