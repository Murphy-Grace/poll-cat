import { RefreshStatus } from './RefreshStatus'
import { useEffect, useState } from 'react'

type Feed = {
  articles: { id: string; title: string; image?: string | null; url: string; publishedAt: string; source: { name: string } }[]
  updatedAt: string
  stale: boolean
}

export function useGuardianNews() {
  const [success, setSuccess] = useState<string | null>(null)
  const [next, setNext] = useState(Date.now() + 900000)
  const [feed, setFeed] = useState<Feed | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    let busy = false
    let due = 0
    async function refresh() {
      if (busy || document.hidden) return
      busy = true
      setLoading(true)
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}api/news`, { signal: controller.signal })
        if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('The news server endpoint is unavailable.')
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Guardian news could not be loaded.')
        if (!Array.isArray(data.articles) || !Number.isFinite(Date.parse(data.updatedAt))) throw new Error('The news server returned an invalid feed.')
        if (!controller.signal.aborted) { setFeed(data); setError(null); if (!data.stale) setSuccess(new Date().toISOString()) }
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Guardian news could not be loaded.')
      } finally {
        busy = false
        due = Date.now() + 900000
        setNext(due)
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void refresh()
    const timer = window.setInterval(() => { if (!document.hidden && Date.now() >= due) void refresh() }, 1000)
    const onVisible = () => { if (!document.hidden && Date.now() >= due) void refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      controller.abort()
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refreshKey])
  return { feed, error, loading, success, next, refresh: () => setRefreshKey(key => key + 1) }
}

export function GuardianNews({ news, compact = false }: { news: ReturnType<typeof useGuardianNews>; compact?: boolean }) {
  const { feed, error, loading, refresh } = news
  const stale = feed?.stale || Boolean(error)
  const formatTime = (value: string) => new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  return (
    <section className={compact ? 'briefing-card' : 'news-import-section'} aria-label="Guardian election news">
      <div className="briefing-heading">
        <p className="eyebrow">The Guardian · US election news</p>
        <span className="source-state"><span aria-hidden="true" />{loading ? 'Refreshing…' : feed ? stale ? 'Last available headlines' : 'Auto-refresh · 15 min' : 'Unavailable'}</span>
      </div>
      <RefreshStatus label="Guardian news" success={news.success} next={news.next} interval={900000} failed={stale} />
      <h2>{compact ? 'Election briefing' : 'Election headlines'}</h2>
      <div aria-live="polite">
        {error && <p role="status">{error} {feed && 'Showing the last successful update.'}</p>}
        {feed && <p>Updated {formatTime(feed.updatedAt)}.{stale && ' The latest refresh is unavailable.'}</p>}
        {!feed && loading && <p>Loading election headlines…</p>}
        {feed && feed.articles.length === 0 && <p>No matching election headlines are available.</p>}
      </div>
      <div className={compact ? 'briefing-stories' : 'imported-news-list'}>
        {feed?.articles.slice(0, 12).map(story => (
          <article key={story.id} className={compact ? undefined : 'imported-news-row'}>
            {story.image && <img className="guardian-thumbnail" src={story.image} alt="" loading="lazy" onError={e => { e.currentTarget.hidden = true }} />}
            <div>
              <p className="eyebrow">The Guardian · {formatTime(story.publishedAt)}</p>
              <a href={story.url} target="_blank" rel="noopener noreferrer">{story.title}</a>
            </div>
          </article>
        ))}
      </div>
      <div className="briefing-reference">
        <a href="https://www.theguardian.com/us-news/us-elections-2026" target="_blank" rel="noopener noreferrer">News from The Guardian</a>
        <button className="button ghost" type="button" disabled={loading} onClick={refresh}>{loading ? 'Refreshing…' : 'Refresh news'}</button>
      </div>
    </section>
  )
}
