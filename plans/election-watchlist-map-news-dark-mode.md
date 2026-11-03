# Election Watchlist: Dark Theme, National Map, Candidates, and News

## Objective

Extend the existing Pass 1 Election Watchlist into a backend-capable, responsive dashboard that adds:

- A dark-default theme with a persistent light/dark toggle.
- An accessible U.S. Senate map at the top of the opening Watchlist view.
- Explicit Polling, Forecast, and Results map modes whose data and labels never blur together.
- Verified candidate identities and sourced portraits for all 21 configured races.
- A secure, provider-neutral live-news boundary that remains visibly unconfigured until a licensed provider and key are supplied.
- Prominent linked headlines on the opening view and a fuller race-level story feed.
- An interactive candidate–story–publisher node-link graph on Race Detail.

The existing 14 default saved races, seven discovery races, five editable tiers, drag-and-drop behavior, localStorage persistence, provider-unavailable language, and separation of polling averages, forecasts, and actual results must remain intact.

## Confirmed Product Decisions

- The opening map defaults to **Polling** and includes **Forecast** and **Results** toggles.
- All 50 states appear. The 21 configured race states are actionable; other states explain that no race record is configured.
- No state receives partisan or metric coloring unless the selected provider response has been validated. Disconnected or unavailable data is neutral and plainly labeled.
- Dark mode is the first-visit default, with a user-controlled persistent theme toggle.
- Candidate portraits use verified official campaign, government, or otherwise rights-cleared sources with visible source/credit metadata. Missing or uncertain images fall back to initials.
- Candidate records initially cover all 21 configured races, but only officially declared or otherwise verifiable candidates are included. Unverified or incomplete races retain honest empty states.
- Licensed news is implemented behind a provider-neutral server adapter. The first release shows a truthful “connection required” state until a concrete provider and API key are supplied.
- Prominent story links appear in an opening “Watchlist briefing” and in a Race Detail feed.
- The graph lives on Race Detail and connects candidates to stories and stories to publishers. Selecting a node filters or highlights corresponding story cards.
- A backend-capable Make runtime transition is in scope now.

## Implementation Plan

### 1. Transition the Project to the Supported Backend Runtime

1. Invoke Make’s Payload backend transition before editing the current Vite app.
2. After the platform transition completes, invoke and follow `make-payload-migrate-from-vite` exactly:
   - Locate the platform-created `make: transition template to ReactNextJsWithPayloadV1` commit.
   - Read the preserved Vite app from the transition commit’s parent with `git show`/`git archive`; never reset or check out the old tree.
   - Preserve the generated Next.js/Payload configuration, route groups, scripts, lockfile, and platform scaffolding.
   - Port the existing UI and interactions into the Next.js application instead of copying Vite entrypoints or configuration.
3. Load `make/nextjs-docs` before writing Next.js code and the relevant Payload skills before schema, media, content, or API work.
4. Keep the interactive dashboard in a focused client component, but fetch CMS-backed race/candidate data and server news status through server-safe boundaries.
5. Preserve the existing local watchlist schema and storage key (`election-watchlist:v1`) so the transition does not erase the user’s saved races, tier assignments, or custom tier names.

### 2. Establish Clear Data Ownership

Use Payload for durable, editor-verifiable election reference data; keep personal watchlist preferences local to the browser; keep licensed news transient unless the eventual provider license explicitly permits storage.

#### Payload collections

**Races**

- Stable `raceId`, state name, postal code, seat type, election date.
- Default-saved and discovery flags plus the existing coverage note.
- Provider identifiers kept optional and provider-specific.
- Relationship to candidates.
- Public read access; admin write access.

Seed the existing 21 configured races and preserve their stable IDs so localStorage assignments continue to resolve.

**Candidates**

- Stable slug/provider ID where available.
- Display name, party label and party code, incumbent/challenger/open-seat context.
- Race relationship.
- Official status and a concise source note.
- Verification URL and verification timestamp.
- Optional portrait relationship.
- Public read access; admin write access.

Include only candidates supported by an official election filing/listing, official campaign site, or other authoritative source at implementation time. Do not infer nominees, likely candidates, party control, or candidate status.

**Media**

- Use the template’s supported upload collection/pattern.
- Add source URL, credit, rights/license note, and verification date required for candidate portraits.
- Use optimized responsive delivery and an initials fallback when media is absent or fails.
- Load `payload-framework` before implementing upload fields, storage, image delivery, or cache headers.

#### Data kept outside Payload

- Navigation labels, provider labels, metric definitions, and layout copy remain code constants.
- Watchlist saved IDs, tier assignments, tier names, and theme preference remain localStorage values.
- Live news response objects remain transient server/cache data unless a later selected license explicitly permits persistence.

#### Content operations

