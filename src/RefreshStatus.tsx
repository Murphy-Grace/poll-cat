import { useEffect, useState } from 'react'
export function RefreshStatus({ success, next, interval, failed = false, label = "Data" }: { label?: string; success: string | null; next?: number; interval: number; failed?: boolean }) {
  const [now, setNow] = useState(Date.now())
  const [hidden, setHidden] = useState(document.hidden)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    const visible = () => { setHidden(document.hidden); setNow(Date.now()) }
    document.addEventListener('visibilitychange', visible)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visible) }
  }, [])
  const at = success ? Date.parse(success) : NaN
  const age = now - at
  const remaining = Math.max(0, Math.ceil(((next ?? at + interval) - now) / 1000))
  return <p className="refresh-status">{label} · {success ? <>Last successful refresh: <time dateTime={success}>{new Date(success).toLocaleString()}</time> · Updated {Math.max(0, Math.floor(age / 60000))} min ago{(failed || age > interval * 2) && ' · STALE'}</> : failed ? 'No successful refresh yet · Refresh failed' : 'No successful refresh yet'}{failed && success && ' · Latest refresh failed'} · {hidden ? 'Automatic refresh paused while inactive' : Number.isFinite(remaining) ? remaining === 0 ? "Refresh due / awaiting provider" : `Next attempt in ${Math.floor(remaining / 60)}m ${remaining % 60}s` : 'Awaiting refresh schedule'}</p>
}
