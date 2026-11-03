import { LiveElectionStatus } from './LiveElectionStatus'
import { GOVERNOR_PORTRAITS } from './governor-portraits'
import { RefreshStatus } from './RefreshStatus'
import { StateSilhouette } from './StateSilhouette'
import { GuardianNews, useGuardianNews } from './GuardianNews'
import { ClosingDefs, ClosingLegend, PollClosings, closingStyle, CLOSINGS, closingColor, closingStatus, closingTime, stateClosingHours, useElectionClock } from './PollClosings'
import type { SenateCandidate } from './senate'
function governorPhoto(identity: string): SenateCandidate['photo'] { return GOVERNOR_PORTRAITS[identity] ?? null }
import { useEffect, useState } from "react"
import usaMap from "@svg-maps/usa"
import directory from "./governors.json"
import { fetchPollingRaces, type PollingRace } from "./polling"
import { fetchSenateResults, type SenateResultsFeed } from "./results"
import { margin, marginColor, marginLabel, voteMargin, reportedVoteSummary } from "./election"
type GovernorLocation = {
  id: string
  name: string
  path: string
}

export function MarginLegend() {
  return (
    <div className="margin-legend">
      <div className="margin-gradient" />
      <p>D +20 ← D +10 ← Tie → R +10 → R +20</p>
      <small>
        Continuous D minus R margin in percentage points. Gray: no election.
        Slate: data unavailable. Color indicates a lead, never a winner.
      </small>
    </div>
  )
}
export function GovernorMap({ mode, news }: { mode: "polling" | "election"; news: ReturnType<typeof useGuardianNews> }) {
  const [view, setView] = useState<'polling' | 'results' | 'closings'>(mode === 'election' ? 'results' : 'polling')
  useEffect(() => setView(mode === 'election' ? 'results' : 'polling'), [mode])
  const [sort, setSort] = useState('alpha')
  const [hovered, setHovered] = useState<string | null>(null)
  const now = useElectionClock()
  const locations = (usaMap.locations as GovernorLocation[]).filter(l => l.id !== 'dc')
  const normalizedName = (name: string) => name.replace(/^Gov\. /, '').replace(/ \([^)]+\)$/, '').toLowerCase()

  const [selected, setSelected] = useState<string | null>(null)
  const [polls, setPolls] = useState<PollingRace[]>([])
  const [results, setResults] = useState<SenateResultsFeed | null>(null)
  const [pollSuccess, setPollSuccess] = useState<string | null>(null)
  const [resultSuccess, setResultSuccess] = useState<string | null>(null)
  const [pollError, setPollError] = useState("")
  const [resultError, setResultError] = useState("")
  const [pollNext, setPollNext] = useState(Date.now())
  const [resultNext, setResultNext] = useState(Date.now())
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("poll-cat-governor-watchlist") || "[]",
      )
    } catch {
      return []
    }
  })
  useEffect(() => {
    try { localStorage.setItem("poll-cat-governor-watchlist", JSON.stringify(saved)) } catch { /* Device storage unavailable. */ }
  }, [saved])
  useEffect(() => {
    let active = true
    let pollBusy = false, resultBusy = false
    let pollDue = 0, resultDue = 0
    const polling = async () => {
      if (pollBusy || document.hidden) return
      pollBusy = true
      try { const data = await fetchPollingRaces("governor"); if (active) { setPolls(data); setPollSuccess(new Date().toISOString()); setPollError("") } }
      catch { if (active) setPollError("Governor polling refresh failed; retained data may be stale") }
      finally { pollBusy = false; if (active) { pollDue = Date.now() + 900000; setPollNext(pollDue) } }
    }
    const reported = async () => {
      if (resultBusy || document.hidden) return
      resultBusy = true
      try { const data = await fetchSenateResults("Governor"); if (active) { setResults(data); setResultError(data.stale ? "Governor results are stale" : ""); if (!data.stale) setResultSuccess(new Date().toISOString()) } }
      catch { if (active) setResultError("Governor results refresh failed; retained data may be stale") }
      finally { resultBusy = false; if (active) { resultDue = Date.now() + 60000; setResultNext(resultDue) } }
    }
    const refreshDue = () => {
      if (!active || document.hidden) return
      if (Date.now() >= pollDue) void polling()
      if (Date.now() >= resultDue) void reported()
    }
    refreshDue()
    const timer = window.setInterval(refreshDue, 1000)
    document.addEventListener('visibilitychange', refreshDue)
    return () => { active = false; clearInterval(timer); document.removeEventListener('visibilitychange', refreshDue) }
  }, [])
  const value = (code: string) =>
    view === "results"
      ? voteMargin(results?.races[`${code}-REG`])
      : margin(
          polls.find((p) => p.state === code)?.dem_average,
          polls.find((p) => p.state === code)?.rep_average,
        )
  const entry = directory.find((r) => r.code === selected)
  const result = selected ? results?.races[`${selected}-REG`] : undefined
  const poll = polls.find((p) => p.state === selected)
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">November 3, 2026</p>
          <h1>Poll Cat · Governor Map</h1>
          <p>
            36 state elections and three territorial elections.{" "}
            {view === "results"
              ? "Reported vote margins"
              : "Polling average margins"}{" "}
            · no race calls.
          </p>
        </div>
      </div>
      <div className="national-explorer-layout"><div><section className="map-card">
        <h2>2026 Governors</h2><p className="map-intro">Track statewide races, live results, and poll closings.</p><RefreshStatus label="Governor polling" success={pollSuccess} next={pollNext} interval={900000} failed={Boolean(pollError)} /><RefreshStatus label="Governor results" success={resultSuccess} next={resultNext} interval={60000} failed={results?.stale || Boolean(resultError)} />
        <div className="map-view-tabs" role="group" aria-label="Governor map display">{([['polling','Polling'],['results','Live Results'],['closings','Poll Closings']] as const).map(([id,label]) => <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}</div>
        <PollClosings compact />
        <p role="status">
          {(pollError || resultError) && `${pollError || resultError} · `}{view === 'closings' ? 'Scheduled regional closings · 270toWin · Eastern Time · live clock' : view === 'results' ? `D minus R reported vote percentage points · Open America · ${results?.as_of ? new Date(results.as_of).toLocaleString() : 'Source timestamp unavailable'}${results?.stale ? ' · STALE' : ''}` : `D minus R polling average percentage points · PollingSource · ${polls.map(p => p.last_poll_date).filter(Boolean).sort().at(-1) ?? 'Publication date unavailable'}`}
        </p>

        <svg
          viewBox={usaMap.viewBox}
          className="usa-map"
          aria-label="Governor election map"
        >
          {view === "closings" && <ClosingDefs locations={locations} now={now} prefix="governor-closing" />}
          {(usaMap.locations as GovernorLocation[])
            .filter((l) => l.id !== "dc")
            .map((l) => {
              const code = l.id.toUpperCase(),
                race = directory.find((r) => r.code === code),
                label = `${l.name}: ${
                  race
                    ? marginLabel(value(code))
                    : "No governor election in 2026"
                }`
              return (
                <path
                  key={code}
                  clipPath={view === "closings" ? `url(#governor-closing-clip-${l.id})` : undefined}
                  d={l.path}
                  className={`map-state ${view === "closings" ? "closing-state" : ""} ${view === "results" ? "live-results-state" : ""} ${
                    race ? "configured" : "no-election"
                  } ${selected === code ? "selected" : ""}`}
                  style={{ fill: race ? marginColor(value(code)) : "#454951", ...closingStyle(l.name, now, view, "governor-closing") }}
                  onMouseEnter={() => setHovered(code)} onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(code)} onBlur={() => setHovered(null)}
                  tabIndex={0}
                  role="button"
                  aria-describedby={hovered === code ? "governor-map-tooltip" : undefined}
                  aria-label={view === "closings" ? `${l.name}: ${closingStatus(l.name, now)}` : label}
                  onClick={() => setSelected(code)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setSelected(code)
                    }
                  }}
                >
                  <title>
                    {label}
                    {race ? ` · ${race.candidates.join("; ")}` : ""}
                  </title>
                </path>
              )
            })}
        </svg>
        {view === "results" && <LiveElectionStatus office="Governor" feed={results} states={directory.filter(r => !["GU", "MP", "VI"].includes(r.code)).map(r => r.code)} />}
        {view === 'closings' ? <ClosingLegend now={now} /> : <MarginLegend />}
        {hovered && <div id="governor-map-tooltip" role="tooltip" className="governor-tooltip">
          <strong>{locations.find(l => l.id.toUpperCase() === hovered)?.name} · Governor</strong>
          {directory.find(r => r.code === hovered)?.candidates.slice(0,2).map(name => {
            const photo = governorPhoto(normalizedName(name))
            return <span className="tooltip-candidate" key={name}><span className="tooltip-photo"><span className="portrait-fallback">{normalizedName(name).split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}</span>{photo && <img src={photo.url} alt="" onError={e => { e.currentTarget.hidden = true }} />}</span>{name}</span>
          })}
          <p>{view === 'closings' ? 'Scheduled poll closings' : `${view === 'results' ? 'Reported vote lead' : 'Polling lead'}: ${directory.some(r => r.code === hovered) ? marginLabel(value(hovered)) : 'No governor election in 2026'}`}</p>
          {view === "results" && <p>{reportedVoteSummary(results?.races[`${hovered}-REG`])}</p>}
          <small>{view === 'closings' ? '270toWin · 2026 schedule · checked Nov. 3' : view === 'results' ? `Open America · ${results?.as_of ?? 'Source time unavailable'}` : `PollingSource · ${polls.find(p => p.state === hovered)?.last_poll_date ?? 'Source time unavailable'}`}</small>
          <p>{closingStatus(locations.find(l => l.id.toUpperCase() === hovered)?.name ?? '', now)}</p>
        </div>}
        <p>
          Territories:{" "}
          {directory
            .filter((r) => ["GU", "MP", "VI"].includes(r.code))
            .map((r) => (
              <button
                className="button secondary"
                key={r.code}
                onClick={() => setSelected(r.code)}
              >
                {r.state}
              </button>
            ))}
        </p>
        <div className="senate-state-explorer" aria-live="polite">
          {selected ? (
            <>
              <h2>{entry?.state ?? selected} · Governor</h2>
              {entry ? (
                <>
                  <p>
                    {marginLabel(value(entry.code))} ·{" "}
                    {view === "results"
                      ? "reported votes"
                      : "polling averages"}
                  </p>
                  <button
                    className="button secondary"
                    onClick={() =>
                      setSaved((s) =>
                        s.includes(entry.code)
                          ? s.filter((c) => c !== entry.code)
                          : [...s, entry.code],
                      )
                    }
                  >
                    {saved.includes(entry.code)
                      ? "Remove saved race"
                      : "Save governor race"}
                  </button>
                  <p>
                    <a
                      href="https://www.nga.org/governors/elections/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      NGA general-election directory
                    </a>{" "}
                    · checked November 3, 2026 ·{" "}
                    <a href={entry.source} target="_blank" rel="noreferrer">
                      Race details
                    </a>
                  </p>
                  <div className="senate-profile-grid">
                    {entry.candidates.map((name) => {
                      const identity = normalizedName(name)
                      const photo = governorPhoto(identity)
                      const votes = result?.cands.find(c => normalizedName(c.n) === identity)
                      const party = name.match(/\(([^)]+)\)$/)?.[1] ?? 'Not supplied'
                      return <article className="senate-candidate-profile" key={name}>
                        <div className="governor-photo-wrap"><span className="portrait-fallback">{identity.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}</span>{photo ? <img className="governor-portrait" src={photo.url} alt={identity} loading="lazy" onError={e => {e.currentTarget.hidden = true}}/> : null}</div>
                        <h3>{name.replace(/ \([^)]+\)$/, '')}</h3><p>{party === 'D' ? 'Democratic' : party === 'R' ? 'Republican' : party === 'I' ? 'Independent' : party}</p>
                        <p>{votes ? `${votes.v.toLocaleString()} reported votes · ${votes.pct ?? '—'}%` : 'Candidate vote percentage unavailable'}</p><p>{poll ? `PollingSource party average: ${party === 'D' ? poll.dem_average ?? '—' : party === 'R' ? poll.rep_average ?? '—' : '—'}% · candidate-specific measurement unavailable` : 'Candidate polling percentage unavailable'}</p>
                        <small>{photo ? <a href={photo.source} target="_blank" rel="noreferrer">{photo.credit}</a> : 'Verified portrait unavailable'}</small>
                      </article>
                    })}
                  </div>
                  {!entry.candidates.length && (
                    <p>
                      Verified candidate names unavailable in the directory.
                    </p>
                  )}
                  <p>
                    Polling:{" "}
                    {poll
                      ? `D ${poll.dem_average ?? "—"}% · R ${poll.rep_average ?? "—"}% · latest poll ${poll.last_poll_date ?? "not supplied"}`
                      : "No verified governor polling returned."}{" "}
                    {poll && (
                      <a href={poll.page} target="_blank" rel="noreferrer">
                        Polling source
                      </a>
                    )}
                  </p>
                  <p>
                    Reported results:{" "}
                    {result?.total
                      ? `${result.total.toLocaleString()} votes · ${result.pct_in ?? "unknown"}% precincts reporting`
                      : "Awaiting reported votes; missing counts are unavailable."}
                  </p>
                  {result?.cands.map((c) => (
                    <p key={`${c.n}-${c.p}`}>
                      {c.n} ({c.p}) · {c.v.toLocaleString()} votes ·{" "}
                      {c.pct ?? "—"}%
                    </p>
                  ))}
                </>
              ) : (
                <p>{locations.find(l => l.id.toUpperCase() === selected)?.name ?? selected}: No governor election in 2026.</p>
              )}
            </>
          ) : (
            <p>
              Select a state or territory for candidates, polling, and reported
              results.
            </p>
          )}
        </div>
      </section>
      </div><aside className="national-state-sidebar" aria-label="Governor national directory">
        <GuardianNews news={news} compact />
        <div className="national-state-sidebar-heading"><p className="eyebrow">National directory · Governor</p><h2>All 50 states</h2><p>State elections, polling and reported votes. Territories have a separate selector above.</p></div>
        <label className="directory-sort">Sort states<select value={sort} onChange={e => setSort(e.target.value)}><option value="alpha">Alphabetical: A–Z</option><option value="closing">Poll closing: Soonest first</option><option value="closest">Closest polling races</option><option value="featured">Featured: saved races first</option></select></label>
        <div className="national-state-rows">{[...locations].sort((a,b) => {
          const score = (l: GovernorLocation) => sort === 'closing' ? Math.min(...stateClosingHours(l.name).map(closingTime).filter(t => t > now)) : sort === 'closest' ? Math.abs(margin(polls.find(p => p.state === l.id.toUpperCase())?.dem_average,polls.find(p => p.state === l.id.toUpperCase())?.rep_average) ?? Infinity) : sort === 'featured' ? (saved.includes(l.id.toUpperCase()) ? 0 : 1) : 0
          const av = score(a), bv = score(b)
          return (av === bv ? 0 : av < bv ? -1 : 1) || a.name.localeCompare(b.name)
        }).map(l => {
          const code = l.id.toUpperCase(), race = directory.find(r => r.code === code)
          return <button type="button" className={`national-state-row ${saved.includes(code) ? "bookmarked" : ""}`} style={{borderLeftColor: race ? marginColor(view === "closings" ? null : value(code)) : "#454951"}} key={code} aria-pressed={selected === code} onClick={() => setSelected(code)}><StateSilhouette code={code} color={race ? marginColor(view === 'closings' ? null : value(code)) : '#454951'} /><div><strong>{l.name}{saved.includes(code) ? " · ★" : ""}</strong><small>{race ? view === 'closings' ? 'No verified margin · closing schedule' : marginLabel(value(code)) : 'No governor election in 2026'}</small><small>{closingStatus(l.name,now)}</small></div></button>
        })}</div>
      </aside></div>
    </>
  )
}