- After schema registration, invoke `payload-content`.
- Seed and verify races, candidates, and portrait media only through the project-installed Payload CLI.
- Do not add a seed button, temporary mutation endpoint, raw database helper, or duplicate hard-coded data source.
- Read seeded documents back through the CLI and verify race relationships, source metadata, and missing-image fallbacks.

### 3. Port and Organize the Frontend

Break the current monolithic `App.tsx` into narrowly scoped modules while preserving behavior:

- App/dashboard shell and navigation.
- Watchlist state hook with versioned localStorage handling.
- Race directory and race cards.
- Race detail tabs.
- Theme provider/toggle.
- Senate map and map legend.
- Candidate card/list.
- News briefing/feed and connection states.
- News relationship graph.
- Shared status, external-link, icon, and empty-state primitives.

Use real Next.js routes for the major pages and race details so links are stable and refresh-safe:

- `/` — My Watchlist/opening dashboard.
- `/races` — All Senate Races.
- `/races/[raceId]` — Race Detail.
- `/media` — Media Sources.
- `/settings` — Methodology & Settings.

Use the race’s stable ID in the detail route. Preserve the current tab experience with a query parameter or route-safe local state so Polling, Forecast, Results, and Reporting remain directly distinguishable.

### 4. Add Dark-Default Theme Support

1. Convert the existing palette into semantic CSS custom properties for canvas, elevated surfaces, subtle surfaces, primary text, muted text, borders, focus, shadows, party colors, warning, and success states.
2. Define complete dark and light token sets. Preserve restrained red/blue use for party data rather than making the entire interface partisan.
3. On first visit, use dark mode regardless of OS preference, per the confirmed decision.
4. Store explicit choices under a separate versioned key such as `election-watchlist:theme`.
5. Set the theme attribute before hydration in the Next.js document/layout to prevent a light flash.
6. Add an icon-based header toggle with an accessible name that describes the action (“Switch to light theme” / “Switch to dark theme”), keyboard focus treatment, and no emoji.
7. Apply `color-scheme` to native controls and verify select/input contrast in both themes.
8. Retain reduced-motion support and ensure map/chart transitions are also disabled under `prefers-reduced-motion`.

### 5. Build the National Senate Map

#### Geometry and accessibility

- Use a vetted, local SVG map asset containing individually addressable shapes for all 50 states, including Alaska and Hawaii insets. Do not fetch geometry at runtime.
- Preserve the geometry source and license/attribution in repository documentation or source comments.
- Give every state an accessible name and keyboard target. Enter/Space activates configured states.
- Use a visible focus ring independent of fill color.
- Provide a text/table equivalent listing each configured state and its selected-metric status so map information is not available only visually.

#### Metric controls

- Place a segmented **Polling / Forecast / Results** control above the map.
- Default to Polling.
- Selecting Results also activates the existing Election Night context/banner; selecting Polling or Forecast returns to the non-results context.
- If the existing header Polling/Election Night switch remains, synchronize it with the map rather than allowing contradictory modes.
- Clicking a configured state opens its Race Detail page and selects the corresponding data tab.
- Clicking or focusing an unconfigured state shows a small explanation: the state is present on the national map, but no race record is loaded.

#### Coloring contract

Create a normalized map datum with:

- `raceId`, `metricKind`, `status`, `leaderParty`, `value`, `unit`, `asOf`, and `source`.
- Status values such as `available`, `unavailable`, `connection-required`, `error`, and `stale`.

Render partisan color only for `available` records validated by the matching adapter:

- Polling colors represent the polling-average leader/margin only.
- Forecast colors represent modeled probability only.
- Results colors represent actual reported vote leader/share only.

Use separate legends and labels for each mode. Never reuse a percentage without its unit and metric name. Neutral fills cover unconfigured, unavailable, connection-required, error, and stale states, with visually distinct patterns/borders where needed and a legend that explains each state. Initially, because all three metric providers are disconnected, the whole map is neutral and the selected mode prominently explains why.

### 6. Add Verified Candidate Presentation

1. Research all 21 configured races at implementation time using authoritative sources.
2. Store the source URL and verification date for every candidate record.
3. Store only portraits with a documented official/government/rights-cleared source and credit. Do not use search-result thumbnails or unattributed images.
4. Add compact candidate rows to race cards only where the density remains readable; otherwise show a verified candidate count and keep full candidate presentation on Race Detail.
5. Replace the Race Detail “Awaiting verified provider data” aside with candidate cards containing:
   - Portrait or initials fallback.
   - Name and party.
   - Incumbent/status context when verified.
   - “Verified [date]” and source link.
6. If no candidate is verified for a race, keep an explicit candidate-unavailable state. Do not imply that the race is uncontested.
7. Keep candidate identity/portrait data visually and semantically separate from polling, forecast, and results values.

