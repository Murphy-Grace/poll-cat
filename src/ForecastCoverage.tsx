import { useEffect, useState } from "react"
import { fetchForecastRaces, type ForecastDataset, type ForecastOffice } from "./polling"

const offices = ["senate", "house", "governors"] as const
const labels = { senate: "Senate", house: "House", governors: "Governors" }
const points = (value: number | null, party: string) => value === null ? "Unavailable" : `${value > 0 ? party : value < 0 ? "R" : "Tie"}${value === 0 ? "" : ` +${Math.abs(value).toFixed(1)}`} pp`

export function ForecastCoverage() {
  const [office, setOffice] = useState<ForecastOffice>("senate")
  const [datasets, setDatasets] = useState<Partial<Record<ForecastOffice, ForecastDataset>>>({})
  const [errors, setErrors] = useState<Partial<Record<ForecastOffice, string>>>({})
  const [loading, setLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    void Promise.allSettled(offices.map(async key => {
      try {
        const data = await fetchForecastRaces(key)
        if (active) { setDatasets(current => ({ ...current, [key]: data })); setErrors(current => ({ ...current, [key]: undefined })) }
      } catch (error) {
        if (active) setErrors(current => ({ ...current, [key]: error instanceof Error ? error.message : "Provider unavailable" }))
      }
    })).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [refresh])
  const data = datasets[office]
  return <section className="map-card" aria-label="Polling Forecast coverage">
    <h2>Polling Forecast · Senate, House &amp; Governors</h2>
    <p>Polling averages and modeled forecasts are separate measures. Margins are percentage points: Democrat (or the listed independent opponent) minus Republican. Missing polling averages remain unavailable.</p>
    <div className="settings-actions">
      <label>Office <select value={office} onChange={event => setOffice(event.target.value as ForecastOffice)}>{offices.map(key => <option key={key} value={key}>{labels[key]}</option>)}</select></label>
      <button className="button secondary" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Refresh forecasts</button>
    </div>
    <p role="status">{loading ? "Loading forecasts…" : errors[office] ? `${errors[office]} Previous data, if shown, may be stale.` : data ? `${data.rows.length} races · Source updated ${data.asOf}` : "No verified forecast available."}</p>
    {data && <>
      <div className="survey-table-wrap" style={{ maxHeight: 420, overflow: "auto" }}><table className="survey-table"><thead><tr><th>Race</th><th>Polling average margin</th><th>Forecast margin</th><th>Model rating</th></tr></thead><tbody>{data.rows.map(row => <tr key={row.key}><td><a href={`https://www.pollingforecast.com${row.page}`} target="_blank" rel="noreferrer">{row.name}</a><small>{row.key} · {row.left_party} vs R</small></td><td>{points(row.poll_average, row.left_party)}</td><td>{points(row.best_bet_margin, row.left_party)}</td><td>{row.rating}</td></tr>)}</tbody></table></div>
      <p className="source-meta">{data.attribution} · {data.licence} · <a href="https://www.pollingforecast.com/us/data" target="_blank" rel="noreferrer">Data documentation</a></p>
    </>}
  </section>
}
