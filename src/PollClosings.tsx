import { useEffect, useState } from "react"
// Scheduled regional closings in EST, November 3, 2026. Split-zone states
// appear at each regional closing. Court extensions are not a live feed.
export const CLOSINGS: [number, string][] = [
  [18, "Indiana (Eastern), Kentucky (Eastern)"],
  [
    19,
    "Florida (Eastern), Georgia, Indiana (Central), Kentucky (Central), South Carolina, Vermont, Virginia",
  ],
  [19.5, "North Carolina, Ohio, West Virginia"],
  [
    20,
    "Alabama, Connecticut, Delaware, Florida (Central), Illinois, Kansas (Central), Maine, Maryland, Massachusetts, Michigan (Eastern), Mississippi, Missouri, New Hampshire (latest local closing), New Jersey, North Dakota (Central), Oklahoma, Pennsylvania, Rhode Island, South Dakota (Central), Tennessee, Texas (Central), DC",
  ],
  [20.5, "Arkansas"],
  [
    21,
    "Arizona, Colorado, Iowa, Kansas (Mountain), Louisiana, Michigan (Central), Minnesota, Nebraska, New Mexico, New York, North Dakota (Mountain), South Dakota (Mountain), Texas (Mountain), Wisconsin, Wyoming",
  ],
  [22, "Idaho (Mountain), Montana, Nevada, Oregon (Mountain), Utah"],
  [23, "California, Idaho (Pacific), Oregon (Pacific), Washington"],
  [24, "Alaska (Alaska time), Hawaii"],
  [25, "Alaska (Hawaii–Aleutian)"],
]
export function closingTime(hour: number) {
  return Date.UTC(2026, 10, 3, 5) + hour * 3600000
}
export function PollClosings({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const next = CLOSINGS.find(([h]) => closingTime(h) > now)
  const remaining = next ? Math.ceil((closingTime(next[0]) - now) / 1000) : 0
  if (compact) return <details className="compact-closing"><summary>{next ? `Next scheduled closing · ${Math.floor(remaining / 3600)}h ${Math.floor(remaining % 3600 / 60)}m ${remaining % 60}s` : "All scheduled closing times passed"}</summary>{next && <p>{next[1]}</p>}<p>Scheduled times, not confirmation; extensions and voters in line may apply. <a href="https://www.270towin.com/poll-closing-times/" target="_blank" rel="noreferrer">Schedule source · Eastern Time</a></p></details>
  return (
    <section className="map-card closing-card">
      <p className="eyebrow">Scheduled poll closings · live clock</p>
      <h2>
        {next
          ? `Next closing in ${Math.floor(remaining / 3600)}h ${Math.floor((remaining % 3600) / 60)}m ${remaining % 60}s`
          : "All listed scheduled closing times have passed"}
      </h2>
      {next && <p>{next[1]}</p>}
      <div className="upcoming-waves">{CLOSINGS.filter(([h]) => closingTime(h) > now).slice(0, 3).map(([h, areas]) => <p key={h}><strong>{new Date(closingTime(h)).toLocaleTimeString("en-US", {timeZone:"America/New_York",hour:"numeric",minute:"2-digit"})} ET</strong> · {areas}</p>)}</div>
      <details>
        <summary>Closing schedule and voting areas</summary>
        {CLOSINGS.map(([h, areas]) => (
          <p key={h}>
            <strong>
              {new Date(closingTime(h)).toLocaleTimeString("en-US", {
                timeZone: "America/New_York",
                hour: "numeric",
                minute: "2-digit",
              })}{" "}
              ET ·{" "}
              {now >= closingTime(h)
                ? "Scheduled polls closed · awaiting results"
                : "Upcoming"}
            </strong>
            <br />
            {areas}
          </p>
        ))}
      </details>
      <small>
        Scheduled times, not confirmation that voting has ended. Local hours and
        court extensions may differ; voters in line can still vote. Territories
        are not covered by this clock.{" "}
        <a
          href="https://www.270towin.com/poll-closing-times/"
          target="_blank"
          rel="noreferrer"
        >
          Schedule source
        </a>
      </small>
    </section>
  )
}

export function useElectionClock() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id) }, [])
  return now
}
export function stateClosingHours(state: string) {
  return CLOSINGS.filter(([, areas]) => areas.split(", ").some(area => area === state || area.startsWith(`${state} (`))).map(([hour]) => hour)
}
export function closingStatus(state: string, now: number) {
  const hours = stateClosingHours(state)
  const upcoming = hours.filter(h => closingTime(h) > now)
  if (!hours.length) return "Scheduled closing unavailable"
  if (!upcoming.length) return "All regions scheduled closed; voters in line and extensions may apply"
  const seconds = Math.ceil((closingTime(upcoming[0]) - now) / 1000)
  return `${new Date(closingTime(upcoming[0])).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" })} ET · ${upcoming.length < hours.length ? "Some regions scheduled closed · " : ""}Next regional closing in ${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m ${seconds % 60}s`
}
const WAVE_COLORS = ["#fde68a", "#fbbf24", "#fb923c", "#c084fc", "#a78bfa", "#818cf8", "#22d3ee", "#2dd4bf", "#a3e635", "#e879f9"]
export function closingColor(state: string, now: number, explicitHour?: number) {
  const hours = stateClosingHours(state)
  const hour = explicitHour ?? hours.find(h => closingTime(h) > now) ?? hours.at(-1)
  if (hour == null) return "#64748b"
  const color = WAVE_COLORS[CLOSINGS.findIndex(([h]) => h === hour)]
  return color
}

