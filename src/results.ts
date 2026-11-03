// Official state-reported counts. Contract: https://openamerica.io/elections/api/
export type SenateResultCandidate = {
  n: string
  p: string
  v: number
  pct: number | null
}

export type SenateResultRace = {
  leader: string
  total: number
  pct_in: number | null
  cands: SenateResultCandidate[]
}

export type SenateResultsFeed = {
  stale?: boolean
  final?: boolean
  live: boolean
  counting: boolean
  as_of: string | null
  races: Record<string, SenateResultRace>
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function votes(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
}

function percentage(value: unknown): value is number | null {
  return (
    value === null ||
    (typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 100)
  )
}

export function parseSenateResults(
  value: unknown,
  office: "Senate" | "Governor" = "Senate",
): SenateResultsFeed {
  const invalid = () =>
    new Error(
      "The Senate results provider returned an invalid or unsupported response.",
    )
  if (
    !record(value) ||
    value.api !== 1 ||
    value.year !== 2026 ||
    value.office !== office ||
    typeof value.live !== "boolean" ||
    typeof value.counting !== "boolean" ||
    !(
      value.as_of === null ||
      (typeof value.as_of === "string" &&
        Number.isFinite(Date.parse(value.as_of)))
    ) ||
    !record(value.races)
  )
    throw invalid()

  const races: Record<string, SenateResultRace> = {}
  for (const [key, race] of Object.entries(value.races)) {
    if (
      !/^[A-Z]{2}(-special)?$/.test(key) ||
      !record(race) ||
      typeof race.leader !== "string" ||
      !votes(race.total) ||
      !percentage(race.pct_in) ||
      !Array.isArray(race.cands)
    )
      throw invalid()
    const cands = race.cands.map((candidate): SenateResultCandidate => {
      if (
        !record(candidate) ||
        typeof candidate.n !== "string" ||
        typeof candidate.p !== "string" ||
        !votes(candidate.v) ||
        !percentage(candidate.pct)
      )
        throw invalid()
      return {
        n: candidate.n,
        p: candidate.p,
        v: candidate.v,
        pct: candidate.pct,
      }
    })
    // Existing dashboard consumers identify state races by the "ST-" prefix.
    // Keep regular and special elections distinct; never synthesize absent seats.
    races[key.endsWith("-special") ? `${key.slice(0, 2)}-SP` : `${key}-REG`] = {
      leader: race.leader,
      total: race.total,
      pct_in: race.pct_in,
      cands,
    }
  }
  return {
    stale: value.stale === true,
    final: value.final === true,
    live: value.live,
    counting: value.counting,
    as_of: value.as_of,
    races,
  }
}

export async function fetchSenateResults(
  office: "Senate" | "Governor" = "Senate",
): Promise<SenateResultsFeed> {
  const response = await fetch(
    `https://openamerica.io/elections/results.json?year=2026&office=${office}`,
    {
      headers: { Accept: "application/json" },
      credentials: "omit",
      signal: AbortSignal.timeout(20_000),
    },
  )
  if (!response.ok)
    throw new Error(`Senate results request failed (${response.status}).`)
  return parseSenateResults(await response.json(), office)
}

export const RESULTS_COVERAGE = new Set("AR AZ CO CT FL GA IA ID IN LA MI MN NC PA RI SC TX UT VA VT WA WV".split(" "))
