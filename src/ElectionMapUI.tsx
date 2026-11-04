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