export function closingStage(state: string, now: number) {
  const hours = stateClosingHours(state)
  const upcoming = hours.find(h => closingTime(h) > now)
  const next = CLOSINGS.find(([h]) => closingTime(h) > now)?.[0]
  return { closed: hours.length > 0 && upcoming == null, next: upcoming != null && upcoming === next,
    partial: upcoming != null && hours.some(h => closingTime(h) <= now) }
}

export function closingStyle(state: string, now: number, view: string, prefix = "closing") {
  if (view !== "closings") return {}
  const stage = closingStage(state, now)
  const color = closingColor(state, now)
  return { fill: stage.closed ? color : `url(#${prefix}-${state.replace(/ /g, "-")})` }
}

// SVG pattern fills and explicit state clips keep all marks inside boundaries.
export function ClosingDefs({ locations, now, prefix }: { locations: { id: string; name: string; path: string }[]; now: number; prefix: string }) {
  return <defs>{locations.map(l => {
    const color = closingColor(l.name, now)
    const stage = closingStage(l.name, now)
    return <g key={l.id}>
      <clipPath id={`${prefix}-clip-${l.id}`}><path d={l.path} /></clipPath>
      <pattern id={`${prefix}-${l.name.replace(/ /g, "-")}`} width="12" height="12" patternUnits="userSpaceOnUse">
        <rect width="12" height="12" fill={paleWave(color, stage.next ? 0.3 : 0.12)} />
        {stage.next && <rect width="12" height="3" fill={color} />}
        {stage.partial && <circle cx="6" cy="8" r="1.8" fill="#18212e" />}
      </pattern>
    </g>
  })}</defs>
}
export function paleWave(color: string, strength: number) {
  const channels = [1, 3, 5].map(i => Math.round(255 + (parseInt(color.slice(i, i + 2), 16) - 255) * strength))
  return `rgb(${channels.join(", ")})`
}
export function ClosingLegend({ now }: { now: number }) {
  return <div className="closing-wave-legend">
    <strong>Scheduled closings · Eastern Time</strong>
    {CLOSINGS.map(([h]) => <span key={h}><i style={{ background: closingColor("", now, h) }} />{new Date(closingTime(h)).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" })} ET</span>)}
    <div className="closing-stage-legend"><span><i className="wave-upcoming" />Upcoming</span><span><i className="wave-next" />Closing Next · horizontal stripes</span><span><i className="wave-closed" />Closed · solid</span></div>
    <p>Dots: partially closed; some regions remain open. Split-zone states use their next regional wave, then their final wave after all regions close. Closed means scheduled time passed; extensions and voters in line may apply.</p>
  </div>
}
