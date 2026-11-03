# Poll Cat launch report — November 3, 2026

Original files were copied to `backups/election-night-launch/` before editing. The existing application and research features were retained.

## Implemented

- Poll Cat header, title and footer; enlarged transparent-background PNG logo.
- Senate map immediately after compact election status. Polling, Live Results and Poll Closings controls; compact expandable next-closing countdown.
- One hundred Senate seat segments: 45 Democratic, 2 Independent, 53 Republican. Caucus totals separately labeled 47/53, checked against https://www.senate.gov/senators/ and https://www.dailypress.senate.gov/on-the-floor/senate-facts/ on November 3. Neither source gives a source-update timestamp; the UI labels the verification date accordingly.
- No connected provider supplies authoritative calls. Composition intentionally remains unchanged across refreshes and reloads. Reported leaders, complete counts and arbitrary call-shaped payloads cannot change it. This is current membership, not a projected next-Congress total.
- National directory silhouettes reuse the map library paths and fit each state's actual bounding box. Map view controls synchronize directory colors. All four sorts and state selection retained.
- Governor map now has its own three modes, 50-state directory, silhouettes, four sorts, keyboard/hover information, candidate comparison and separate territory controls. No-election states remain distinct from missing margins. Governor data comes from Governor endpoints and the existing Governor candidate snapshot.
- Guardian briefing is in the right sidebar, with provider thumbnails, publication times, original links, scrolling and text fallback. Server caching, coalescing, attribution and failure backoff remain.
- Concurrent refresh-status, bookmark and Governor composition improvements were preserved.

## Files

Updated: `src/App.tsx`, `src/index.css`, `src/PollClosings.tsx`, `src/GovernorMap.tsx`, `src/GuardianNews.tsx`, `server/guardian.ts`, `server/guardian.test.mjs`, `index.html`, `tsconfig.json`, `.gitignore`.

Added: `src/SeatComposition.tsx`, `src/StateSilhouette.tsx`, `src/composition.ts`, `src/composition.test.mjs`, `src/governor-portraits.ts`, `api/news.ts`, `vercel.json`, `.env.example`, this report. Concurrent changes also include `src/RefreshStatus.tsx` and their verification notes.

## Data limits

Open America has partial state coverage and does not supply winner calls. Empty or absent races stay unavailable. Polling averages are party measurements, not verified candidate-specific percentages. The existing Governor candidate directory is a sourced snapshot, not a live ballot feed; its full roster has not been re-audited in this change.

Missing candidate photographs retain initials. Two Governor portraits were identity-checked against NGA profiles: https://www.nga.org/governors/arizona/ and https://www.nga.org/governors/arkansas/. They link to source credits and fall back on load failure. Other Governor portraits remain unavailable. Existing attributed Senate portraits remain. Complete portrait coverage is not claimed.

Closing times are scheduled regional times; court extensions and actual cessation of voting are not available. Territories have no supported closing schedule in this clock.

## Vercel deployment

Configuration: Vite, `npm run build`, `dist`; native Node function `api/news.ts` adapts the existing Guardian handler. Filesystem routes take precedence, unknown `/api/*` stays 404, other paths fall back to the app shell. The app's internal navigation remains its existing client state navigation.

Set **GUARDIAN_API_KEY** in Vercel's Preview and Production project environments. Never use a VITE-prefixed secret. Public election feeds currently run directly in the browser and need no additional serverless routes or keys. Existing civicAPI integration details remain in `server/CIVICAPI.md`; it is separate from the composition baseline.

Guardian caches and request coalescing are per warm server instance. Cold starts and multiple instances can make additional requests; there is no distributed quota limiter. Confirm the production key's permitted use and quota before high-traffic hosting; a shared cache is needed for a strict cross-instance request cap.

No deployment was created or overwritten. Publishing requires an authenticated Vercel account with access to the intended existing project, its project/team identity, production environment variables and authorization to publish there. Do not paste API keys into chat. A deployed preview and production smoke test remain necessary.

## Validation

`npx tsc --noEmit`, `npm run build`, and `npm test --if-present` pass; 24 tests pass. Tests cover immutable 100-seat baseline, fake/partial/duplicate result inputs, refresh safety, thumbnail normalization/fallback, Guardian cache/coalescing/backoff, race parsing and identity matching.

Chrome checked Senate and Governor, all three map controls, all four directory sorts, 50 silhouettes per directory, Texas Senate and Arizona Governor selection, candidate cards, keyboard tooltips, three territory controls, loaded logo and Hobbs portrait, and 390px responsive layouts. Document width equals viewport for both offices; navigation and survey tables retain internal scrolling. Guardian returned 12 articles with thumbnails; the first 10 images had loaded at the sampled browser instant (the remaining two were below the lazy-loading viewport). A direct nested URL returned the HTML app shell. No uncaught exceptions were observed. This does not validate future real race calls, every remote portrait or a production Vercel deployment.

Vite reports existing native-config compatibility notices and a bundle slightly above 500 kB (about 164 kB gzipped). Build succeeds.
