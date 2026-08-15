import type { CourseVerification, ProfessionalEvent, RouteMap } from './professionalRaces.ts'

const SOURCE = 'UCI 2026 Road World Championships Montréal official bulletin'
const REFERENCE = 'Supplied official UCI Montréal 2026 course-reference bulletin'
const UPDATED_AT = '2026-08-15'
const verification = (profile: boolean, map: boolean): CourseVerification => ({
  profile, map, distance: true, ascent: false, markers: false,
  source: SOURCE, reference: REFERENCE, updatedAt: UPDATED_AT,
})
const officialMap = (alt: string, points: RouteMap['points']): RouteMap => ({
  type: 'simplified-route', alt, verified: true, source: SOURCE, points,
})

export const uciWorlds2026: ProfessionalEvent = {
  id: 'worlds-2026', kind: 'championship', season: 2026,
  name: '2026 UCI Road World Championships', location: 'Montréal, Canada',
  identity: { shortName: 'Worlds', raceAccentColor: '#69bce8', leaderJerseyColor: '#f5f5f5', sprintMarkerColor: '#69bce8', komMarkerColor: '#ef3340', finishMarkerColor: '#ffffff', kmZeroMarkerColor: '#ffd400', timeCheckMarkerColor: '#55dff7' },
  races: [{
    id: 'men-elite-itt', name: 'Men Elite Individual Time Trial', date: '2026-09-20', discipline: 'individual-time-trial',
    course: {
      courseKind: 'point-to-point', start: 'Montréal (Avenue du Parc)', finish: 'Montréal (Parc Jeanne-Mance)', distanceKm: 39.2,
      map: officialMap('Official-reference schematic of the Montréal men elite individual time trial loop', [{x:48,y:88},{x:25,y:76},{x:14,y:48},{x:29,y:18},{x:68,y:13},{x:86,y:43},{x:72,y:75},{x:52,y:87}]),
      profile: undefined, verification: verification(false, true), workoutReady: false,
    },
  }, {
    id: 'men-elite-road-race', name: 'Men Elite Road Race — Mont-Royal Circuit', discipline: 'road-race',
    course: {
      courseKind: 'circuit', start: 'Montréal (Parc Jeanne-Mance)', finish: 'Montréal (Parc Jeanne-Mance)', lapDistanceKm: 13.4,
      lapCount: undefined, totalDistanceKm: undefined,
      lapProfile: [{distanceKm:0,elevationM:48},{distanceKm:1.1,elevationM:62},{distanceKm:2.4,elevationM:156},{distanceKm:3.2,elevationM:204},{distanceKm:4.4,elevationM:82},{distanceKm:6.3,elevationM:61},{distanceKm:8.6,elevationM:72},{distanceKm:10.8,elevationM:58},{distanceKm:13.4,elevationM:48}],
      lapMap: officialMap('Official-reference schematic of the Mont-Royal circuit', [{x:53,y:87},{x:28,y:78},{x:15,y:51},{x:31,y:19},{x:65,y:15},{x:85,y:42},{x:76,y:72},{x:53,y:87}]),
      verification: verification(true, true), workoutReady: false,
    },
  }],
}

export const professionalEvents = [uciWorlds2026]
