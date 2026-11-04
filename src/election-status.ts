import type { SenateResultsFeed } from './results'

// Ignore provider timestamps, object ordering, and other transport metadata.
export function resultsSignature(feed: SenateResultsFeed | null, states: readonly string[]) {
  return JSON.stringify(Object.entries(feed?.races ?? {})
    .filter(([key]) => states.includes(key.split('-')[0]))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, race]) => [key, race.total, race.pct_in,
      race.cands.map(c => [c.n, c.p, c.v, c.pct]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))) ]))
}

export function electionStatus({ failed, closed, initial, votes, beforeFirstClosing, fresh }: {
  failed: boolean; closed: boolean; initial: boolean; votes: number; beforeFirstClosing: boolean; fresh: boolean
}) {
  if (failed) return 'error'
  if (closed) return 'closed'
  if (fresh) return 'new'
  if (initial) return 'loading'
  if (!votes && beforeFirstClosing) return 'open'
  if (!votes) return 'first'
  return 'waiting'
}
