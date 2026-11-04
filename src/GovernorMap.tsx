import { CandidatePortrait, ResultsCard, MapPreview, MapViewTabs, ProviderNotice } from './ElectionMapUI'
import { LiveElectionStatus } from './LiveElectionStatus'
import { GOVERNOR_PORTRAITS } from './governor-portraits'
import { RefreshStatus } from './RefreshStatus'
import { StateSilhouette } from './StateSilhouette'
import { GuardianNews, useGuardianNews } from './GuardianNews'
import { ClosingDefs, ClosingLegend, closingSecondary, PollClosings, closingStyle, CLOSINGS, closingColor, closingStatus, closingTime, stateClosingHours, useElectionClock } from './PollClosings'
import type { SenateCandidate } from './senate'
function governorPhoto(identity: string): SenateCandidate['photo'] { return GOVERNOR_PORTRAITS[identity] ?? null }
import { useEffect, useRef, useState } from "react"
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
  const [refreshKey, setRefreshKey] = useState(0)
  const [sort, setSort] = useState('alpha')
  const [hovered, setHovered] = useState<string | null>(null)
  const [anchor, setAnchor] = useState({ x: 0, y: 0 })
  const now = useElectionClock()
  const locations = (usaMap.locations as GovernorLocation[]).filter(l => l.id !== 'dc')
  const normalizedName = (name: string) => name.replace(/^Gov\. /, '').replace(/ \([^)]+\)$/, '').toLowerCase()

  const explorerRef = useRef<HTMLDivElement>(null)
  const openState = (code: string) => { setSelected(code); setHovered(null); requestAnimationFrame(() => explorerRef.current?.focus()) }
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
      catch (error) { if (active) setPollError(error instanceof Error ? error.message : "Unknown polling provider error") }
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
  }, [refreshKey])
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
<div className="map-card-heading"><div><p className="eyebrow">National Governor explorer · all 50 states</p><h2>2026 Governors</h2><p>Track polling, live results, and poll closings.</p></div></div><RefreshStatus label="Governor polling" success={pollSuccess} next={pollNext} interval={900000} failed={Boolean(pollError)} /><RefreshStatus label="Governor results" success={resultSuccess} next={resultNext} interval={60000} failed={results?.stale || Boolean(resultError)} />
        <button type="button" className="button secondary map-refresh" onClick={() => setRefreshKey(key => key + 1)}>Refresh polling</button>
        <MapViewTabs office="Governor" view={view} onChange={setView} />
        <ProviderNotice label="Governor polling" error={pollError} /><ProviderNotice label="Governor results" error={resultError} />
        <PollClosings compact />
        <p role="status">
          {view === 'closings' ? 'Scheduled regional closings · 270toWin · Eastern Time · live clock' : view === 'results' ? `D minus R reported vote percentage points · Open America · ${results?.as_of ? new Date(results.as_of).toLocaleString() : 'Source timestamp unavailable'}${results?.stale ? ' · STALE' : ''}` : `D minus R polling average percentage points · PollingSource · ${polls.map(p => p.last_poll_date).filter(Boolean).sort().at(-1) ?? 'Publication date unavailable'}`}
        </p>

        <div className="map-layout"><div className="geographic-map-wrap"><svg
          viewBox={usaMap.viewBox}
          className="geographic-map" role="group"
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
                  onPointerEnter={e => { if (e.pointerType !== "touch") { setAnchor({ x: e.clientX, y: e.clientY }); setHovered(code) } }} onPointerLeave={() => { if (view !== "results") setHovered(null) }}
                  onFocus={e => { const rect = e.currentTarget.getBoundingClientRect(); setAnchor({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }); setHovered(code) }} onBlur={e => { if (!(e.relatedTarget as Element | null)?.closest(".results-hover-card")) setHovered(null) }}
                  tabIndex={0}
                  aria-pressed={selected === code}
                  role="button"
                  aria-describedby={hovered === code ? "governor-map-tooltip" : undefined}
                  aria-label={view === "closings" ? `${l.name}: ${closingStatus(l.name, now)}` : label}
                  onClick={e => { if (view === "results") { const rect = e.currentTarget.getBoundingClientRect(); setAnchor({ x: e.clientX || rect.left, y: e.clientY || rect.top }); setHovered(code) } else openState(code) }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setHovered(null)
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      if (view === "results") setHovered(code); else openState(code)
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
        </svg></div>
        {view === "results" && <LiveElectionStatus office="Governor" success={resultSuccess} next={resultNext} error={resultError} feed={results} states={directory.filter(r => !["GU", "MP", "VI"].includes(r.code)).map(r => r.code)} />}
        <aside className="map-legend">{view === 'closings' ? <ClosingLegend now={now} /> : <MarginLegend />}</aside></div>
        {hovered && view === 'results' && <ResultsCard id="governor-map-tooltip" state={locations.find(l => l.id.toUpperCase() === hovered)?.name ?? hovered} office="Governor" anchor={anchor} updatedAt={results?.as_of} onClose={() => setHovered(null)} races={directory.filter(r => r.code === hovered).map(r => ({ label: 'Governor election', result: results?.races[`${hovered}-REG`], candidates: r.candidates.map(name => ({ name: name.replace(/^Gov\. /, '').replace(/ \([^)]+\)$/, ''), party: name.match(/\(([^)]+)\)$/)?.[1], photo: governorPhoto(normalizedName(name)) })) }))} />}
        {hovered && view !== 'results' && <MapPreview id="governor-map-tooltip">
          <strong>{locations.find(l => l.id.toUpperCase() === hovered)?.name} · Governor</strong>
          {directory.find(r => r.code === hovered)?.candidates.slice(0,2).map(name => {
            const photo = governorPhoto(normalizedName(name))
            return <span className="tooltip-candidate" key={name}><CandidatePortrait candidate={{ name: name.replace(/^Gov\. /, ""), photo }} />{name}</span>
          })}
          <p>{view === 'closings' ? 'Scheduled poll closings' : `${'Polling lead'}: ${directory.some(r => r.code === hovered) ? marginLabel(value(hovered)) : 'No governor election in 2026'}`}</p>
          <small>{view === 'closings' ? '270toWin · 2026 schedule · checked Nov. 3' : `PollingSource · ${polls.find(p => p.state === hovered)?.last_poll_date ?? 'Source time unavailable'}`}</small>
          <p>{closingStatus(locations.find(l => l.id.toUpperCase() === hovered)?.name ?? '', now)}</p>
          {view === 'closings' && closingSecondary(locations.find(l => l.id.toUpperCase() === hovered)?.name ?? '', now) && <small>Closing next</small>}
        </MapPreview>}
        <p>
          Territories:{" "}
          {directory
            .filter((r) => ["GU", "MP", "VI"].includes(r.code))
            .map((r) => (
              <button
                className="button secondary"
                key={r.code}
                onClick={() => openState(r.code)}
              >
                {r.state}
              </button>
            ))}
        </p>
        <div className="senate-state-explorer" aria-live="polite" ref={explorerRef} tabIndex={-1} role="region" aria-label="Governor candidate profiles">
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
                      NGA election schedule
                    </a>{" "}
                    · Directory snapshot ·{" "}
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
                        <CandidatePortrait candidate={{ name: identity, photo }} /><div>
                        <strong>{name.replace(/ \([^)]+\)$/, '')}</strong><small>{party === 'D' ? 'Democratic' : party === 'R' ? 'Republican' : party === 'I' ? 'Independent' : party}</small>
                        <small>{votes && result && result.total > 0 ? `${votes.v.toLocaleString()} reported votes · ${votes.pct ?? '—'}%` : 'Candidate vote percentage unavailable'}</small><small>{poll ? `PollingSource party average: ${party === 'D' ? poll.dem_average ?? '—' : party === 'R' ? poll.rep_average ?? '—' : '—'}% · candidate-specific measurement unavailable` : 'Candidate polling percentage unavailable'}</small>
                        <a className="portrait-credit" href={entry.source} target="_blank" rel="noreferrer">Candidate / ballot source</a>
                        <small>{photo ? <a href={photo.source} target="_blank" rel="noreferrer">{photo.credit}</a> : 'Verified portrait unavailable'}</small>
                        </div></article>
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
          return <button type="button" className={`national-state-row ${saved.includes(code) ? "bookmarked" : ""}`} style={{borderLeftColor: race ? marginColor(view === "closings" ? null : value(code)) : "#454951"}} key={code} aria-pressed={selected === code} onClick={() => openState(code)}><StateSilhouette code={code} color={race ? marginColor(view === 'closings' ? null : value(code)) : '#454951'} /><div><strong>{l.name}{saved.includes(code) ? " · ★" : ""}</strong><small>{race ? view === 'closings' ? 'No verified margin · closing schedule' : marginLabel(value(code)) : 'No governor election in 2026'}</small><small>{closingStatus(l.name,now)}</small></div></button>
        })}</div>
      </aside></div>
    </>
  )
}
