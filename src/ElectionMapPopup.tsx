import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CandidatePortrait, type MapView } from './ElectionMapUI'
import type { SenateCandidate } from './senate'
import type { SenateResultRace } from './results'
import type { PollingRace } from './polling'
import { CLOSINGS, closingColor, closingStatus, closingTime, stateClosingHours } from './PollClosings'

export function useMapPopup() {
  const [code, setCode] = useState<string | null>(null)
  const [anchor, setAnchor] = useState({ x: 0, y: 0 })
  const [persistent, setPersistent] = useState(false)
  const pinned = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const cancel = () => clearTimeout(timer.current)
  const close = () => { cancel(); pinned.current = false; setPersistent(false); setCode(null) }
  const show = (next: string, element: SVGPathElement, pin = false) => {
    cancel()
    if (pinned.current && !pin) return
    const rect = element.getBoundingClientRect()
    setAnchor({ x: rect.right, y: rect.top + rect.height / 2 })
    pinned.current = pin; setPersistent(pin); setCode(next)
  }
  const leave = () => { cancel(); if (!pinned.current) timer.current = setTimeout(() => setCode(null), 250) }
  useEffect(() => () => clearTimeout(timer.current), [])
  return { code, anchor, persistent, close, cancel, leave, show }
}

type PopupRace = { label: string; candidates: { name: string; party?: string; photo?: SenateCandidate['photo'] }[]; result?: SenateResultRace; poll?: PollingRace }
export function ElectionMapPopup({ id, state, office, view, popup, races, now, updatedAt, stale, onDetails }: {
  id: string; state: string; office: string; view: MapView; popup: ReturnType<typeof useMapPopup>;
  races: PopupRace[]; now: number; updatedAt?: string | null; stale?: boolean; onDetails: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ left: 12, top: 12 })
  useLayoutEffect(() => {
    const place = () => {
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return
      const width = window.innerWidth, height = window.innerHeight
      const right = popup.anchor.x + 18
      const left = right + rect.width <= width - 12 ? right : popup.anchor.x - rect.width - 36
      setPosition({ left: Math.max(12, Math.min(left, width - rect.width - 12)), top: Math.max(12, Math.min(popup.anchor.y - rect.height / 2, height - rect.height - 12)) })
    }
    place()
    const observer = new ResizeObserver(place)
    if (ref.current) observer.observe(ref.current)
    const scroll = (event: Event) => { if (!(event.target instanceof Node) || !ref.current?.contains(event.target)) popup.close() }
    window.addEventListener('resize', place); window.addEventListener('scroll', scroll, true)
    return () => { observer.disconnect(); window.removeEventListener('resize', place); window.removeEventListener('scroll', scroll, true) }
  }, [popup.anchor.x, popup.anchor.y])
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') popup.close() }
    const outside = (e: PointerEvent) => { if (!(e.target as Element).closest('.election-map-popup, .map-state')) popup.close() }
    document.addEventListener('keydown', key); document.addEventListener('pointerdown', outside)
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('pointerdown', outside) }
  })
  const hours = stateClosingHours(state), next = hours.find(h => closingTime(h) > now)
  const seconds = next == null ? 0 : Math.ceil((closingTime(next) - now) / 1000)
  return createPortal(<div ref={ref} id={id} role="dialog" aria-modal="false" aria-label={`${state} ${office} ${view}`} className="results-hover-card election-map-popup" style={position} onPointerEnter={popup.cancel} onPointerLeave={popup.leave} onFocus={popup.cancel} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) popup.leave() }}>
    <header><div><small>{view === 'polling' ? 'POLLING AVERAGES' : view === 'results' ? 'LIVE RESULTS' : 'POLL CLOSINGS'} · {office.toUpperCase()}</small><strong>{state}</strong></div><button type="button" aria-label="Close map popup" onClick={popup.close}>×</button></header>
    {!races.length && <p>No {office} election in 2026.</p>}
    {view === 'closings' ? <section style={{ borderLeft: `4px solid ${closingColor(state, now)}`, paddingLeft: 12 }}><b>{closingStatus(state, now).replace('Polls open', 'Upcoming')}</b>{next != null && <p>Next closing in {Math.floor(seconds / 3600)}h {Math.floor(seconds % 3600 / 60)}m {seconds % 60}s</p>}{hours.map(h => <p key={h}><strong>{new Date(closingTime(h)).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' })} ET · {closingTime(h) <= now ? 'Passed' : 'Upcoming'}</strong>{CLOSINGS.find(([hour]) => hour === h)?.[1].split(', ').filter(area => area === state || area.startsWith(`${state} (`)).join(', ')}</p>)}<footer><a href="https://www.270towin.com/poll-closing-times/">270toWin · scheduled regional times</a><p>Schedules do not confirm voting has ended; extensions and voters in line may apply.</p></footer></section> : races.map(({ label, candidates, result, poll }) => {
      const reported = !!result && result.total > 0 && result.cands.length > 0
      const sorted = reported ? [...result.cands].sort((a,b) => b.v - a.v) : []
      const rows = view === 'results' && reported ? sorted.map(c => ({ name: c.n, party: c.p, photo: candidates.find(p => p.name.toLowerCase() === c.n.toLowerCase())?.photo, votes: c.v, pct: c.pct })) : candidates.map(c => ({ ...c, votes: null, pct: null }))
      const oldPoll = !!poll?.last_poll_date && now - Date.parse(poll.last_poll_date) > 30 * 86400000
      return <section key={label}><b>{label}</b>{view === 'results' && <p><strong>{reported ? sorted.length > 1 && sorted[0].v === sorted[1].v ? 'Tied' : 'Leading' : 'Awaiting results'}</strong>{reported && 'Reported lead is not a race call.'}</p>}
        {rows.map((c, i) => <div className="results-card-candidate" key={`${c.name}-${i}`}><CandidatePortrait candidate={{ name: c.name, photo: c.photo ?? null }} /><div><strong>{c.name}</strong><small>{c.party || 'Party unavailable'}</small></div>{view === 'results' && <div className="results-card-votes"><strong>{c.pct == null ? '—' : `${c.pct.toFixed(1)}%`}</strong><small>{c.votes == null ? 'Awaiting results' : `${c.votes.toLocaleString()} votes`}</small></div>}</div>)}
        {view === 'results' ? <><p>{reported ? `${result.total.toLocaleString()} total reported votes` : 'No reported results available.'}</p>{sorted.length > 1 && <p>Margin: {(sorted[0].v - sorted[1].v).toLocaleString()} votes{sorted[0].pct != null && sorted[1].pct != null ? ` · ${(sorted[0].pct - sorted[1].pct).toFixed(1)} percentage points` : ''}</p>}{result?.pct_in != null && <p>{result.pct_in}% reporting</p>}</> : <><p>{poll && (poll.dem_average != null || poll.rep_average != null) ? `Party polling averages: D ${poll.dem_average ?? '—'}% · R ${poll.rep_average ?? '—'}%${poll.ind_average != null ? ` · I ${poll.ind_average}%` : ''}` : 'Polling data unavailable.'}</p><p>Polling estimates, not election results.</p>{(stale || oldPoll) && <p><strong>Polling may be stale{oldPoll ? ' · latest poll over 30 days old' : ''}.</strong></p>}<footer>{poll?.page ? <a href={poll.page}>PollingSource</a> : 'PollingSource'} · Published {poll?.last_poll_date ?? 'date unavailable'}</footer></>}
      </section>
    })}
    {view === 'results' && <footer>Open America · Last successful update: {updatedAt ? new Date(updatedAt).toLocaleString() : 'unavailable'}{stale && ' · Data may be stale'}</footer>}
    <button type="button" className="popup-details" onClick={onDetails}>View expanded race details</button>
  </div>, document.body)
}
