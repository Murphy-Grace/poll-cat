# Election UX refinements — November 3, 2026

Backups of modified originals: `backups/refinements-20261103/`. Existing layout, watchlists, forecasts, polling, news, state selection and sorting retained.

## Changes

- Office composition already switches between Senate (45 D, 2 I, 53 R; independents caucus with Democrats) and the separate Governor baseline (24 D, 26 R). State and territory coverage stays separate. No connected authoritative calls can change held-office membership.
- Verified the existing regional 2026 closing schedule against https://www.270towin.com/poll-closing-times/. Added regression tests for partial Florida closure, Alaska regional waves, EST-to-UTC conversion, next-wave orange, fully-closed yellow, neutral closed fill, and no polling outlines.
- Governor tooltip now orders office, candidate imagery/names/parties, explicitly labeled metric, source/date, then closure status. Closings tooltips attribute the schedule instead of polling.
- Larger 48px silhouettes; closing-directory fills are neutral instead of presenting closing-wave colors as party margins. Governor accents match those fills. Bookmarks and sorting remain.
- Added identity-specific public-domain official portraits for Doug Jones and Tommy Tuberville, sourced from the Commons file descriptions linked in `src/governor-portraits.ts`. Governor tooltips now support photos and initials on image failure.
- Refresh indicators identify each feed; failures retain the last successful Senate results timestamp. Senate timers expose the actual scheduled attempt, including error backoff. Guardian's 15-minute request cadence now checks due time every second, preventing a completed request from accidentally deferring the next request to the following 15-minute tick. Governor polling/results errors are independent and clear on recovery. Inactive request guards remain.

## Verification

- `npx tsc --noEmit`: passed.
- `npm run build`: passed. Existing Vite config compatibility and >500KB chunk warnings remain.
- `npm test --if-present`: 24 passed, 0 failed.
- Chrome checked Senate/Governor switching, 50 map and directory states, all three tabs, four sorting options, selected state, keyboard tooltip, bookmarks visible, refresh indicators, and desktop/390px mobile. No uncaught exceptions. Mobile document width 390px.
- Governor polling has zero closing outlines; live results highlight seven states in the next wave at the test clock; closing mode outlines all 50. Boundary transitions are covered by unit tests rather than waiting for election-night time.
- An existing Katie Hobbs NGA image did not load during the browser check. Initials remain. Newly added Commons portraits have verified identity/license metadata; successful loading on every client is not guaranteed. Full 15-minute refresh cycles and all provider outage cases were not browser-tested.

## Missing data and readiness

The full missing Senate portrait inventory remains in `ELECTION-UX-VERIFICATION.md`: 138 of 153 Senate candidate records have no image reference. Most Governor portraits remain missing; this pass adds Jones/Tuberville to the existing Hobbs/Sanders entries. No synthetic or guessed portraits were added. Existing NGA photo authorization and all pre-existing Senate photo references have not been exhaustively revalidated.

No authoritative call feed, live court-extension feed, or verified territorial party totals are connected. A Governor directory entry still contains a primary-runoff placeholder; South Carolina has no candidate names. Missing reported vote coverage remains neutral and cannot imply closure or a winner. The Guardian endpoint requires its existing server deployment/key. Production build is valid, but complete verified election-night coverage and portrait completeness are not production-ready claims.
