import { useEffect, useState } from "react"
// Scheduled regional closings in EST, November 3, 2026. Split-zone states
// appear at each regional closing. Court extensions are not a live feed.
// Verified Nov 3: https://www.270towin.com/poll-closing-times/
// NH local waves: https://apnews.com/article/b7e739aba1fe5f0525e55b973000cc1a
// Midnight NH voting is completion-based, not a fixed scheduled closing.
export const CLOSINGS: [number, string][] = [
  [18, "Indiana (Eastern), Kentucky (Eastern)"],
  [
    19,
    "Florida (Eastern), Georgia, Indiana (Central), Kentucky (Central), South Carolina, Vermont, Virginia, New Hampshire (7 PM local)",
  ],
  [19.5, "North Carolina, Ohio, West Virginia, New Hampshire (7:30 PM local)"],
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
  // Election day is Eastern Standard Time (UTC−05:00), independent of the viewer’s zone.
  return Date.parse("2026-11-03T00:00:00-05:00") + hour * 3600000
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
  if (!hours.length) return "Closing time unavailable"
  const stage = closingStage(state, now)
  if (stage.closed) return "Polls closed"
  if (stage.partial) return "Partially closed"
  return stage.next ? "Closing next" : "Polls open"
}
export const WAVE_COLORS: Record<number, string> = {
  18: "#b28b22", 19: "#dc6b23", 19.5: "#b34d86", 20: "#8058b3",
  20.5: "#a27860", 21: "#527d91", 22: "#168b90", 23: "#458747",
  24: "#8a9725", 25: "#c75db0",
}
export function closingColor(state: string, now: number, explicitHour?: number) {
  const hours = stateClosingHours(state)
  const hour = explicitHour ?? hours.find(h => closingTime(h) > now) ?? hours.at(-1)
  if (hour == null) return "#64748b"
  const color = WAVE_COLORS[hour]
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

// Density counts elapsed scheduled waves, never geographic or voter coverage.
export function closingPattern(state: string, now: number) {
  const stage = closingStage(state, now)
  const elapsed = stateClosingHours(state).filter(h => closingTime(h) <= now).length
  return {
    kind: stage.closed ? "solid" : stage.partial ? "dots" : stage.next ? "stripes" : "pale",
    spacing: Math.max(5, 14 - elapsed * 3),
  }
}
export function closingSecondary(state: string, now: number) {
  const stage = closingStage(state, now)
  return stage.partial && stage.next ? "Closing next" : ""
}
// SVG pattern fills and explicit state clips keep all marks inside boundaries.
export function ClosingDefs({ locations, now, prefix }: { locations: { id: string; name: string; path: string }[]; now: number; prefix: string }) {
  return <defs>{locations.map(l => {
    const color = closingColor(l.name, now)
    const { kind, spacing } = closingPattern(l.name, now)
    const size = kind === "dots" ? spacing : 12
    return <g key={l.id}>
      <clipPath id={`${prefix}-clip-${l.id}`}><path d={l.path} /></clipPath>
      <pattern id={`${prefix}-${l.name.replace(/ /g, "-")}`} width={size} height={size} patternUnits="userSpaceOnUse">
        <rect width={size} height={size} fill={paleWave(color, 0.12)} />
        {kind === "stripes" && <rect width={size} height="4" fill={color} />}
        {kind === "dots" && <circle cx={size / 2} cy={size / 2} r="1.3" fill={color} />}
      </pattern>
    </g>
  })}</defs>
}
export function paleWave(color: string, strength: number) {
  const channels = [1, 3, 5].map(i => Math.round(255 + (parseInt(color.slice(i, i + 2), 16) - 255) * strength))
  return `rgb(${channels.join(", ")})`
}
export function ClosingLegend({ now }: { now: number }) {
  const color = closingColor("", now, 20.5)
  const pale = paleWave(color, 0.12)
  return <div className="closing-wave-legend">
    <strong>Color = scheduled closing time · Eastern Time</strong>
    {CLOSINGS.map(([h]) => <span key={h}><i style={{ background: closingColor("", now, h) }} />{new Date(closingTime(h)).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" })} ET</span>)}
    <div className="closing-stage-legend"><strong>Pattern = closing status</strong><span><i style={{ background: pale }} />Upcoming · pale</span><span><i style={{ background: `repeating-linear-gradient(to bottom, ${color} 0 4px, ${pale} 4px 12px)` }} />Closing next · horizontal stripes</span><span><i style={{ background: color }} />Polls closed · solid</span><span><i style={{ backgroundColor: pale, backgroundImage: `radial-gradient(circle at 6px 8px, ${color} 0 1.3px, transparent 1.3px)`, backgroundSize: "12px 12px" }} />Partially closed · dots</span></div>
    <p>Color shows the next scheduled regional wave, or the final wave once closed. More dots mean more scheduled regional waves have passed, not a share of precincts or voters. Dot positions do not identify closed areas.</p>
    <details className="closing-explanation">
      <summary>Why are some zones gray?</summary>
      <div>
        <p>Pale zones have upcoming scheduled closings. Gray zones have no verified closing time.</p>
        <p>This map shows scheduled poll-closing status, not confirmation that every polling location has physically stopped accepting voters. People already in line may still be able to vote, and some locations may have extended hours.</p>
        <p>A closed poll does not necessarily mean election results are available.</p>
      </div>
    </details>
  </div>
}
