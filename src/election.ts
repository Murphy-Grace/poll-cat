import type { SenateResultRace } from "./results"
export function margin(
  d: number | null | undefined,
  r: number | null | undefined,
) {
  return typeof d === "number" &&
    typeof r === "number" &&
    Number.isFinite(d) &&
    Number.isFinite(r) &&
    d >= 0 &&
    r >= 0 &&
    d <= 100 &&
    r <= 100
    ? d - r
    : null
}
export function voteMargin(race?: SenateResultRace) {
  if (!race || race.total <= 0) return null
  const d = race.cands.filter((c) =>
    ["D", "DEM", "DEMOCRATIC"].includes(c.p.toUpperCase()),
  )
  const r = race.cands.filter((c) =>
    ["R", "REP", "REPUBLICAN"].includes(c.p.toUpperCase()),
  )
  return d.length && r.length
    ? ((d.reduce((s, c) => s + c.v, 0) - r.reduce((s, c) => s + c.v, 0)) /
        race.total) *
        100
    : null
}
export function marginColor(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "#64748b"
  const center = [139, 111, 166],
    end = value >= 0 ? [37, 99, 235] : [220, 55, 65]
  const t = Math.min(Math.abs(value) / 20, 1)
  return `rgb(${center.map((c, i) => Math.round(c + (end[i] - c) * t)).join(",")})`
}
export function marginLabel(value: number | null) {
  return value === null
    ? "No verified D/R margin"
    : value === 0
      ? "Tie · 0.0 pp"
      : `${value > 0 ? "D" : "R"} +${Math.abs(value).toFixed(1)} pp`
}

// Hover details come only from the same reported counts used by map fills.
export function reportedVoteSummary(race?: SenateResultRace) {
  if (!race || race.total <= 0) return "No verified vote totals available · Reporting has not started"
  return `${race.cands.map(c => `${c.n} (${c.p}): ${((c.v / race.total) * 100).toFixed(1)}%`).join(" · ")} · ${race.pct_in == null ? "Reporting percentage unavailable" : `${race.pct_in}% reporting (provider units)`}`
}
