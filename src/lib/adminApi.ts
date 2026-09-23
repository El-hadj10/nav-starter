import { buildApiUrl } from './apiUrl'

export type DestinationInput = {
  name: string
  area: string
  tag?: string
  description?: string
  traffic?: 'Low' | 'Moderate' | 'Heavy'
  parking?: string
  offlinePack?: string
  latitude: number
  longitude: number
  steps?: Array<{ title: string; detail?: string; baseMinuteOffset: number }>
  sortOrder?: number
}

export type DestinationRecord = DestinationInput & {
  id: string
  coordinates: { latitude: number; longitude: number }
  baseSteps: Array<{ title: string; detail: string; baseMinuteOffset: number }>
}

export type DestinationPayload = Omit<DestinationRecord, 'coordinates' | 'baseSteps'> & {
  latitude: number
  longitude: number
  steps: Array<{ title: string; detail?: string; baseMinuteOffset: number }>
}

export function parseDestinationRecord(record: DestinationRecord): DestinationPayload {
  return {
    ...record,
    latitude: record.coordinates.latitude,
    longitude: record.coordinates.longitude,
    steps: record.baseSteps,
  }
}

type RequestOptions = {
  token: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
}

async function requestJson<T>(pathname: string, options: RequestOptions): Promise<T> {
  const endpoint = buildApiUrl(pathname)
  const response = await fetch(endpoint.toString(), {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.token}`,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || `Request failed (${response.status})`)
  }

  return (await response.json()) as T
}

export async function fetchDestinations(token: string): Promise<DestinationRecord[]> {
  const payload = await requestJson<{ destinations: DestinationRecord[] }>('/api/destinations', { token })
  return payload.destinations
}

export async function createDestination(token: string, destination: DestinationInput): Promise<DestinationRecord> {
  return requestJson<DestinationRecord>('/api/destinations', { token, method: 'POST', body: destination })
}

export async function updateDestination(
  token: string,
  id: string,
  destination: DestinationInput,
): Promise<DestinationRecord> {
  return requestJson<DestinationRecord>(`/api/destinations/${encodeURIComponent(id)}`, {
    token,
    method: 'PUT',
    body: destination,
  })
}

export async function deleteDestination(token: string, id: string): Promise<void> {
  await requestJson<{ ok: boolean }>(`/api/destinations/${encodeURIComponent(id)}`, { token, method: 'DELETE' })
}
