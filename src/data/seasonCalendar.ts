export type RaceCalendarEntry = {
  id: string
  name: string
  shortName: string
  startDate: string
  endDate: string
  leaderColor: string
  raceType: 'one-day' | 'stage-race' | 'championship'
  stageCount: number
  raceLibraryId: string
  status: 'active' | 'planned' | 'completed'
}

export type Season = { year: number; races: RaceCalendarEntry[] }

export const seasons: Season[] = [{
  year: 2026,
  races: [
    { id: 'strade-2026', name: 'Strade Bianche', shortName: 'Strade', startDate: '2026-03-07', endDate: '2026-03-07', leaderColor: '#d8c2a4', raceType: 'one-day', stageCount: 1, raceLibraryId: 'strade-2026', status: 'planned' },
    { id: 'roubaix-2026', name: 'Paris–Roubaix', shortName: 'Roubaix', startDate: '2026-04-12', endDate: '2026-04-12', leaderColor: '#b88b45', raceType: 'one-day', stageCount: 1, raceLibraryId: 'roubaix-2026', status: 'planned' },
    { id: 'giro-2026', name: "Giro d'Italia", shortName: 'Giro', startDate: '2026-05-09', endDate: '2026-05-31', leaderColor: '#ef75aa', raceType: 'stage-race', stageCount: 21, raceLibraryId: 'giro-2026', status: 'planned' },
    { id: 'dauphine-2026', name: 'Critérium du Dauphiné', shortName: 'Dauphiné', startDate: '2026-06-07', endDate: '2026-06-14', leaderColor: '#69aee7', raceType: 'stage-race', stageCount: 8, raceLibraryId: 'dauphine-2026', status: 'planned' },
    { id: 'tour-2026', name: 'Tour de France', shortName: 'Le Tour', startDate: '2026-07-04', endDate: '2026-07-26', leaderColor: '#f2d13d', raceType: 'stage-race', stageCount: 21, raceLibraryId: 'tour-2026', status: 'active' },
    { id: 'vuelta-2026', name: 'La Vuelta', shortName: 'La Vuelta', startDate: '2026-08-22', endDate: '2026-09-13', leaderColor: '#d62f38', raceType: 'stage-race', stageCount: 21, raceLibraryId: 'vuelta-2026', status: 'planned' },
    { id: 'worlds-2026', name: 'UCI Road World Championships', shortName: 'Worlds', startDate: '2026-09-20', endDate: '2026-09-27', leaderColor: '#69bce8', raceType: 'championship', stageCount: 1, raceLibraryId: 'worlds-2026', status: 'planned' },
    { id: 'lombardia-2026', name: 'Il Lombardia', shortName: 'Lombardia', startDate: '2026-10-10', endDate: '2026-10-10', leaderColor: '#8f5faa', raceType: 'one-day', stageCount: 1, raceLibraryId: 'lombardia-2026', status: 'planned' },
  ],
}]

export const getSeason = (year: number) => seasons.find((season) => season.year === year)

export function getCalendarMonth(year: number, month: number) {
  return {
    leadingDays: new Date(year, month, 1).getDay(),
    dayCount: new Date(year, month + 1, 0).getDate(),
  }
}

export function getInitialMonth(season: Season, currentRace?: string, now = new Date()) {
  const active = season.races.find((race) => race.status === 'active')
  const selected = season.races.find((race) => race.id === currentRace || race.name === currentRace)
  const race = active ?? selected
  if (race) return Number(race.startDate.slice(5, 7)) - 1
  return now.getFullYear() === season.year ? now.getMonth() : 0
}
