export const OFFICIAL_COURSE_MARKER_TYPES = ['start', 'km-zero', 'kom', 'sprint', 'bonus', 'tt-check', 'finish'] as const

export type OfficialCourseMarkerType = typeof OFFICIAL_COURSE_MARKER_TYPES[number]

export type OfficialCourseMarker = {
  id: string
  type: OfficialCourseMarkerType
  routeKm: number
  label: string
  category?: string
  climbName?: string
  verified: boolean
  source?: { organization: string; reference: string; verifiedAt?: string }
}

export type MarkerAuditContext = { race: string; stageNumber: number; officialDistanceKm: number }

const supportedTypes = new Set<string>(OFFICIAL_COURSE_MARKER_TYPES)
const diagnostic = (context: MarkerAuditContext, marker: OfficialCourseMarker) =>
  `[${context.race} Stage ${context.stageNumber} marker ${marker.id}] ${marker.type} routeKm ${String(marker.routeKm)}; official distance ${context.officialDistanceKm}`

/** Validate source data before any rendering clamp is considered. */
export function validateOfficialCourseMarkers(markers: readonly OfficialCourseMarker[], context: MarkerAuditContext): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const coordinates = new Set<string>()
  for (const marker of markers) {
    const prefix = diagnostic(context, marker)
    if (!marker.id.trim()) errors.push(`${prefix}: stable ID is required`)
    else if (ids.has(marker.id)) errors.push(`${prefix}: duplicate marker ID`)
    ids.add(marker.id)
    if (!supportedTypes.has(marker.type)) errors.push(`${prefix}: unsupported marker type`)
    if (!Number.isFinite(marker.routeKm)) errors.push(`${prefix}: routeKm must be finite`)
    else if (marker.routeKm < 0) errors.push(`${prefix}: routeKm is below 0`)
    else if (marker.routeKm > context.officialDistanceKm) errors.push(`${prefix}: routeKm exceeds official distance`)
    if (marker.verified && (!marker.source?.organization.trim() || !marker.source.reference.trim())) errors.push(`${prefix}: verified marker requires provenance`)
    const coordinate = `${marker.type}:${marker.routeKm}`
    if (coordinates.has(coordinate)) errors.push(`${prefix}: duplicate type and routeKm`)
    coordinates.add(coordinate)
    if (marker.type === 'finish' && marker.routeKm !== context.officialDistanceKm) errors.push(`${prefix}: finish must equal official distance`)
  }
  return errors
}

export function resolveOfficialCourseMarkers(markers: readonly OfficialCourseMarker[] | undefined, context: MarkerAuditContext) {
  const endpointSource = { organization: context.race, reference: 'Official stage distance definition' }
  const supplied = markers ?? []
  const complete = [
    ...(supplied.some(marker => marker.type === 'km-zero') ? [] : [{ id: `${context.race.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-s${context.stageNumber}-km-zero`, type: 'km-zero' as const, routeKm: 0, label: 'KM 0', verified: true, source: endpointSource }]),
    ...supplied,
    ...(supplied.some(marker => marker.type === 'finish') ? [] : [{ id: `${context.race.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-s${context.stageNumber}-finish`, type: 'finish' as const, routeKm: context.officialDistanceKm, label: 'FINISH', verified: true, source: endpointSource }]),
  ]
  const errors = validateOfficialCourseMarkers(complete, context)
  if (errors.length) throw new Error(errors.join('\n'))
  return complete.filter(marker => marker.verified)
    .sort((a, b) => a.routeKm - b.routeKm || a.type.localeCompare(b.type) || a.id.localeCompare(b.id))
}

export function markerPosition(marker: Pick<OfficialCourseMarker, 'routeKm'>, officialDistanceKm: number) {
  return marker.routeKm / officialDistanceKm
}

export function crossedOfficialMarker(previousCourseDistance: number, currentCourseDistance: number, marker: Pick<OfficialCourseMarker, 'routeKm'>) {
  return previousCourseDistance < marker.routeKm && currentCourseDistance >= marker.routeKm
}