### 7. Define the Provider-Neutral News Boundary

Create a server-only adapter interface and normalized response model. The browser must never receive provider credentials or call a licensed API directly.

#### Adapter input

- Race ID.
- Verified candidate names/aliases.
- State and office.
- Result limit and recency window.

#### Normalized story

- Stable provider/story ID.
- Headline.
- Canonical publisher URL.
- Publisher name.
- Published timestamp.
- Optional provider-supplied summary and thumbnail URL when license terms allow.
- Matched candidate IDs and race ID.
- Provider attribution.

Do not import or display full article text.

#### Response envelope

- `status`: `connected`, `unconfigured`, `error`, or `stale`.
- Provider label when configured.
- Fetch timestamp and optional retry guidance.
- Deduplicated normalized stories.

#### Initial null adapter

- Register a null/unconfigured adapter as the only initial implementation.
- Return a typed `unconfigured` response rather than sample headlines.
- Expose a server endpoint/service used by both the opening briefing and Race Detail.
- Add no secret until a specific licensed vendor is selected. When that happens, collect the API key through Make’s environment-variable workflow, add a vendor adapter behind the same contract, and validate license-required attribution/caching rules.
- Set conservative server caching and timeouts only after a provider is selected. Never represent cached data as live; show the fetch timestamp and stale state.

### 8. Add Prominent Story Links

#### Opening “Watchlist briefing”

- Place the briefing adjacent to the map on wide screens and below it on smaller screens.
- Aggregate stories only for saved races, deduplicate by canonical URL, and order by provider publication time.
- Show a restrained set (for example, five leading items) with headline, publisher, timestamp, associated race/candidate, and a clear external-link affordance.
- Open publisher URLs directly in a new tab with safe link attributes.
- In the initial null-adapter release, render a polished “Licensed news connection required” panel with no fake headlines and a concise explanation of what will appear after connection.

#### Race Detail reporting feed

- Replace the current Pass 3 placeholder with the normalized feed for that race.
- Keep the existing external editorial reference as a clearly labeled manual reference, not as live provider content.
- Include loading, unconfigured, empty-success, error, and stale states.
- Distinguish “no matching stories returned” from “provider not connected.”
- Keep story links prominent; summaries and thumbnails are secondary and appear only when provider terms allow.

### 9. Build the Candidate–Story–Publisher Graph

1. Place the graph above or beside the Race Detail reporting feed.
2. Use a deterministic SVG layout rather than a continuously moving force simulation:
   - Candidate nodes in the first column.
   - Story nodes in the center.
   - Publisher nodes in the final column.
   - Edges candidate → matching story → publisher.
3. Limit the graph to the current normalized story set to avoid unreadable density.
4. Selecting/focusing a node highlights connected edges and filters or emphasizes matching story cards.
5. Add an explicit “Clear selection” control.
6. Provide keyboard focus, visible selected state, and accessible labels containing node type and name.
7. Provide a textual relationship list/table as the semantic equivalent; the SVG is supplemental, not the only way to understand the links.
8. On mobile, use a compact scrollable SVG or the textual relationship view first; never shrink labels below readable size.
9. With the null adapter, show verified candidate nodes if available plus an honest explanation that story and publisher relationships require a news connection. Do not invent graph edges.

### 10. Preserve and Extend Truthful Provider States

- Keep PollingSource, Polling Forecast, and AP Elections API panels independently labeled and independently timestamped.
- Candidate CMS verification must not be presented as provider polling verification.
- News gets its own provider status and timestamp; it must not reuse polling “last updated” fields.
- “Refresh sources” should request each configured source independently and report per-source outcomes. While all external adapters are unconfigured, it should continue to say that no live data changed.
- Election Night mode continues to state that polling and forecasts are not vote returns and that preliminary returns are not certified.
- Add news and candidate-source definitions to Methodology & Settings, including what “verified candidate” and “live/stale story” mean.

### 11. Responsive and Visual Treatment

- Preserve the current restrained editorial character: serif display headings, compact sans-serif metadata, white/light or deep-neutral cards, and minimal party color.
- Treat the current CSS variables and component patterns as the project’s local design system unless the generated Payload template supplies a designated system; extend it rather than introducing a generic component library.
- Wide layout: map as the dominant opening visual with briefing rail alongside it.
- Tablet: stack map and briefing, retain full legends and controls.
- Mobile: full-width metric tabs, horizontally safe map viewport, briefing below, single-column candidate/story cards, and text-first graph fallback.
- Candidate photos should support context, not become oversized campaign imagery.
- Do not add generated photography or decorative stock imagery.

## Failure and Edge-Case Handling

