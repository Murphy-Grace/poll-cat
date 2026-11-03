> November 3 launch follow-up: see [PRODUCTION-LAUNCH.md](./PRODUCTION-LAUNCH.md) for the current redesign, Vercel adaptation, 24 passing tests, browser checks, file inventory and remaining publication requirements. The audit below describes the earlier upgrade.

# Poll Cat upgrade and data audit — November 3, 2026

Backups: `backups/poll-cat-upgrade/`. Existing watchlist storage, forecasts, news, settings and detail navigation retained.

Changed App.tsx, index.css, PollClosings.tsx, senate.ts, results.ts. Added map controls, synchronized state selection, four directory sorts, closing-wave colors/countdowns, initials portrait fallback and explicit missing-results labels. Closest uses absolute D/R average difference; editorial inclusion uses the pre-existing DEFAULT_STATES list, not a computed importance ranking. Candidate-specific polling cannot be verified from party-only averages, which are labeled accordingly. Missing photos are never guessed.

## Results audit

Connected: official state counts via Open America. https://openamerica.io/elections/api/
Documented states: AR AZ CO CT FL GA IA ID IN LA MI MN NC PA RI SC TX UT VA VT WA WV. Offices: House, Senate, Governor. Coverage varies by office and published seats. Senate regular and special keys are normalized separately. Exact normalized candidate-name matching avoids attaching another candidate's counts; unmatched provider candidates remain in the results detail.

Current fetched 2026 Senate snapshot: zero races, counting=false, live=false, as_of=null. Consequently **all 35 Senate races currently lack verified reported vote coverage in this snapshot**. A documented state adapter is not proof of available Senate counts.

Senate states outside documented state adapters: AL AK DE HI KS KY ME MA MS MT NE NV NH NJ NM NY ND OK OR SD TN WY. Other supported states may still have missing seats. No race calls are supplied. The existing API needs no key and permits credential-free browser CORS access. Refresh now uses 60 seconds when races exist, 10 minutes when empty/final, and exponential failure backoff capped at 10 minutes. Provider stale status is retained. Browser HTTP caching handles normal cache revalidation; no manual cross-origin ETag header is added.

Polling remains the existing PollingSource integration, with provider publication dates and links. Party averages are not ballot-candidate measurements or votes. Forecasts remain separate. Existing regional closing schedule retained; split states appear at each relevant wave, with scheduled rather than confirmed closure labels. Source: https://www.270towin.com/poll-closing-times/

Texas printed-ballot names verified against https://www.sos.state.tx.us/elections/forms/2026-ballot-cert.pdf — Ken Paxton, James Talarico, Ted Brown. Existing write-in directory records retain their separate Ballotpedia source. Portraits retain existing source credits or neutral initials.

## Supplemental providers and deployment

civicAPI: https://civicapi.org/faq documents free commercial/noncommercial use with attribution and 5–10 second updates. Its general coverage claim does not verify a specific 2026 Senate dataset or reliability. Not connected pending verified election identifiers, full race coverage, response schema and operating limits.

AP: https://developer.ap.org/ap-elections-api/docs/Getting_Started.htm requires an API key and says available election data can change daily. No entitlement, license or 2026 payload was available for validation. Not connected; do not assume free access. Future authenticated providers must run server-side and keep race source/timestamps separate rather than sum snapshots.

Production: results are public browser requests, with no new secrets. Existing Guardian endpoint requires a Node deployment and server-side GUARDIAN_API_KEY; static dist hosting alone does not provide it (see server/README.md). No public deployment performed or production-host smoke test completed.

## Checks

`npx tsc --noEmit` passed. `npm run build` passed, with existing Vite config warnings and a >500 KB chunk warning. `npm test --if-present` exits successfully; no default test script exists. `npm run test:news`: 4 passed.

Browser automation confirmed loaded PNG with transparent CSS background, 50 map paths, three map controls, four sorting modes retaining 50 states, Texas selection synchronized to the directory, candidate profiles and no uncaught exceptions. Current empty results cannot validate live incoming counts. Physical touch and every remote portrait have not been exhaustively verified.

Final browser recheck: keyboard focus-event tooltip displayed Ohio's office, directory candidates and closing countdown. Responsive candidate grid corrected; at 390px emulation, viewport and document width both measured 390px. Remote survey tables retain their existing scroll containers. No uncaught browser exceptions. Closing-wave rollover uses the retained schedule and live clock; no real election-night rollover was observed during this check.
