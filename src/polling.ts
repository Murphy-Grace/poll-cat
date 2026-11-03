export type PollingRace = {
  race_type: string
  state: string
  is_special: boolean
  dem_average: number | null
  rep_average: number | null
  ind_average: number | null
  margin: number | null
  margin_label: string | null
  rating: string | null
  rating_source: string | null
  poll_count: number
  last_poll_date: string | null
  page: string
  detail: string
}

export type PollingSurvey = {
  pollster: string
  end_date: string
  sample_size: number | null
  margin_of_error: string | null
  population: string | null
  dem_candidate: string
  dem_pct: string | null
  rep_candidate: string
  rep_pct: string | null
  ind_pct: string | null
  source_url: string
}

export type PollingDetail = {
  race: PollingRace
  recent_polls: {
    window_days: number
    note: string
    polls: PollingSurvey[]
  }
  average_trend: {
    democrat: Array<[string, number]>
    republican: Array<[string, number]>
    labels: {
      democrat: string
      republican: string
    }
  }
  attribution: {
    cite_as: string
    methodology: string
    terms: string
  }
}

export type ForecastRace = {
  key: string
  kind: string
  state: string
  name: string
  special: boolean
  left_party: string
  left_candidate: string
  rep_candidate: string
  polls_used: number
  poll_average: number | null
  best_bet_margin: number
  range80_low: number
  range80_high: number
  chance_left: number
  rating: string
  winner: string
  as_of: string
  page: string
  licence: string
}

export type ForecastPoll = {
  poll_id: number
  pollster: string
  sponsor: string | null
  fieldwork_start: string
  fieldwork_end: string
  population: string
  sample: number | null
  figures: string
  margin: number | null
  adjusted_margin: number | null
  source_url: string
  source_grade: string | null
  licence: string
}

export type ForecastDetail = {
  asOf: string
  race: ForecastRace
  polls: ForecastPoll[]
}

export type ForecastDataset = {
  asOf: string
  licence: string
  attribution: string
  rows: ForecastRace[]
}

const POLLING_BASE = "https://pollingsource.com/api/v1"
const FORECAST_BASE = "https://www.pollingforecast.com/api/us"

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function assertRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${label} response was not an object.`)
  return value
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} was not an array.`)
  return value
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value) {
    throw new Error(`${label} was missing.`)
  }
  return value
}

function requireNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} was not a number.`)
  }
  return value
}

function validatePollingRace(value: unknown): PollingRace {
  const row = assertRecord(value, "PollingSource race")
  requireString(row.state, "PollingSource state")
  requireString(row.race_type, "PollingSource race type")
  requireString(row.page, "PollingSource race page")
  requireString(row.detail, "PollingSource detail URL")
  if (typeof row.is_special !== "boolean") {
    throw new Error("PollingSource special-election flag was missing.")
  }
  return row as PollingRace
}

export function validateForecastRace(value: unknown): ForecastRace {
  const row = assertRecord(value, "Polling Forecast race")
  requireString(row.key, "Polling Forecast key")
  requireString(row.state, "Polling Forecast state")
  requireString(row.kind, "Polling Forecast office")
  requireString(row.as_of, "Polling Forecast as-of date")
  requireNumber(row.best_bet_margin, "Polling Forecast modeled margin")
  if (row.poll_average == null) row.poll_average = null
  else requireNumber(row.poll_average, "Polling Forecast polling margin")
  requireString(row.left_party, "Polling Forecast left party")
  requireNumber(row.chance_left, "Polling Forecast probability")
  requireNumber(row.range80_low, "Polling Forecast lower range")
  requireNumber(row.range80_high, "Polling Forecast upper range")
  if (typeof row.special !== "boolean") {
    throw new Error("Polling Forecast special-election flag was missing.")
  }
  return row as ForecastRace
}

const jsonCache = new Map<string, { until: number; value: unknown }>()
const pendingJson = new Map<string, Promise<unknown>>()
const cooldown = new Map<string, number>()
async function getJson(url: string): Promise<unknown> {
  const origin = new URL(url).origin
  if ((cooldown.get(origin) ?? 0) > Date.now()) throw new Error(`Provider rate limit cooldown: ${url}`)
  const cached = jsonCache.get(url)
  if (cached && cached.until > Date.now()) return cached.value
  const pending = pendingJson.get(url)
  if (pending) return pending
  const request = requestJson(url).then(value => {
    jsonCache.set(url, { until: Date.now() + 600_000, value })
    return value
  })
  pendingJson.set(url, request)
  try { return await request } finally { pendingJson.delete(url) }
}
async function requestJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    credentials: "omit",
    signal: AbortSignal.timeout(20000),
  })
  if (!response.ok) {
    if (response.status === 429) {
      const retry = response.headers.get("Retry-After")
      const wait = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : retry ? Date.parse(retry) - Date.now() : 60000
      cooldown.set(new URL(url).origin, Date.now() + Math.max(60000, Number.isFinite(wait) ? wait : 60000))
    }
    throw new Error(`Provider returned HTTP ${response.status} for ${url}${response.url && response.url !== url ? ` (resolved to ${response.url})` : ""}.`)
  }
  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) {
    throw new Error("Provider returned a non-JSON response.")
  }
  return response.json() as Promise<unknown>
}

export async function fetchPollingRaces(
  office: "senate" | "governor" = "senate",
): Promise<PollingRace[]> {
  const payload = assertRecord(
    await getJson(`${POLLING_BASE}/races`),
    "PollingSource",
  )
  if (payload.dataset !== "PollingSource race polling averages") {
    throw new Error("PollingSource dataset identifier was unexpected.")
  }
  return requireArray(payload.races, "PollingSource races")
    .map(validatePollingRace)
    .filter((race) => race.race_type === office)
}

export async function fetchPollingDetail(
  detailUrl: string,
): Promise<PollingDetail> {
  if (!detailUrl.startsWith(`${POLLING_BASE}/race?`)) {
    throw new Error("PollingSource detail URL was outside the expected API.")
  }
  const payload = assertRecord(await getJson(detailUrl), "PollingSource detail")
  validatePollingRace(payload.race)
  const recent = assertRecord(
    payload.recent_polls,
    "PollingSource recent polls",
  )
  requireArray(recent.polls, "PollingSource survey rows")
  const trend = assertRecord(payload.average_trend, "PollingSource trend")
  requireArray(trend.democrat, "PollingSource Democratic trend")
  requireArray(trend.republican, "PollingSource Republican trend")
  return payload as PollingDetail
}

export type ForecastOffice = "senate" | "house" | "governors"

export async function fetchForecastRaces(office: ForecastOffice = "senate"): Promise<ForecastDataset> {
  const payload = assertRecord(
    await getJson(`${FORECAST_BASE}/${office}`),
    "Polling Forecast",
  )
  if (payload.dataset !== office) {
    throw new Error("Polling Forecast dataset identifier was unexpected.")
  }
  const rows = requireArray(payload.rows, "Polling Forecast rows").map(
    validateForecastRace,
  )
  const kind = { senate: "Senate", house: "House", governors: "Governor" }[office]
  if (payload.count !== rows.length || rows.some(row => row.kind !== kind) || new Set(rows.map(row => row.key)).size !== rows.length) {
    throw new Error("Polling Forecast dataset coverage or office was inconsistent.")
  }
  return {
    asOf: requireString(payload.asOf, "Polling Forecast dataset date"),
    licence: requireString(payload.licence, "Polling Forecast licence"),
    attribution: requireString(
      payload.attribution,
      "Polling Forecast attribution",
    ),
    rows,
  }
}

export async function fetchForecastDetail(
  raceKey: string,
): Promise<ForecastDetail> {
  if (!/^[A-Z]{2}(?:-[A-Z0-9]+)?$/.test(raceKey)) {
    throw new Error("Polling Forecast race key was invalid.")
  }
  const payload = assertRecord(
    await getJson(`${FORECAST_BASE}/race/${encodeURIComponent(raceKey)}`),
    "Polling Forecast detail",
  )
  validateForecastRace(payload.race)
  requireArray(payload.polls, "Polling Forecast poll rows")
  return payload as ForecastDetail
}

export function matchPollingRace(
  rows: PollingRace[],
  state: string,
  special: boolean,
): PollingRace | undefined {
  return rows.find((row) => row.state === state && row.is_special === special)
}

export function matchForecastRace(
  rows: ForecastRace[],
  state: string,
  special: boolean,
): ForecastRace | undefined {
  return rows.find((row) => row.state === state && row.special === special)
}
