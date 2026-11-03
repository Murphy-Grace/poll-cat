// Official current membership, checked 2026-11-03. Election leaders are never inputs.
export const SENATE_BASELINE = Object.freeze({ D: 45, I: 2, R: 53 })
export const COMPOSITION_SOURCE = 'https://www.senate.gov/senators/'
export const COMPOSITION_CHECKED = '2026-11-03'
// No connected provider supplies verified race calls. Intentionally ignore vote
// snapshots (including 100% reporting) and preserve the official membership.
export function senateComposition(_reportedVotes?: unknown) {
  return { ...SENATE_BASELINE }
}

// Separate held-office baseline; territorial offices are never included.
export const GOVERNOR_BASELINE = Object.freeze({ D: 24, I: 0, R: 26 })
export const GOVERNOR_COMPOSITION_SOURCE = 'https://www.multistate.us/resources/2026-governors'
export function governorComposition(_reportedVotes?: unknown) {
  return { ...GOVERNOR_BASELINE }
}
