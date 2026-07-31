export type StageProfile =
  | 'Flat'
  | 'Rolling'
  | 'Mountain'
  | 'Time Trial'

export type Stage = {
  id: number
  name: string
  start: string
  finish: string
  distanceKm: number
  profile: StageProfile
  difficulty: number
  description: string
}

export const stages: Stage[] = [
  {
    id: 1,
    name: 'Stage 1: Coastal Dash',
    start: 'Seabrook',
    finish: 'Port Azure',
    distanceKm: 142,
    profile: 'Flat',
    difficulty: 2,
    description:
      'A fast opening stage along the coast. Crosswinds and a likely bunch sprint will test positioning.',
  },
  {
    id: 2,
    name: 'Stage 2: Roads of the Vineyards',
    start: 'Valmont',
    finish: 'Château Rouge',
    distanceKm: 168,
    profile: 'Rolling',
    difficulty: 3,
    description:
      'Rolling vineyard roads create constant pressure. Short climbs offer perfect launching pads for attacks.',
  },
  {
    id: 3,
    name: 'Stage 3: Summit of the Giants',
    start: 'Montclair',
    finish: 'Col du Titan',
    distanceKm: 156,
    profile: 'Mountain',
    difficulty: 5,
    description:
      'The first major mountain stage. Three categorized climbs lead to a brutal summit finish.',
  },
  {
    id: 4,
    name: 'Stage 4: Race Against the Clock',
    start: 'Lac Bleu',
    finish: 'Saint-Laurent',
    distanceKm: 31,
    profile: 'Time Trial',
    difficulty: 4,
    description:
      'A solo time trial where pacing matters more than teamwork. Every second will count.',
  },
  {
    id: 5,
    name: 'Stage 5: Road to Glory',
    start: 'Belleville',
    finish: 'Grand Avenue',
    distanceKm: 184,
    profile: 'Rolling',
    difficulty: 4,
    description:
      'The final stage combines rolling hills, dangerous attacks, and a dramatic finish in the city center.',
  },
]