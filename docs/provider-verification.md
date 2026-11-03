# Provider verification — November 3, 2026

Requests used no API keys. No existing candidate, election-result, watchlist, or polling data was replaced.

## Polling Forecast

Documentation: https://www.pollingforecast.com/us/data

Exact GET URLs (no redirects or query parameters):

| URL | HTTP | Validated rows | Missing poll_average |
| --- | --- | --- | --- |
| https://www.pollingforecast.com/api/us/senate | 200 | 35 | 5 |
| https://www.pollingforecast.com/api/us/house | 200 | 435 | 326 |
| https://www.pollingforecast.com/api/us/governors | 200 | 36 | 2 |

All three payloads use the documented envelope and have asOf 2026-11-02. Response headers include application/json and Access-Control-Allow-Origin: *. No 400, 404, or 429 was reproduced on these exact URLs. Previously the client fetched Senate only. Client errors now show the exact requested URL (and resolved URL if different). HTTP 429 honors Retry-After with a minimum 60-second cooldown. Identical requests are coalesced and successful responses cached for ten minutes, consistent with the documentation.

The supplemental dashboard table lists all three offices, keeping poll_average nullable and labeling best_bet_margin as a forecast. Margins are percentage points, left party minus Republican; they are not candidate vote shares. The original Senate provider flow and governor map remain in place.

## civicAPI

Documentation: https://civicapi.org/api-documentation (including the site's documentation JavaScript bundle).

Exact GET requests:

- https://civicapi.org/api/v2/race/search?startDate=2026-11-03&endDate=2026-11-03&country=US&query=US+Senate&limit=1000 — HTTP 200; two Virgin Islands State Senate races, not US Senate races. Both excluded by the existing matcher.
- https://civicapi.org/api/v2/race/search?startDate=2026-11-03&endDate=2026-11-03&country=US&query=Senate&limit=1000 — HTTP 503, DATABASE_TIMEOUT.
- https://civicapi.org/api/v2/race/search?startDate=2026-11-03&endDate=2026-11-03&country=US&query=US+House&limit=1000 — HTTP 503, DATABASE_TIMEOUT.
- https://civicapi.org/api/v2/race/search?startDate=2026-11-03&endDate=2026-11-03&country=US&query=Governor&limit=1000 — HTTP 503, DATABASE_TIMEOUT.
- https://civicapi.org/api/v2/race/search?startDate=2026-11-03&endDate=2026-11-03&country=US&province=NC&limit=1000 — HTTP 200; returned 1000 entries. State House/Senate aggregate entries had zero votes; no matching federal or governor result established. This response does not establish complete coverage.

- https://civicapi.org/api/v2/race/159547 — HTTP 200; full North Carolina State Senate aggregate, test_data false, 0% reporting, four party rows each with zero votes. This is not a matching US Senate race or evidence of live returns.

No 400, 404, or 429 was reproduced in these checks. Search listings and zero-vote aggregates do not establish live results. The existing civicAPI panel is retained with its loading control disabled until actual results and race identities can be verified. Existing Open America results remain connected.

## Validation

- All 506 downloaded Polling Forecast rows passed the client row validator.
- npm run typecheck
- npm run build
- npm test (18 passed)

The production build emits existing Vite configuration compatibility and bundle-size warnings. The Senate roster test now accepts per-candidate HTTPS source URLs instead of requiring them to equal the race-level source; four existing Texas candidate entries have their own source. No roster data changed.
