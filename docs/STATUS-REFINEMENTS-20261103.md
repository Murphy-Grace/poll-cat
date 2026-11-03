# Status and candidate refinements — November 3, 2026

Original implementation files are preserved in `backups/status-refinements-20261103/`.

## Changes in this pass

- Separate immutable Governor held-office baseline (24 Democratic, 26 Republican); Senate remains 45 Democratic, 2 Independent, 53 Republican. Unverified vote snapshots never change either baseline.
- Governor and Senate polling refresh schedules now follow completed requests, avoid concurrent requests, skip inactive pages and resume overdue polling on visibility changes. Governor results retain a separate one-minute interval; news remains 15 minutes.
- Refresh failures explicitly label the latest failed attempt while retaining the last successful timestamp.
- Candidate photo failure state resets when switching identities.
- Added Barry Moore’s official House Creative Committee portrait with public-domain attribution: https://commons.wikimedia.org/wiki/File:Barry_Moore_117th_U.S_Congress.jpg . Identity matched against the existing Alabama Republican Senate directory entry. Senate now has 16 photo references among 153 records; 137 lack portraits. Governor retains four attributed image references; most candidates still use initials. Existing portrait rights have not been exhaustively revalidated.

## Verification

- `npx tsc --noEmit`: passed.
- `npm run build`: passed, with existing Vite native configuration compatibility and bundle-size warnings.
- `npm test --if-present`: 27 passed, zero failures (includes concurrent workspace test additions).
- Chrome desktop (1440px) and mobile (390px): both office maps and 50-row directories, four sort options, state selection, keyboard tooltips, composition switching, silhouette presence and bookmark markers checked. Both mobile documents fit the viewport. No uncaught exceptions.
- Governor Katie Hobbs image loaded successfully; Guardian endpoint returned 12 articles with images. Ten thumbnails had loaded at inspection; two were still unloaded. New Barry Moore image metadata was verified, but its browser loading was not exhaustively checked.
- Partial Florida/Alaska closing boundaries and UTC conversion covered by tests. Full 15-minute refresh cycles, outage recovery and all portrait URLs were not browser-tested.

## Concurrent changes and remaining coverage

During this pass, other workspace edits changed closingStyle and its tests so Live Results has no closing outlines. This differs from the pasted request; the user was asked which behavior to retain. Those concurrent edits were preserved. Poll Closings continues to outline 50 states and polling has no closing outlines.

The existing selected-state panels, compact tooltips, directory silhouettes, bookmarks and sorting remain. No authoritative race-call feed or live court-extension feed is connected. Territorial elections remain separate from the 50-state composition; verified territorial party totals are unavailable. Missing ballots/portraits and provider coverage limitations from ELECTION-UX-VERIFICATION.md remain. Buildable and locally checked; complete verified election-night coverage cannot be claimed.
