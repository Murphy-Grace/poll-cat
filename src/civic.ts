// civicAPI v2: search candidates can be truncated. Display only full race payloads.
export type CivicOffice = 'Senate' | 'House' | 'Governor'
export type CivicRace = { id: number; key: string; name: string; state: string; district: string | null; office: CivicOffice }
export type CivicCandidate = { name: string; party: string; votes: number | null; percent: number | null; winner: boolean | null }
export type CivicResult = { candidates: CivicCandidate[]; updated: string | null; reporting: number | null; disputed: boolean }
const types = { Senate: 'US Senate', House: 'House of Representatives', Governor: 'Governor' }
const queries = { Senate: 'US Senate', House: 'US House', Governor: 'Governor' }
const states = new Set('AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY GU MP VI'.split(' '))
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const number = (v: unknown, max = Number.MAX_SAFE_INTEGER): number | null => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max ? v : null
export function parseCivicSearch(value: unknown, office: CivicOffice): CivicRace[] {
  if (!record(value) || !Array.isArray(value.races) || typeof value.count !== 'number' || value.count > 1000 || value.count !== value.races.length) throw Error('Incomplete or invalid civicAPI search response.')
  const races = new Map<string, CivicRace>()
  const ambiguous = new Set<string>()
  for (const row of value.races) {
    if (!record(row) || row.type !== types[office] || row.country !== 'US' || typeof row.province !== 'string' || !states.has(row.province) || typeof row.election_date !== 'string' || !row.election_date.startsWith('2026-11-03T') || typeof row.election_name !== 'string' || /primary|runoff|early vote/i.test(row.election_name) || !['General', 'Statewide'].includes(String(row.election_type)) || !Number.isSafeInteger(row.id)) continue
    const district = typeof row.district === 'string' ? row.district : null
    if (office === 'House' && (!district || !new RegExp(`^${row.province}-(\\d{2}|AL)$`).test(district))) continue
    if (office !== 'House' && district && district !== row.province) continue
    const key = `${office}:2026-11-03:${row.province}:${office === 'House' ? district : /special/i.test(row.election_name) ? 'SP' : 'REG'}`
    const prior = races.get(key)
    if (prior && prior.id !== row.id) ambiguous.add(key)
    races.set(key, { id: row.id as number, key, name: row.election_name, state: row.province, district, office })
  }
  // Conflicting provider IDs for a seat require review, never arbitrary selection.
  return [...races.values()].filter(r => !ambiguous.has(r.key)).sort((a,b) => a.name.localeCompare(b.name))
}
export function parseCivicResult(value: unknown, race: CivicRace): CivicResult {
  if (!record(value) || value.test_data === true || value.country !== 'US' || value.province !== race.state || value.election_type !== types[race.office] || value.election_name !== race.name || (value.district ?? null) !== race.district || typeof value.election_date !== 'string' || !value.election_date.startsWith('2026-11-03T') || !Array.isArray(value.candidates)) throw Error('Invalid or incompatible civicAPI race response.')
  return {
    candidates: value.candidates.map(c => {
      if (!record(c) || typeof c.name !== 'string' || typeof c.party !== 'string') throw Error('Invalid civicAPI candidate.')
      const votes = number(c.votes)
      return { name: c.name, party: c.party, votes: votes !== null && Number.isSafeInteger(votes) ? votes : null, percent: number(c.percent,100), winner: typeof c.winner === 'boolean' ? c.winner : null }
    }),
    updated: typeof value.last_updated === 'string' && Number.isFinite(Date.parse(value.last_updated)) ? value.last_updated : null,
    reporting: number(value.percent_reporting,100), disputed: value.is_disputed === true,
  }
}
const cache = new Map<string, { until: number; value: unknown }>()
const pending = new Map<string, Promise<unknown>>()
let blockedUntil = 0
export async function civicRequest(path: string): Promise<unknown> {
  const cached = cache.get(path)
  if (cached && cached.until > Date.now()) return cached.value
  if (Date.now() < blockedUntil) throw Error('civicAPI rate limit: wait before refreshing.')
  const existing = pending.get(path)
  if (existing) return existing
  const request = (async () => {
    const response = await fetch(`https://civicapi.org/api/v2/${path}`, { credentials: 'omit', signal: AbortSignal.timeout(20000) })
    if (response.status === 429) {
      const retry = response.headers.get('Retry-After')
      const seconds = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : retry ? Date.parse(retry) - Date.now() : 60000
      blockedUntil = Date.now() + Math.max(60000, Number.isFinite(seconds) ? seconds : 60000)
      throw Error('civicAPI rate limit reached; refresh paused for at least 60 seconds.')
    }
    if (!response.ok) throw Error(`civicAPI request failed (${response.status}).`)
    const value: unknown = await response.json()
    cache.set(path, { until: Date.now() + 60000, value })
    return value
  })()
  pending.set(path, request)
  try { return await request } finally { pending.delete(path) }
}
export async function fetchCivicRaces(office: CivicOffice) {
  return parseCivicSearch(await civicRequest(`race/search?${new URLSearchParams({startDate:'2026-11-03',endDate:'2026-11-03',country:'US',query:queries[office],limit:'1000'})}`),office)
}
export async function fetchCivicResult(race: CivicRace) { return parseCivicResult(await civicRequest(`race/${race.id}`), race) }
