import type { SenateResultsFeed } from './results'

export function LiveElectionStatus({ office, feed, states }: {
  office: 'Senate' | 'Governor'
  feed: SenateResultsFeed | null
  states: readonly string[]
}) {
  const eligible = new Set(states)
  const races = Object.entries(feed?.races ?? {}).filter(([key]) => eligible.has(key.split('-')[0]))
  const reporting = new Set(races.filter(([, race]) => race.total > 0).map(([key]) => key.split('-')[0])).size
  const votes = races.reduce((total, [, race]) => total + race.total, 0)

  return <section className="live-election-status" aria-label={`${office} live election map status`}>
    <div className="live-election-status-header">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" /><path d="M8.5 8.5a5 5 0 0 0 0 7m7-7a5 5 0 0 1 0 7M5.5 5.5a9.2 9.2 0 0 0 0 13m13-13a9.2 9.2 0 0 1 0 13" strokeLinecap="round" /></svg>Live Election Map</h3>
      <span className="live-election-auto"><span aria-hidden="true" />Auto-refresh</span>
    </div>
    <dl className="live-election-stats">
      <div><dt>States reporting {office === 'Senate' ? 'Senate' : 'Governor'} results</dt><dd>{feed ? reporting.toLocaleString() : '—'}</dd></div>
      <div><dt>Total reported votes · {office}</dt><dd>{feed ? votes.toLocaleString() : '—'}</dd></div>
    </dl>
    <div className="live-election-explanation">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><circle cx="10" cy="10" r="7.5" /><path d="M10 9v5m0-8v1" /></svg>
      <div><h4>Why are some states gray?</h4><p>Gray states have no {office === 'Senate' ? 'Senate' : 'Governor'} election this year. Slate states are awaiting verified results or lack a supported D/R margin. Colors show reported vote leads, not race calls.{feed?.stale ? ' Retained results may be stale.' : ''}</p></div>
    </div>
  </section>
}
