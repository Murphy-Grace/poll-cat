import type { SenateResultRace } from './results'
import { useEffect, useState, type ReactNode } from 'react'
import type { SenateCandidate } from './senate'

export type MapView = 'polling' | 'results' | 'closings'
export function MapViewTabs({ office, view, onChange }: { office: string; view: MapView; onChange: (view: MapView) => void }) {
  return <div className="map-view-tabs" role="group" aria-label={`${office} map display`}>{([['polling', 'Polling'], ['results', 'Live Results'], ['closings', 'Poll Closings']] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={view === id} onClick={() => onChange(id)}>{label}</button>)}</div>
}
export function CandidatePortrait({ candidate }: { candidate: Pick<SenateCandidate, 'name' | 'photo'> }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [candidate.photo?.url])
  return candidate.photo && !failed ? <img className="candidate-portrait" src={candidate.photo.url} alt={`Portrait of ${candidate.name}`} loading="lazy" onError={() => setFailed(true)} /> : <span className="candidate-portrait candidate-neutral" role="img" aria-label={`Verified photograph unavailable for ${candidate.name}`}>{candidate.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('')}</span>
}
export function MapPreview({ id, children }: { id: string; children: ReactNode }) {
  return <div id={id} role="tooltip" className="map-preview">{children}</div>
}
export function ProviderNotice({ label, error }: { label: string; error?: string | null }) {
  return error ? <div className="provider-notice" role="status"><span>{label} unavailable · retained data may be stale.</span><details><summary>Provider error details</summary><p>{error}</p></details></div> : null
}

export function ResultsCard({ id, state, office, anchor, races, updatedAt, onClose }: {
  id: string; state: string; office: string; anchor: { x: number; y: number };
  races: { label: string; result?: SenateResultRace; candidates: { name: string; party?: string; photo?: SenateCandidate['photo'] }[] }[];
  updatedAt?: string | null; onClose: () => void;
}) {
  useEffect(() => {
    const dismiss = (event: PointerEvent) => { if (!(event.target as Element).closest?.('.results-hover-card, .map-state')) onClose() }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape) }
  }, [onClose])
  return <div id={id} role="region" aria-label={`${state} ${office} live results`} className="results-hover-card map-preview">
    <header><div><small>LIVE RESULTS · {office.toUpperCase()}</small><strong>{state}</strong></div><button type="button" aria-label="Close results card" onClick={onClose}>×</button></header>
    {races.length ? races.map(({ label, result, candidates }) => {
      const rows = result && result.total > 0 && result.cands.length ? [...result.cands].sort((a, b) => b.v - a.v).map(c => ({ name: c.n, party: c.p, votes: c.v, pct: c.pct, photo: candidates.find(p => p.name.toLowerCase() === c.n.toLowerCase())?.photo })) : candidates.map(c => ({ ...c, votes: null, pct: null }))
      return <section key={label}><div className="results-card-reporting"><b>{label}</b><span>{result?.pct_in != null ? `${result.pct_in}% reporting` : 'Reporting unavailable'}</span></div>
        {rows.map(c => <div className="results-card-candidate" key={c.name}><CandidatePortrait candidate={{ name: c.name, photo: c.photo ?? null }} /><div><strong>{c.name}</strong><small>{c.party || 'Party unavailable'}</small></div><div className="results-card-votes"><strong>{c.pct != null ? `${c.pct.toFixed(1)}%` : '—'}</strong><small>{c.votes != null ? `${c.votes.toLocaleString()} votes` : 'Awaiting results'}</small></div></div>)}
        <p>{result?.total ? `${result.total.toLocaleString()} reported votes · Lead is not a race call` : 'No reported vote totals available'}</p>
      </section>
    }) : <p>No {office === 'Senate' ? 'U.S. Senate' : 'governor'} election in 2026.</p>}
    <footer>Open America · {updatedAt ? `Updated ${new Date(updatedAt).toLocaleString()}` : 'Update time unavailable'}</footer>
  </div>
}
