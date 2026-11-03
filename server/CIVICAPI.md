# civicAPI supplemental results

Documentation: https://civicapi.org/api-documentation

Verified November 3, 2026 with unauthenticated production v2 endpoints (never `testdata`). Full-day US search returned 38,697 records. Exact office filtering and exclusion of national chamber aggregates yielded 35 Senate seats (Florida and Ohio special seats), 435 House districts, and 39 governor races (36 states and GU/MP/VI). Inventory is not a guarantee that votes have been reported. New Hampshire and Guam records already contained positive votes.

The homepage's civicAPI viewer loads a bounded search by office on demand, then fetches `/race/{id}` only for the selected seat. Search candidate lists may be truncated and are never rendered as full results. Full responses supply candidate votes, percentages, `winner`, `last_updated`, and `percent_reporting`. Reporting percentage is not relabeled as precinct percentage. Missing fields remain unavailable; false winner flags are not interpreted as losses. Calls remain publisher calls, not certification.

Open America remains the map and existing detail source. civicAPI results are an independently attributed supplemental panel covering all three offices. No candidates, totals, timestamps, or calls are merged across providers. Identity includes date, office, state, district, and special status. Identical IDs deduplicate; conflicting IDs for the same seat are excluded. National seat totals, primaries, runoffs, and synthetic test responses are excluded.

Uses browser HTTPS fetch with omitted credentials, supported by observed `Access-Control-Allow-Origin: *`. No API keys, development proxy, or added production server routes are required. In-memory 60-second caching and shared in-flight requests limit traffic; no automatic refresh. HTTP 429 pauses requests globally for at least 60 seconds and honors Retry-After when accessible. Errors retain the selected race's previous response with a stale warning. Successful payloads always show the provider timestamp separately from retrieval time.

Live responses observed HTTP 200 and cache policy `public, max-age=15, stale-while-revalidate=30`. No numeric rate quota or rate-limit headers were supplied by the documentation or observed responses. A provider threshold was not established by load testing. Automated mocked tests verify 429 handling and Retry-After cooldown without burdening the public service.

Validation: `node --test src/civic.test.mjs src/election.test.mjs src/senate.test.mjs`, `npx tsc --noEmit`, `npm run build`. Production build served using `server/start.ts` on local port 8555 for browser checks. Existing Vite configuration and bundle-size advisories remain.

Live full-race checks passed for Senate ID 87283 and House ID 87282, each reporting seven total candidate votes, percentages to two decimal places, false candidate winner flags, and November 3 source timestamps. Governor ID 87130 returned a valid full zero-vote response and October 30 timestamp. Headless production HTML rendering passed, but live cross-origin browser fetches failed/timed out in this environment; end-to-end live browser compatibility is not verified. CORS headers alone do not establish that final check.
