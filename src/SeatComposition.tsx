import { senateComposition, governorComposition, COMPOSITION_SOURCE, COMPOSITION_CHECKED } from './composition'
export function SeatComposition({ office = "Senate" }: { office?: "Senate" | "Governor" }) {
  const governor = office === "Governor"
  const seats = governor ? governorComposition() : senateComposition()
  return <section className="seat-composition" aria-label={`Current U.S. ${office} composition`}>
    <div className="seat-labels"><strong>{governor ? "U.S. Governors · 50 states" : "U.S. Senate · 100 seats"}</strong><span><b className="dem">{seats.D} Democratic</b> · <b style={{color:'var(--party-independent)'}}>{seats.I} Independent</b> · <b className="rep">{seats.R} Republican</b></span></div>
    <div className="seat-track" style={{gridTemplateColumns:`repeat(${seats.D + seats.I + seats.R}, minmax(0, 1fr))`}} role="img" aria-label={`${seats.D} Democratic, ${seats.I} Independent, ${seats.R} Republican`}>{(['D','I','R'] as const).flatMap(p => Array.from({length:seats[p]}, (_, i) => <i key={`${p}${i}`} style={{background:p === 'D' ? 'var(--party-dem)' : p === 'R' ? 'var(--party-rep)' : 'var(--party-independent)'}} />))}</div>
    <p>{governor ? <>Sitting governors: 24 Democratic · 26 Republican. Territories excluded from the 50-state total. <a href="https://www.nga.org/governors/">NGA directory</a> · <a href="https://www.multistate.us/resources/2026-governors">Party baseline</a> · checked 2026-11-03. Territorial offices are listed separately in the Governor map; no territorial party total is asserted.</> : <>Caucuses: Democratic 47 (includes 2 Independents) · Republican 53. <a href={COMPOSITION_SOURCE} target="_blank" rel="noreferrer">U.S. Senate membership</a> · checked <time>{COMPOSITION_CHECKED}</time> (source supplies no update time).</>} Held offices only; newly called results: unavailable. No verified race-call provider connected; composition stays unchanged. Vote leaders never change seats.</p>
  </section>
}
