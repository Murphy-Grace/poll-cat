# AP race-call investigation

Checked November 3, 2026. Implementation is pending verified authorized access.

## Access findings

AP's [Getting Started guide](https://developer.ap.org/ap-elections-api/docs/Getting_Started.htm) requires an access key sent in the `x-api-key` request header over HTTPS. Public documentation and the Query Explorer do not establish permission to consume or publish the data.

The local process has no AP credential variable, and `.env.local` contains only the existing news-provider configuration. No AP endpoint, credential configuration, or verified AP race/candidate crosswalk exists in the inspected application/server files. `docs/POLL-CAT-UPGRADE.md` already records that no entitlement, license, or 2026 payload was available. These findings cannot establish whether an account or a deployment outside this checkout has access. No authenticated AP request was possible, and no AP integration or AP Called badge has been activated.

Before implementation, configure an AP-provided key as a server-only secret (proposed name: `AP_ELECTIONS_API_KEY`, never `VITE_`), confirm entitlement and display rights for the relevant 2026 Senate/Governor races, and validate an authenticated response for those races. Do not put the key in chat, source control, client bundles, or request URLs.

## Official API contract

Use the [Elections Request reference](https://developer.ap.org/ap-elections-api/docs/Elections_Request.htm) and [response reference](https://developer.ap.org/ap-elections-api/docs/Elections_Response_Data_Elements.htm) to validate the eventual adapter against entitled responses. An initial query to evaluate after authorization is:

```text
GET https://api.ap.org/v3/elections/2026-11-03?officeID=S,G&raceTypeID=G&level=state&resultsType=l&winner=A&format=json
```

The request selects Senate/Governor general-election data at state level. Confirm actual coverage, including special elections, against authenticated race metadata; filters alone do not establish completeness. Request all call states so reversals remain observable. Follow AP's `nextrequest` links for incremental updates, validating HTTPS and the AP host before forwarding credentials. Merge deltas by race identity; an absent race in a delta is not a withdrawal. Drain truncated responses, handle retries/ETags, and persist both current state and a transition history across server restarts. A production design must coordinate concurrent pollers and prevent older responses from overwriting newer observations.

Store AP race identity, candidate identifiers (`candidateID` and `polID`), raw `raceCallStatus`, candidate `winner`, `winnerDateTime`, reporting-unit `lastUpdated`, response `timestamp`, and local receipt time separately. The feed timestamp and retrieval time are not the call time. Reject test data by checking each race's `resultsType`; test timestamps can look like election-night timestamps.

AP documents candidate winner markers `X` (winner), `R` (runoff advancement), and `N` (reversal). Its [Race Call Status reference](https://developer.ap.org/ap-elections-api/docs/RaceCallStatus.htm) distinguishes Called, Winner Not Leading, Runoff, and Uncalled. Treat Uncalled or a winner reversal as withdrawal of the prior winner. A runoff is not an outright winner. Preserve reversal history without inventing a reversal timestamp when AP supplies none; record when it was observed. Winner Not Leading must retain the verified AP winner even if Open America's vote leader differs.

## Matching to Poll Cat

Poll Cat normalizes Open America seats to `ST-REG` and `ST-SP`; office is implicit in separate Senate/Governor feeds. AP race IDs are unique only within a state. Build an explicit, reviewed crosswalk using election date, state, office, AP race ID, event/race metadata, and Poll Cat seat identity. Include office in the normalized call key. Never merge Florida/Ohio special Senate elections with regular seats or match by state alone. Governor currently consumes regular-seat keys; unsupported or ambiguous races must remain unmatched.

The directory lacks AP politician IDs. Add a reviewed mapping from AP candidate identity within each mapped race to a stable directory candidate ID, verifying full name, party, and seat against authenticated initialization data. Names or party alone are insufficient; initials, nicknames, duplicate names, and placeholder directory entries need explicit review. Unresolved candidates must suppress the winner display and surface a mapping diagnostic, rather than selecting the closest name or current vote leader. Do not fabricate AP IDs before a real payload is available.

## Display and integration requirements

Keep `src/results.ts` and Open America's reported totals as the vote source. Serve AP call metadata from a separate server endpoint, registered in Vite development/preview, the Node server, and the deployed API adapter. Never overwrite or sum provider vote snapshots. Keep source attribution, call time, receipt time, and availability separate from Open America's refresh state.

Render “AP Called” and the mapped declared winner only for authenticated, validated, non-test AP data with a consistent winner marker, call status, timestamp, and unambiguous race/candidate crosswalk. With reported votes and no verified AP call, retain “Leading” (or “Tied” for equal top totals); without reported votes, retain “Awaiting results.” Verified AP calls can precede reported votes. Handle withdrawal immediately and return to the reported-vote status. Failed refreshes must expose call-feed unavailability/staleness; they must never create a call or silently claim current verification. Never infer a call from margins, polling, reporting percentages, or poll-closing times.

Current popup/list behavior already distinguishes reported leads from calls. Seat composition ignores unverified winners. No runtime changes are needed to preserve those guarantees while access is unverified.

After access is established, test authenticated call parsing, test-data rejection, unknown/duplicate mappings, regular versus special seats, independent winners, winner not leading, calls before votes, runoff, reversal and re-call, out-of-order updates, restart persistence, truncated deltas, failures, secret exclusion, and unchanged Open America totals. Validate deployment and browser rendering with real entitled initialization data before enabling badges.

The user's final requirement was truncated at “Add AP call s”; its remaining scope is unresolved.
