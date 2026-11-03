import { useEffect, useState } from 'react'
import { fetchCivicRaces, fetchCivicResult, type CivicOffice, type CivicRace, type CivicResult } from './civic'

export function CivicResults() {
  const [office, setOffice] = useState<CivicOffice>('Senate')
  const [enabled, setEnabled] = useState(false)
  const [races, setRaces] = useState<CivicRace[]>([])
  const [selected, setSelected] = useState('')
  const [snapshot, setSnapshot] = useState<{id: number; result: CivicResult; fetched: string} | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let active = true
    setLoading(true); setError('')
    void fetchCivicRaces(office).then(rows => { if (active) setRaces(rows) }).catch(e => { if(active) setError(String(e.message)) }).finally(() => { if(active) setLoading(false) })
    return () => { active = false }
  }, [office, enabled, refresh])
  const race = races.find(r => String(r.id) === selected)
  useEffect(() => {
    if (!race) return
    let active = true
    setLoading(true); setError('')
    void fetchCivicResult(race).then(result => { if(active) setSnapshot({id:race.id,result,fetched:new Date().toLocaleString()}) }).catch(e => { if(active) setError(String(e.message)) }).finally(() => { if(active) setLoading(false) })
    return () => { active = false }
  }, [race, refresh])
  const result = race && snapshot?.id === race.id ? snapshot.result : null
  return <section className="map-card" aria-label="civicAPI supplemental election results">
    <p className="eyebrow">Supplemental election results · November 3, 2026</p>
    <h2><a href="https://civicapi.org" target="_blank" rel="noreferrer">civicAPI</a> · Senate, House &amp; Governor</h2>
    <p>civicAPI results are awaiting verification. The November 3, 2026 searches returned unrelated races or provider database timeouts; no live vote counts have been confirmed for these races. Existing Open America results remain available.</p>
    {!enabled ? <button className="button secondary" disabled title="Live results must be verified and matched before enabling this provider" onClick={() => setEnabled(true)}>civicAPI results awaiting verification</button> : <>
      <div className="settings-actions">
        <label>Office <select aria-label="civicAPI office" value={office} onChange={e => { setOffice(e.target.value as CivicOffice); setRaces([]); setSelected(''); setSnapshot(null) }}>{(['Senate','House','Governor'] as const).map(o => <option key={o}>{o}</option>)}</select></label>
        <label>Race <select aria-label="civicAPI race" value={selected} onChange={e => {setSelected(e.target.value);setSnapshot(null)}}><option value="">Select a race ({races.length} available)</option>{races.map(r => <option key={r.key} value={r.id}>{r.name}</option>)}</select></label>
        <button className="button secondary" disabled={loading} onClick={() => setRefresh(n => n + 1)}>Refresh civicAPI</button>
      </div>
      <p role="status">{loading ? 'Loading civicAPI…' : error ? `Refresh failed: ${error} Last successful response, if shown, may be stale.` : `${races.length} distinct races returned for this office; listings do not guarantee votes are reporting.`}</p>
      {race && result && <div className="live-race-results"><h3>{race.name}</h3>
        <p>civicAPI source updated: {result.updated ? new Date(result.updated).toLocaleString() : 'Unavailable'} · Retrieved: {snapshot?.fetched}</p>
        <p>{result.reporting === null ? 'Reporting percentage unavailable' : `${result.reporting}% reporting (provider measure)`}{result.disputed ? ' · Provider flags this race as disputed' : ''}</p>
        {!result.candidates.length && <p>No candidate results supplied.</p>}
        {result.candidates.length > 0 && result.candidates.every(c => c.votes === 0) && <p>Provider reports zero votes so far; this is not a completed result.</p>}
        {result.candidates.map((c,i) => <div className="live-candidate-result" key={`${c.name}-${i}`}><span>{c.name} ({c.party})</span><strong>{c.votes === null ? 'Votes unavailable' : `${c.votes.toLocaleString()} votes`} · {c.percent === null ? 'Percentage unavailable' : `${c.percent}%`} · {c.winner === true ? 'civicAPI calls winner' : c.winner === false ? 'No winner call reported for candidate' : 'Call status unavailable'}</strong></div>)}
        <a href={`https://civicapi.org/results/elections/${race.id}`} target="_blank" rel="noreferrer">View this race on civicAPI</a>
      </div>}
      <p className="source-meta">Requests are cached for 60 seconds; no automatic refresh. Full race responses supply candidate rows. National seat aggregates, primaries, runoffs, and ambiguous duplicate seats are excluded. Missing data stays unavailable.</p>
    </>}
  </section>
}