- **Payload unavailable:** render an explicit race/candidate data error without erasing the local watchlist; keep retry/navigation available.
- **Legacy localStorage:** ignore unknown saved IDs safely, retain known IDs and tier names, and do not change schema version unless migration logic is added.
- **No verified candidate:** use candidate-unavailable copy, not “unopposed.”
- **Missing/broken portrait:** initials fallback with no broken-image icon.
- **No metric provider:** neutral map plus provider-specific explanation.
- **Partial metric response:** color only validated states; mark all others unavailable rather than extrapolating.
- **News unconfigured:** connection-required panel, no sample content.
- **News empty success:** “No matching recent stories,” including query timestamp.
- **News error/timeout:** preserve last successful response only if licensing permits and label it stale; otherwise show an error state.
- **Duplicate stories:** deduplicate by canonical URL/provider ID before briefing or graph generation.
- **Ambiguous candidate match:** omit the candidate edge rather than guessing; the story may remain race-level if the provider/query confidently matched the race.
- **Graph overload:** cap displayed stories and expose remaining items in the feed.
- **Theme storage unavailable:** remain dark for the session and keep the toggle functional in memory.

## Verification Strategy

### Migration and data

- Confirm the platform transition commit exists and the previous Vite implementation is recoverable.
- Verify all five current views/routes and the existing interactions after migration.
- Verify exactly 21 race records, with the same stable IDs and 14 default-saved flags.
- Read candidate/media records back through the Payload CLI and spot-check source URLs, verification dates, credits, and race relationships.
- Confirm no API secret appears in client bundles, source control, logs, or network responses.

### Functional checks

- Existing saved races, tier names, assignments, drag/drop, accessible tier selects, search, filters, export, and reset continue to work.
- A pre-transition `election-watchlist:v1` localStorage payload still loads correctly.
- First visit is dark; theme toggle updates immediately, persists across reloads, and does not flash the wrong theme.
- Map defaults to Polling and displays all 50 states.
- Polling, Forecast, and Results controls update labels/legends and synchronize with Election Night context.
- Configured states navigate to the correct race/metric tab; unconfigured states do not create fake race pages.
- Neutral/unavailable map behavior is correct for every disconnected adapter.
- Candidate cards show sourced records and initials fallbacks correctly.
- Opening briefing and Race Detail both show the unconfigured news state initially.
- Null news responses never render placeholder headlines.
- Graph node selection and clear-selection behavior update the feed/highlights once stories exist; disconnected mode creates no fake edges.

### Accessibility

- Complete keyboard navigation for theme control, map modes, every state, candidate/source links, graph nodes, and story links.
- Screen-reader labels for map state/status, external links, portraits, and graph nodes.
- Text equivalents for map and graph data.
- Color is never the sole indicator of party, metric status, graph selection, or unavailable state.
- Contrast passes WCAG AA in light and dark themes, including muted metadata and party colors.
- Reduced-motion preference disables nonessential transitions.

### Technical checks

- Use the generated repository’s prescribed format, typecheck, test, and build commands after transition; do not substitute Vite-era commands.
- Run the narrowest relevant checks during implementation, then a production build because this is a framework migration and broad UI/data change.
- Inspect the existing supervised preview rather than starting a second development server.
- Check desktop, tablet, and mobile layouts in both themes.
- Verify direct navigation and refresh for every Next.js route and a race detail URL.
- Confirm provider failures and missing CMS relationships do not throw runtime errors.

## Delivery Order

1. Backend transition and faithful Vite-to-Next/Payload migration.
2. Payload race/candidate/media schema and verified content seeding.
3. Theme tokens, dark-default initialization, and toggle.
4. National map with neutral provider states and synchronized metric controls.
5. Candidate cards and portrait fallbacks.
6. Provider-neutral news contract and null adapter.
7. Opening briefing and Race Detail feed states.
8. Candidate–story–publisher graph and accessible text equivalent.
9. Methodology/status updates, responsive polish, and full verification.

## Acceptance Criteria

- The app opens in a polished dark theme and can switch persistently to light.
- The opening Watchlist contains a responsive, accessible 50-state map and briefing area.
- Map labels, legend, color, timestamps, and unavailable states always correspond to exactly one of Polling, Forecast, or Results.
- No disconnected provider causes invented candidates, values, headlines, publishers, or graph relationships.
- All 21 configured races can display verified candidate records; missing identities or portraits degrade honestly.
- Every portrait has provenance metadata or uses the initials fallback.
- Licensed news credentials remain server-side; until configured, both news surfaces clearly say connection required.
- Story links, when a future adapter is connected, lead directly to publishers and retain provider attribution/timestamps.
- The graph is interactive, keyboard accessible, and backed by a nonvisual relationship equivalent.
- Existing Pass 1 watchlist behavior and stored user preferences survive the framework transition.
- Responsive layouts, direct routes, both themes, and the production build verify successfully.
