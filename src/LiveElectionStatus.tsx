import { useEffect, useRef, useState } from 'react'
import usaMap from '@svg-maps/usa'
import { stateClosingHours, closingTime, useElectionClock } from './PollClosings'
import { RefreshStatus } from './RefreshStatus'
import { resultsSignature, electionStatus } from './election-status'
import type { SenateResultsFeed } from './results'

export function LiveElectionStatus({ office, feed, states, success, next, error }: {
  office: 'Senate' | 'Governor'
  feed: SenateResultsFeed | null
  states: readonly string[]
  success: string | null
  next: number
  error?: string | null
}) {
  const eligible = new Set(states)
  const races = Object.entries(feed?.races ?? {}).filter(([key]) => eligible.has(key.split('-')[0]))
  const reporting = new Set(races.filter(([, race]) => race.total > 0).map(([key]) => key.split('-')[0])).size
  const votes = races.reduce((total, [, race]) => total + race.total, 0)

  const now = useElectionClock()
  const schedule = states.map(code => {
    const name = usaMap.locations.find((location: { id: string; name: string }) => location.id.toUpperCase() === code)?.name
    return name ? stateClosingHours(name).map(closingTime) : []
  })
  const closed = schedule.length > 0 && schedule.every(times => times.length > 0 && now >= Math.max(...times))
  const beforeFirstClosing = schedule.flat().length > 0 && now < Math.min(...schedule.flat())
  const signature = resultsSignature(feed, states)
  const previous = useRef<string | null>(null)
  const [receivedAt, setReceivedAt] = useState(0)
  useEffect(() => {
    if (!success || feed?.stale || error) return
    if (previous.current !== null && previous.current !== signature) setReceivedAt(Date.now())
    previous.current = signature
  }, [success, signature, feed?.stale, error])
  const state = electionStatus({ failed: Boolean(error || feed?.stale), closed, initial: !success,
    votes, beforeFirstClosing, fresh: receivedAt > 0 && now - receivedAt < 10000 })
  const messages = {
    error: 'Results refresh unavailable. Retained results may be stale.',
    closed: 'All scheduled polls closed',
    new: 'New results received.',
    loading: 'Checking for initial results.',
    open: 'Polls are still open. Check back after closing.',
    first: 'Awaiting first reported results.',
    waiting: 'No new results yet. Checking again soon.',
  }

  return <section className="live-election-status" aria-label={`${office} live election map status`}>
    <div className="live-election-status-header">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" /><path d="M8.5 8.5a5 5 0 0 0 0 7m7-7a5 5 0 0 1 0 7M5.5 5.5a9.2 9.2 0 0 0 0 13m13-13a9.2 9.2 0 0 1 0 13" strokeLinecap="round" /></svg>Live Election Map</h3>
      <span className="live-election-auto"><span aria-hidden="true" />Auto-refresh</span>
    </div>
    <div className="election-art-status" data-state={state}>
      {state !== 'error' && state !== 'new' && <img src={state === 'closed' ? '/branding/all%20poles%20closed.svg' : '/branding/COMEBACKSOON.svg'} alt={state === 'closed' ? 'Poll Cat beside an all polls closed sign' : 'Poll Cat waiting for election updates'} width="549" height="593" />}
      <div><p role="status" aria-live="polite"><strong>{messages[state]}</strong></p>
        {state === 'closed' && <p>Results may still be arriving. Poll Cat will continue checking for updates.</p>}
        {state === 'closed' && <small>Scheduled times for this office; local extensions and voters in line may still apply.</small>}
        {state === 'error' && <p>{error || 'The provider returned stale data.'}</p>}
        {next > 0 && <small>Scheduled next check: <time dateTime={new Date(next).toISOString()}>{new Date(next).toLocaleString()}</time></small>}
        <RefreshStatus label={`${office} results`} success={success} next={next} interval={60000} failed={state === 'error'} />
      </div>
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
