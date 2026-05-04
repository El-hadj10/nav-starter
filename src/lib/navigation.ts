export type TravelMode = 'drive' | 'transit' | 'walk'

export type TrafficLevel = 'Low' | 'Moderate' | 'Heavy'

export function formatClock(offsetInMinutes: number) {
  const now = new Date()
  now.setMinutes(now.getMinutes() + offsetInMinutes)

  return now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

export function computeDistanceKm(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
) {
  const earthRadiusKm = 6371
  const latitudeDelta = toRadians(destination.latitude - origin.latitude)
  const longitudeDelta = toRadians(destination.longitude - origin.longitude)
  const startLatitude = toRadians(origin.latitude)
  const endLatitude = toRadians(destination.latitude)

  const haversineValue =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(longitudeDelta / 2) ** 2

  const centralAngle = 2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue))

  return earthRadiusKm * centralAngle
}

export function computeLiveEta(distanceKm: number, mode: TravelMode, traffic: TrafficLevel) {
  const trafficPenalty = traffic === 'Heavy' ? 1.28 : traffic === 'Moderate' ? 1.12 : 1

  if (mode === 'walk') {
    return Math.max(3, Math.round((distanceKm / 4.8) * 60))
  }

  if (mode === 'transit') {
    return Math.max(5, Math.round((distanceKm / 26) * 60 + 6))
  }

  return Math.max(4, Math.round((distanceKm / 34) * 60 * trafficPenalty + 2))
}
