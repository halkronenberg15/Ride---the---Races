export type CourseProfilePoint = { distanceKm: number; elevationM: number }

type VerifiedProfileCourse = {
  profilePoints: CourseProfilePoint[]
  verification: { profile: boolean }
}

/**
 * Return the production course geometry. Verified courses are never allowed to
 * fall through to a stage-type/workout profile generator.
 *
 * The monotone cubic interpolation adds drawing resolution without overshoot:
 * every organiser sample is retained and no new summit or valley is invented.
 */
export function getAuthoritativeProfile(course: VerifiedProfileCourse, samplesPerInterval = 6): CourseProfilePoint[] {
  const source = course.profilePoints.map(point => ({ ...point }))
  if (!course.verification.profile || source.length < 3) return source
  return interpolateMonotone(source, samplesPerInterval)
}

export function normalizeProfileForViewport(profile: readonly CourseProfilePoint[], distanceKm: number) {
  if (!profile.length) return []
  const elevations = profile.map(point => point.elevationM)
  const min = Math.min(...elevations)
  const span = Math.max(1, Math.max(...elevations) - min)
  return profile.map(point => ({ x: point.distanceKm / distanceKm * 100, y: 92 - (point.elevationM - min) / span * 80 }))
}

/** Shape-preserving SVG sampling. It deliberately returns all source samples. */
export function sampleProfileForSvg(profile: readonly CourseProfilePoint[]) {
  return profile.map(point => ({ ...point }))
}

function interpolateMonotone(points: CourseProfilePoint[], subdivisions: number) {
  const count = Math.max(1, Math.floor(subdivisions))
  const x = points.map(point => point.distanceKm)
  const y = points.map(point => point.elevationM)
  const delta = y.slice(0, -1).map((value, index) => (y[index + 1] - value) / (x[index + 1] - x[index]))
  const slopes = y.map((_, index) => {
    if (index === 0) return delta[0]
    if (index === y.length - 1) return delta.at(-1)!
    if (delta[index - 1] * delta[index] <= 0) return 0
    return 2 / (1 / delta[index - 1] + 1 / delta[index])
  })
  const result: CourseProfilePoint[] = []
  for (let index = 0; index < points.length - 1; index++) {
    const width = x[index + 1] - x[index]
    for (let step = 0; step < count; step++) {
      const t = step / count
      const h00 = 2 * t ** 3 - 3 * t ** 2 + 1
      const h10 = t ** 3 - 2 * t ** 2 + t
      const h01 = -2 * t ** 3 + 3 * t ** 2
      const h11 = t ** 3 - t ** 2
      result.push({
        distanceKm: Number((x[index] + t * width).toFixed(4)),
        elevationM: Number((h00 * y[index] + h10 * width * slopes[index] + h01 * y[index + 1] + h11 * width * slopes[index + 1]).toFixed(3)),
      })
    }
  }
  result.push({ ...points.at(-1)! })
  return result
}

export function repeatProfileForLaps(lapProfile: readonly CourseProfilePoint[], lapDistanceKm: number, lapCount: number) {
  if (!Number.isInteger(lapCount) || lapCount < 1 || lapDistanceKm <= 0) return []
  const repeated: CourseProfilePoint[] = []
  for (let lap = 0; lap < lapCount; lap++) {
    lapProfile.forEach((point, index) => {
      if (lap > 0 && index === 0) return
      repeated.push({ distanceKm: Number((point.distanceKm + lap * lapDistanceKm).toFixed(4)), elevationM: point.elevationM })
    })
  }
  return repeated
}
