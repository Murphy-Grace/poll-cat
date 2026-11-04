import { ElectionMapPopup, useMapPopup } from './ElectionMapPopup'
import { CandidatePortrait, MapViewTabs, ProviderNotice } from './ElectionMapUI'
import { LiveElectionStatus } from './LiveElectionStatus'
import { RefreshStatus } from './RefreshStatus'
import { SeatComposition } from "./SeatComposition"
import { StateSilhouette } from "./StateSilhouette"
import { ForecastCoverage } from "./ForecastCoverage"
import { CivicResults } from "./CivicResults"
import { GovernorMap, MarginLegend } from "./GovernorMap"
import { ClosingDefs, ClosingLegend, closingSecondary, closingStyle, CLOSINGS, closingTime, closingStatus, stateClosingHours, closingColor, useElectionClock, PollClosings } from "./PollClosings"
import { margin, marginColor, marginLabel, voteMargin, reportedVoteSummary } from "./election"
import { useEffect, useMemo, useRef, useState } from "react"
import { SENATE_DIRECTORY, SENATE_STATES, candidateResult, getRaceCandidates, migrateRaceId, type SenateCandidate } from "./senate"
import { GuardianNews, useGuardianNews } from "./GuardianNews"
import usaMap from "@svg-maps/usa"
import { RESULTS_COVERAGE, fetchSenateResults, type SenateResultsFeed, type SenateResultRace } from "./results"
import {
  fetchForecastDetail,
  fetchForecastRaces,
  fetchPollingDetail,
  fetchPollingRaces,
  matchForecastRace,
  matchPollingRace,
  type ForecastDataset,
  type ForecastDetail,
  type ForecastRace,
  type PollingDetail,
  type PollingRace,
} from "./polling"

type Page = "home" | "watchlist" | "races" | "media" | "settings" | "detail"
type DetailTab = "polling" | "forecast" | "results" | "reporting"
type MapMetric = "polling" | "forecast" | "results"
type Theme = "dark" | "light"

type Race = {
  id: string
  state: string
  code: string
  seat: "REG" | "SP"
  note?: string
  defaultSaved?: boolean
  suggested?: boolean
}

type WatchlistState = {
  version: 1
  savedIds: string[]
  assignments: Record<string, number | null>
  tierNames: string[]
}

type PredictionState = Record<string, string>

type ArticleBookmark = {
  id: string
  title: string
  outlet: string
  url: string
  publishedDate: string
  notes: string
  raceIds: string[]
  candidateName: string
  savedAt: string
}

type ArticleState = {
  version: 1
  items: ArticleBookmark[]
}

type ArticleDraft = Omit<ArticleBookmark, "id" | "savedAt">

type ImportedNewsArticle = {
  id: string
  title: string
  description: string
  url: string
  image: string | null
  publishedAt: string
  source: {
    name: string
    url: string
  }
}

type NewsSnapshot = {
  version: 1
  importedAt: string
  totalArticles: number | null
  articles: ImportedNewsArticle[]
}

type ProviderLoad<T,> = {
  status: "loading" | "success" | "error"
  data: T | null
  lastSuccess: string | null
  error: string | null
}

type DetailLoad<T,> = ProviderLoad<T> & {
  raceId: string | null
}

type MapLocation = {
  id: string
  name: string
  path: string
}

type PartyValue = {
  party: string
  value: number
}

const EMPTY_PROVIDER = {
  status: "loading",
  data: null,
  lastSuccess: null,
  error: null,
} as const

function formatProviderTime(value: string | null) {
  if (!value) return "Never"
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatPercent(value: number | null) {
  return value == null ? "—" : `${value.toFixed(1)}%`
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown provider error."
}

function partyClass(party: string | null) {
  if (party === "TOSSUP") return "party-tossup"
  if (party === "D") return "party-dem"
  if (party === "R") return "party-rep"
  if (party === "I" || party === "IND") return "party-independent"
  if (party === "DSA") return "party-dsa"
  return party ? "party-other" : ""
}

function isTossUp(race: PollingRace | undefined) {
  return race?.rating?.toLowerCase() === "toss-up"
}

function pollingLeader(race: PollingRace | undefined) {
  if (!race) return null
  if (isTossUp(race)) return "TOSSUP"
  const choices: PartyValue[] = []
  if (race.dem_average != null) {
    choices.push({ party: "D", value: race.dem_average })
  }
  if (race.rep_average != null) {
    choices.push({ party: "R", value: race.rep_average })
  }
  if (race.ind_average != null) {
    choices.push({ party: "I", value: race.ind_average })
  }
  choices.sort((a, b) => b.value - a.value)
  return choices[0]?.party ?? null
}

function pollingDetailPollsters(detail: PollingDetail | undefined) {
  if (!detail) return []
  return Array.from(
    new Set(
      detail.recent_polls.polls
        .map((poll) => poll.pollster.trim())
        .filter(Boolean),
    ),
  )
}

function pollingRaceId(race: PollingRace) {
  return `US-SEN-2026-${race.state}-${race.is_special ? "SP" : "REG"}`
}

function stateNameForCode(code: string) {
  return (
    (usaMap.locations as MapLocation[]).find(
      (location) => location.id.toUpperCase() === code,
    )?.name ?? code
  )
}

const DEFAULT_STATES = [
  ["Alaska", "AK"],
  ["Georgia", "GA"],
  ["Iowa", "IA"],
  ["Kansas", "KS"],
  ["Maine", "ME"],
  ["Michigan", "MI"],
  ["Minnesota", "MN"],
  ["Mississippi", "MS"],
  ["Nebraska", "NE"],
  ["New Hampshire", "NH"],
  ["North Carolina", "NC"],
  ["Ohio", "OH"],
  ["South Carolina", "SC"],
  ["Texas", "TX"],
] as const

const RACES: Race[] = SENATE_STATES.map((code) => {
  const seat = code === "FL" || code === "OH" ? "SP" : "REG"
  const defaultSaved = DEFAULT_STATES.some(([, savedCode]) => savedCode === code)
  return {
    id: `US-SEN-2026-${code}-${seat}`,
    state: stateNameForCode(code),
    code,
    seat,
    defaultSaved,
    suggested: !defaultSaved,
    note: seat === "SP" ? "Special-election coverage" : undefined,
  }
})
const NO_SENATE_ELECTION = "No U.S. Senate election in 2026."

const STORAGE_KEY = "election-watchlist:v1"
const THEME_KEY = "election-watchlist:theme"
const PREDICTIONS_KEY = "election-watchlist:predictions:v1"
const ARTICLES_KEY = "election-watchlist:articles:v1"
const NEWS_SNAPSHOT_KEY = "election-watchlist:news-snapshot:v1"
const EMPTY_ARTICLE_DRAFT: ArticleDraft = {
  title: "",
  outlet: "",
  url: "",
  publishedDate: "",
  notes: "",
  raceIds: [],
  candidateName: "",
}
const DEFAULT_WATCHLIST: WatchlistState = {
  version: 1,
  savedIds: RACES.filter((race) => race.defaultSaved).map((race) => race.id),
  assignments: Object.fromEntries(
    RACES.filter((race) => race.defaultSaved).map((race) => [race.id, null]),
  ),
  tierNames: [
    "Top priorities",
    "Closely watching",
    "On my radar",
    "Check in weekly",
    "Reference",
  ],
}

const PROVIDERS = {
  polling: {
    name: "PollingSource",
    href: "https://pollingsource.com/methodology",
    api: "https://pollingsource.com/api/v1",
  },
  forecast: {
    name: "Polling Forecast",
    href: "https://www.pollingforecast.com/us/data",
    api: "https://www.pollingforecast.com/api/us/senate",
  },
  results: {
    name: "Official state election offices via Open America",
    href: "https://openamerica.io/elections/api/",
  },
}

const PUBLIC_VOICES = [
  {
    name: "Hasan Piker",
    initials: "HP",
    kind: "Online creator and political commentator",
    href: "https://www.twitch.tv/hasanabi",
    identity: "No sourced political self-description stored",
    adFontes: "Not applicable to an individual",
    positionSource: "No dated race position saved",
    profileDate: "Reference configured Nov. 1, 2026",
    transparencyHref: null,
  },
  {
    name: "Fox News",
    initials: "FN",
    kind: "News and commentary outlet",
    href: "https://www.foxnews.com/politics",
    identity: "Outlet-level position not inferred",
    adFontes: "Check outlet rating at Ad Fontes",
    positionSource: "No dated editorial position saved",
    profileDate: "Reference configured Nov. 1, 2026",
    transparencyHref: "https://app.adfontesmedia.com/chart/interactive",
  },
] as const

function loadWatchlist(): WatchlistState {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "",
    ) as Partial<WatchlistState>
    if (
      parsed.version === 1 &&
      Array.isArray(parsed.savedIds) &&
      Array.isArray(parsed.tierNames) &&
      parsed.tierNames.length === 5 &&
      parsed.assignments
    ) {
      return {
        ...parsed,
        savedIds: [...new Set(parsed.savedIds.map(migrateRaceId))],
        assignments: Object.fromEntries(Object.entries(parsed.assignments).map(([id, tier]) => [migrateRaceId(id), tier])),
      } as WatchlistState
    }
  } catch {
    // A malformed or unavailable local value safely falls back to the versioned default.
  }
  return DEFAULT_WATCHLIST
}

function loadTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark"
  } catch {
    return "dark"
  }
}

function loadPredictions(): PredictionState {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(PREDICTIONS_KEY) || "{}",
    ) as unknown
    return parsed && typeof parsed === "object" ? Object.fromEntries(Object.entries(parsed).map(([id, value]) => [migrateRaceId(id), value])) as PredictionState : {}
  } catch {
    return {}
  }
}

function loadArticles(): ArticleState {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(ARTICLES_KEY) || "",
    ) as Partial<ArticleState>
    if (parsed.version === 1 && Array.isArray(parsed.items)) {
      const items = parsed.items.filter((item): item is ArticleBookmark =>
        Boolean(
          item &&
          typeof item.id === "string" &&
          typeof item.title === "string" &&
          typeof item.outlet === "string" &&
          typeof item.url === "string" &&
          Array.isArray(item.raceIds),
        ),
      )
      return { version: 1, items: items.map((item) => ({ ...item, raceIds: item.raceIds.map(migrateRaceId) })) }
    }
  } catch {
    // Invalid or unavailable local article data falls back to an empty library.
  }
  return { version: 1, items: [] }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function parseNewsSnapshot(value: string): NewsSnapshot {
  const payload: unknown = JSON.parse(value)
  if (!isRecord(payload) || !Array.isArray(payload.articles)) {
    throw new Error("Paste a GNews response containing an articles array.")
  }
  const articles = payload.articles.map((item, index): ImportedNewsArticle => {
    if (!isRecord(item) || !isRecord(item.source)) {
      throw new Error(`Article ${index + 1} has an invalid structure.`)
    }
    const required = ["id", "title", "url", "publishedAt"] as const
    required.forEach((field) => {
      if (typeof item[field] !== "string" || !item[field]) {
        throw new Error(`Article ${index + 1} is missing ${field}.`)
      }
    })
    if (
      typeof item.source.name !== "string" ||
      typeof item.source.url !== "string"
    ) {
      throw new Error(`Article ${index + 1} is missing its publisher.`)
    }
    const publishedAt = new Date(item.publishedAt as string)
    if (Number.isNaN(publishedAt.getTime())) {
      throw new Error(`Article ${index + 1} has an invalid publication date.`)
    }
    return {
      id: item.id as string,
      title: item.title as string,
      description: typeof item.description === "string" ? item.description : "",
      url: canonicalUrl(item.url as string),
      image: typeof item.image === "string" && item.image ? item.image : null,
      publishedAt: publishedAt.toISOString(),
      source: {
        name: item.source.name,
        url: canonicalUrl(item.source.url),
      },
    }
  })
  return {
    version: 1,
    importedAt: new Date().toISOString(),
    totalArticles:
      typeof payload.totalArticles === "number" ? payload.totalArticles : null,
    articles,
  }
}

function loadNewsSnapshot(): NewsSnapshot | null {
  try {
    const stored = localStorage.getItem(NEWS_SNAPSHOT_KEY)
    if (!stored) return null
    const persisted: unknown = JSON.parse(stored)
    const snapshot = parseNewsSnapshot(stored)
    const importedAt =
      isRecord(persisted) && typeof persisted.importedAt === "string"
        ? new Date(persisted.importedAt)
        : null
    return importedAt && !Number.isNaN(importedAt.getTime())
      ? { ...snapshot, importedAt: importedAt.toISOString() }
      : snapshot
  } catch {
    return null
  }
}

function canonicalUrl(value: string) {
  const url = new URL(value)
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Use an http or https article URL.")
  }
  url.hash = ""
  return url.toString()
}

function formatArticleDate(value: string) {
  if (!value) return "Publication date not recorded"
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(`${value}T12:00:00`),
  )
}

function Icon({
  name,
  size = 18,
}: {
  name: "bookmark" | "chevron" | "external" | "refresh" | "search" | "settings" | "database" | "sun" | "moon" | "network"
  size?: number
}) {
  const paths = {
    bookmark: <path d="M6 3.75h12v17l-6-3.6-6 3.6v-17Z" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    external: (
      <>
        <path d="M15 4h5v5" />
        <path d="m10 14 10-10" />
        <path d="M20 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5" />
        <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    moon: (
      <path d="M20.5 15.3A8.5 8.5 0 0 1 8.7 3.5 8.5 8.5 0 1 0 20.5 15.3Z" />
    ),
    network: (
      <>
        <circle cx="5" cy="12" r="2.5" />
        <circle cx="12" cy="5" r="2.5" />
        <circle cx="19" cy="12" r="2.5" />
        <circle cx="12" cy="19" r="2.5" />
        <path d="m6.8 10.2 3.4-3.4M13.8 6.8l3.4 3.4M17.2 13.8l-3.4 3.4M10.2 17.2l-3.4-3.4" />
      </>
    ),
  }
  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name]}
    </svg>
  )
}

function ExternalLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a className="external-link" href={href} rel="noreferrer" target="_blank">
      {children}
      <Icon name="external" size={14} />
    </a>
  )
}
function EmptyMetric({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "metric-empty compact" : "metric-empty"}>
      <span className="empty-line" />
      <span>
        {compact
          ? "Polling not connected"
          : "No verified polling data available"}
      </span>
    </div>
  )
}

function RaceCard({
  race,
  polling,
  pollsters = [],
  activityCount,
  rank,
  saved,
  tier,
  tierNames,
  onOpen,
  onToggleSaved,
  onMove,
}: {
  race: Race
  polling?: PollingRace
  pollsters?: string[]
  activityCount?: number
  rank?: number
  saved: boolean
  tier: number | null
  tierNames: string[]
  onOpen: () => void
  onToggleSaved: () => void
  onMove: (tier: number | null) => void
}) {
  const visiblePollsters = pollsters.slice(0, 2)
  return (
    <article
      className={`race-card ${isTossUp(polling) ? "tossup" : ""}`}
      draggable={saved}
      onDragStart={(event) =>
        event.dataTransfer.setData("text/race-id", race.id)
      }
    >
      <div className="race-card-top">
        <button className="race-title-button" onClick={onOpen} type="button">
          <StateSilhouette code={race.code} color={marginColor(margin(polling?.dem_average, polling?.rep_average))} />
          <span>
            <strong>{race.state}</strong>
            <small>
              U.S. Senate {race.seat === "SP" ? "· Special election" : ""}
            </small>
          </span>
        </button>
        <button
          aria-label={
            saved
              ? `Remove ${race.state} from watchlist`
              : `Save ${race.state} to watchlist`
          }
          className={saved ? "icon-button saved" : "icon-button"}
          onClick={onToggleSaved}
          title={saved ? "Remove from watchlist" : "Save to watchlist"}
          type="button"
        >
          <Icon name="bookmark" />
        </button>
      </div>

      <div className="candidate-row">
        <span>
          {pollsters.length
            ? `Latest: ${visiblePollsters.join(" · ")}${
                pollsters.length > visiblePollsters.length
                  ? ` +${pollsters.length - visiblePollsters.length}`
                  : ""
              }`
            : polling
              ? "Named pollsters loading"
              : "Polling data"}
        </span>
        <span className="status-dot" />
        <strong>
          {polling
            ? `${activityCount ?? polling.poll_count} recent poll${
                (activityCount ?? polling.poll_count) === 1 ? "" : "s"
              }`
            : "Provider unavailable"}
        </strong>
      </div>
      {
    polling ? (
      <div className="card-polling">
        <span className="dem">D {formatPercent(polling.dem_average)}</span>
        <strong>
          {isTossUp(polling)
            ? `Toss-up · ${polling.margin_label ?? "no clear leader"}`
            : (polling.margin_label ?? "No margin")}
        </strong>
        <span className="rep">R {formatPercent(polling.rep_average)}</span>
      </div>
    ) : (
      <EmptyMetric compact />
    )
  }

      <div className="race-card-footer">
        <span className="source-meta">
          {polling?.rating ?? "PollingSource"} ·{" "}
          {polling?.last_poll_date
            ? `Latest poll ${polling.last_poll_date}`
            : "No successful update"}
        </span>
        {saved ? (
          <label className="tier-control">
            <span className="sr-only">Move {race.state} to tier</span>
            <select
              aria-label={`Move ${race.state} to a tier`}
              onChange={(event) =>
                onMove(
                  event.target.value === "" ? null : Number(event.target.value),
                )
              }
              value={tier ?? ""}
            >
              <option value="">Unassigned</option>
              {tierNames.map((name, index) => (
                <option key={name + index} value={index}>
                  Tier {index + 1}: {name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <button className="text-button" onClick={onToggleSaved} type="button">
            Add to watchlist
          </button>
        )}
      </div>
      <button
        aria-label={`Open ${race.state} race detail`}
        className="card-open"
        onClick={onOpen}
      >
        <Icon name="chevron" size={17} />
      </button>
    </article >
  )
}

function PollingRankCard({
  polling,
  detail,
  rank,
  onOpen,
}: {
  polling: PollingRace
  detail?: PollingDetail
  rank: number
  onOpen?: () => void
}) {
  const pollsters = pollingDetailPollsters(detail)
  const activityCount = detail?.recent_polls.polls.length ?? polling.poll_count
  return (
    <article
      className={`polling-rank-card ${isTossUp(polling) ? "tossup" : ""}`}
    >
      <div className="polling-rank-number">#{rank}</div>
      <div className="polling-rank-state">
        <StateSilhouette code={polling.state} color={marginColor(margin(polling.dem_average, polling.rep_average))} />
        <div>
          <strong>{stateNameForCode(polling.state)}</strong>
          <span>
            {polling.is_special ? "Special election" : "Regular election"} ·{" "}
            {polling.rating ?? "No provider rating"}
          </span>
        </div>
      </div>
      <div className="polling-rank-average">
        <span>D {formatPercent(polling.dem_average)}</span>
        <strong>
          {isTossUp(polling)
            ? `Toss-up · ${polling.margin_label ?? "no clear leader"}`
            : (polling.margin_label ?? "No margin")}
        </strong>
        <span>R {formatPercent(polling.rep_average)}</span>
      </div>
      <div className="polling-rank-sources">
        <strong>
          {activityCount} recent poll{activityCount === 1 ? "" : "s"}
        </strong>
        <span>
          {pollsters.length
            ? `${pollsters.slice(0, 3).join(", ")}${pollsters.length > 3 ? ` +${pollsters.length - 3}` : ""
            }`
            : "Named pollsters loading"}
        </span>
      </div>
      <div className="polling-rank-actions">
        {onOpen && (
          <button className="text-button" onClick={onOpen} type="button">
            Open race
          </button>
        )}
        <ExternalLink href={polling.page}>PollingSource</ExternalLink>
      </div>
    </article>
  )
}

function ProviderState({
  title,
  eyebrow,
  children,
  href,
  linkLabel,
  connectionRequired = false,
}: {
  title: string
  eyebrow: string
  children: React.ReactNode
  href: string
  linkLabel: string
  connectionRequired?: boolean
}) {
  return (
    <section className="provider-panel">
      <div className="provider-icon">
        <Icon name="database" size={22} />
      </div>
      <p className="eyebrow">{eyebrow}</p>
      <h3>{title}</h3>
      <p>{children}</p>
      <div className="provider-actions">
        <span
          className={connectionRequired ? "status-pill warning" : "status-pill"}
        >
          {connectionRequired ? "Connection required" : "Not connected"}
        </span>
        <ExternalLink href={href}>{linkLabel}</ExternalLink>
      </div>
    </section>
  )
}

function CandidateProfiles({ code, result, updatedAt, polling }: { code: string; result?: SenateResultRace; updatedAt?: string | null; polling?: PollingRace }) {
  const entry = SENATE_DIRECTORY[code]
  if (!entry) return null
  return <div className="senate-candidate-profiles">
    <p className="senate-state-note"><ExternalLink href={entry.source}>General-election candidate directory</ExternalLink> · Directory checked {entry.checkedOn}. Includes listed write-ins. This is a dated directory, not a live ballot feed.</p>
    <div className="senate-profile-grid">
      {entry.candidates.map((candidate) => {
        const votes = candidateResult(candidate, result)
        return <article className="senate-candidate-profile" key={candidate.name}>
          <CandidatePortrait candidate={candidate} />
          <div><strong>{candidate.name}</strong><small>{candidate.party}{candidate.writeIn ? " · Write-in" : ""}</small>
            <small>{polling ? `PollingSource party average: ${formatPercent(candidate.party === "Democratic" ? polling.dem_average : candidate.party === "Republican" ? polling.rep_average : null)} · candidate-specific measurement not verified` : ""}</small><small>{votes && result && result.total > 0 ? `${votes.v.toLocaleString()} reported votes${votes.pct == null ? "" : ` · ${votes.pct.toFixed(1)}%`}` : "No reported general-election vote totals"}</small>
            <ExternalLink href={candidate.source}>Candidate / ballot source</ExternalLink>
            {candidate.photo ? <a href={candidate.photo.source} target="_blank" rel="noreferrer" className="portrait-credit">Photo: {candidate.photo.credit}</a> : <small>Verified photograph unavailable</small>}
          </div>
        </article>
      })}
    </div>
    <p className="senate-state-note"><ExternalLink href="https://openamerica.io/elections/api/">Results: official states via Open America</ExternalLink> · {updatedAt ? `Source updated ${formatProviderTime(updatedAt)}` : "No results timestamp available"}. Reported votes are separate from polling; a lead is not a race call. Only exact name matches are attached to profiles; the results tab retains all provider rows.</p>
  </div>
}

function SenateMap({
  savedIds = [],
  pollingProvider = EMPTY_PROVIDER,
  pollingDetails,
  onOpenRace,
  mode = "polling",
  resultsFeed = null,
  resultsSuccess = null, resultsNext = 0, resultsError = null,
  forecastRows = [],
  selectedState, onSelectState, onViewChange,
}: {
  onViewChange?: (view: "polling" | "results" | "closings") => void
  selectedState?: string | null
  onSelectState?: (code: string | null) => void
  mode?: "polling" | "election"
  resultsSuccess?: string | null
  resultsNext?: number
  resultsError?: string | null
  resultsFeed?: SenateResultsFeed | null
  forecastRows?: ForecastRace[]
  savedIds?: string[]
  pollingProvider?: ProviderLoad<PollingRace[]>
  pollingDetails: Record<string, PollingDetail>
  onOpenRace: (race: Race) => void
}) {
  const pollingReady = pollingProvider.data
  const popup = useMapPopup()
  const hoveredCode = popup.code
  const setHoveredCode = (_: null) => popup.close()
  const [localSelected, setLocalSelected] = useState<string | null>(null)
  const selectedCode = selectedState === undefined ? localSelected : selectedState
  const setSelectedCode = (code: string | null) => { setLocalSelected(code); onSelectState?.(code) }
  const [mapView, setMapView] = useState<"polling" | "results" | "closings">(mode === "election" ? "results" : "polling")
  useEffect(() => { const view = mode === "election" ? "results" : "polling"; setMapView(view); onViewChange?.(view) }, [mode, onViewChange])
  const now = useElectionClock()

  const resultMode = mapView === "results"
  const explorerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const dismiss = () => setHoveredCode(null)
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") dismiss() }

    window.addEventListener("keydown", escape)
    return () => {

      window.removeEventListener("keydown", escape)
    }
  }, [])
  const directoryCode = selectedCode ?? hoveredCode
  const directoryName = directoryCode ? stateNameForCode(directoryCode) : null
  const directoryRaces = RACES.filter((race) => race.code === directoryCode)
  const namedPollsters = Array.from(
    new Set(
      Object.values(pollingDetails).flatMap((detail) =>
        pollingDetailPollsters(detail),
      ),
    ),
  )
  const pollingCopy = {
    title: "Polling averages",
    status: namedPollsters.length
      ? `${namedPollsters.length} named pollsters loaded`
      : pollingProvider.status === "loading"
        ? "Loading named pollsters"
        : "Pollster details unavailable",
    detail: namedPollsters.length
      ? `Recent sources include ${namedPollsters.slice(0, 4).join(", ")}${namedPollsters.length > 4
        ? ` and ${namedPollsters.length - 4} more`
        : ""
      }.`
      : "Race averages and named survey rows appear only after validation.",
  }

  return (
    <section className="map-card" aria-labelledby="senate-map-title">
      <div className="map-card-heading">
        <div>
          <p className="eyebrow">National Senate explorer · all 50 states</p>
          <h2 id="senate-map-title">2026 U.S. Senate</h2>
          <p>
            Track polling, live results, and poll closings.
          </p>
        </div>
        <div className="map-source-summary">
          <span>Current view</span>
          <strong>{mapView === "closings" ? "Scheduled regional closings · 270toWin · Eastern Time" : resultMode ? `D minus R vote percentage points · Open America · ${formatProviderTime(resultsFeed?.as_of ?? null)}` : "D minus R party polling average percentage points · PollingSource · publication dates in state details"}</strong>
        </div>
      </div>

      <MapViewTabs office="Senate" view={mapView} onChange={view => { setMapView(view); onViewChange?.(view) }} />
      <ProviderNotice label="Senate polling" error={pollingProvider.error} />
      <PollClosings compact />
      <div className="map-layout">
        <div className="geographic-map-wrap">
          <svg
            aria-label="Interactive map of all 50 states and 2026 U.S. Senate races"
            className="geographic-map"
            role="group"
            viewBox={usaMap.viewBox}
          >
            {mapView === "closings" && <ClosingDefs locations={usaMap.locations as MapLocation[]} now={now} prefix="senate-closing" />}
            {(usaMap.locations as MapLocation[])
              .filter((location) => location.id !== "dc")
              .map((location) => {
                const code = location.id.toUpperCase()
                const race = RACES.find((item) => item.code === code)
                const saved = race ? savedIds.includes(race.id) : false
                const pollingRace = race && pollingReady
                  ? matchPollingRace(pollingReady, code, race.seat === "SP")
                  : undefined
                const resultForState = race ? resultsFeed?.races[`${code}-${race.seat}`] : undefined
                const resultLead = resultForState && resultForState.total > 0 ? resultForState.leader : null
                const leader = resultMode ? resultLead : pollingLeader(pollingRace)
                const mapMargin = resultMode ? voteMargin(resultForState) : margin(pollingRace?.dem_average, pollingRace?.rep_average)
                const description = !race ? `${location.name}: ${NO_SENATE_ELECTION}` : resultMode
                  ? resultForState?.total ? `${location.name}: ${resultForState.total.toLocaleString()} reported Senate votes; no race call` : `${location.name}: no Senate vote totals available in the connected feed`
                  : pollingRace
                    ? `${location.name}: ${isTossUp(pollingRace)
                      ? `PollingSource rating toss-up, ${pollingRace.margin_label}`
                      : `polling average ${pollingRace.margin_label ?? "has no margin"}`
                    }${race ? "; dashboard race configured" : ""}`
                    : `${location.name}: no validated Senate polling`
                const ballotDescription = SENATE_DIRECTORY[code]?.candidates.map((c) => `${c.name} (${c.party})`).join("; ") ?? NO_SENATE_ELECTION
                return (
                  <path
                    style={{ fill: race ? marginColor(mapMargin) : "#454951", ...closingStyle(location.name, now, mapView, "senate-closing") }}
                    aria-label={`${location.name}: ${ballotDescription}. ${mapView === "closings" ? closingStatus(location.name, now) : `${description}. ${resultMode ? "Votes" : "Polling"}: ${marginLabel(mapMargin)}`}`}
                    aria-describedby={hoveredCode === code ? "senate-state-tooltip" : undefined}
                    className={`map-state ${resultMode ? "live-results-state" : ""} ${race ? "configured" : "no-election"} ${saved ? "watched" : ""
                      } ${partyClass(leader)} ${selectedCode === code ? "selected" : ""} ${mapView === "closings" ? "closing-state" : ""}`}
                    clipPath={mapView === "closings" ? `url(#senate-closing-clip-${location.id})` : undefined}
                    d={location.path}
                    key={location.id}
                    onClick={event => { setSelectedCode(code); popup.show(code, event.currentTarget, true) }}
                    onPointerEnter={event => { if (event.pointerType !== 'touch') popup.show(code, event.currentTarget) }}
                    onPointerLeave={popup.leave}
                    onFocus={event => popup.show(code, event.currentTarget)}
                    onBlur={popup.leave}
                    onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedCode(code); popup.show(code, event.currentTarget, true) } }}
                    role="button"
                    aria-pressed={selectedCode === code}
                    tabIndex={0}
                  >

                  </path>
                )
              })}
          </svg>
        </div>

      {mapView === "results" && <LiveElectionStatus office="Senate" feed={resultsFeed} states={SENATE_STATES} success={resultsSuccess} next={resultsNext} error={resultsError} />}
        <aside className="map-legend" aria-live="polite">{mapView === "closings" ? <ClosingLegend now={now}/> : <MarginLegend/>}
          {mapView !== "closings" && <>
          <p className="eyebrow">{resultMode ? "Election results" : pollingCopy.title}</p>
          <strong>{resultMode ? (resultsFeed?.counting ? "Reported vote totals" : "Awaiting reported votes") : pollingCopy.status}</strong>
          <p>{resultMode ? `Open America covers participating states only. ${resultsFeed?.as_of ? `Source updated ${formatProviderTime(resultsFeed.as_of)}.` : "No results timestamp available."} No races are called by this feed.` : pollingCopy.detail}</p>
          <div className="legend-key"><span>Slate · verified D/R margin unavailable</span></div>
          <div className="legend-key"><span>Gray · no 2026 Senate election</span></div>
          {!resultMode && <div className="legend-key"><span>Outline · saved or selected race</span></div>}
          </>}
        </aside>
      </div>
      {hoveredCode && <ElectionMapPopup id="senate-state-tooltip" state={stateNameForCode(hoveredCode)} office="U.S. Senate" view={mapView} popup={popup} now={now} updatedAt={resultsSuccess} stale={mapView === 'results' ? !!resultsError || resultsFeed?.stale : !!pollingProvider.error} onDetails={() => { setSelectedCode(hoveredCode); popup.close(); requestAnimationFrame(() => explorerRef.current?.focus()) }} races={RACES.filter(r => r.code === hoveredCode).map(r => ({ label: r.seat === 'SP' ? 'Special election' : 'Regular election', result: resultsFeed?.races[`${r.code}-${r.seat}`], poll: pollingReady ? matchPollingRace(pollingReady, hoveredCode, r.seat === 'SP') : undefined, candidates: SENATE_DIRECTORY[hoveredCode]?.candidates ?? [] }))} />}
      <div className="senate-state-explorer" aria-live="polite" ref={explorerRef} tabIndex={-1} role="region" aria-label={directoryName ? `${directoryName} Senate candidate profiles` : "Senate candidate profiles"}>
        <div className="senate-state-explorer-heading">
          <div>
            <p className="eyebrow">State-by-state Senate directory</p>
            <h3>{directoryName ?? "Select a state on the map"}</h3>
            <p>{selectedCode ? "Selected state · candidate profiles" : hoveredCode ? "Hover preview · click to pin this state" : "Explore available 2026 U.S. Senate races"}</p>
          </div>
          {selectedCode && <button className="text-button" type="button" onClick={() => { setSelectedCode(null); setHoveredCode(null) }}>Clear selection</button>}
        </div>
        {directoryCode && directoryRaces.length > 0 ? (
          <div className="senate-state-races">
            {directoryRaces.map((race) => {
              const polling = pollingReady?.find((item) => item.state === race.code && item.is_special === (race.seat === "SP"))
              const configured = RACES.some((item) => item.id === race.id)
              const detail = pollingDetails[race.id]
              const result = resultsFeed?.races[`${race.code}-${race.seat}`]
              const candidates = getRaceCandidates(race, detail, matchForecastRace(forecastRows, race.code, race.seat === "SP"), result)
              return (
                <article className="senate-state-race" key={race.id}>
                  <div>
                    <strong>U.S. Senate · {race.seat === "SP" ? "Special election" : "Regular election"}</strong>
                    <span>{polling?.rating ? `Provider rating: ${polling.rating}` : "No provider race rating"}</span>
                    {candidates.length ? <span>{candidates.map((candidate) => `${candidate.name} (${candidate.party})`).join(" · ")}</span> : <span>Candidate information not available from connected sources</span>}
                    {resultMode && result && <span>{result.cands.map((candidate) => `${candidate.n} · ${candidate.v.toLocaleString()} votes`).join(" · ")}</span>}
                    <span>{closingStatus(race.state, now)}</span>
                    {resultMode && <span>{!result ? !RESULTS_COVERAGE.has(race.code) ? "Connected provider does not cover this state. The Senate race remains available in the directory." : "State supported, but race absent from this snapshot; reporting may not have started. No verified vote totals available." : result.total === 0 ? "Reporting has not started in the connected snapshot." : `${result.pct_in ?? "Unknown"}% reporting (provider units) · Leading, not called · ${marginLabel(voteMargin(result))}`}</span>}
                    <span>{polling ? `Polling averages: D ${formatPercent(polling.dem_average)} · R ${formatPercent(polling.rep_average)}` : "Polling data not available"}</span>
                  </div>
                  {configured ? (
                    <button type="button" className="button secondary" onClick={() => onOpenRace(race)}>Race details</button>
                  ) : polling?.page ? (
                    <a className="button secondary" href={polling.page} target="_blank" rel="noopener noreferrer">Provider details</a>
                  ) : null}
                  <p className="senate-state-note">Polling: {marginLabel(margin(polling?.dem_average, polling?.rep_average))} · Latest poll publication: {polling?.last_poll_date ?? "Unavailable"} · {polling ? <ExternalLink href={polling.page}>PollingSource</ExternalLink> : "No verified polling source available"}</p>
                  <CandidateProfiles code={race.code} polling={polling} result={resultMode ? result : undefined} updatedAt={resultsFeed?.as_of} />
                </article>
              )
            })}
          </div>
        ) : directoryCode ? (
          <p className="senate-state-empty">{NO_SENATE_ELECTION} The state remains on the map; this does not describe House, state, or local elections.</p>
        ) : (
          <p className="senate-state-empty">Move over a state, use the Tab key to focus it, or click a state to see available Senate races.</p>
        )}
        <p className="senate-state-note">Candidate identities come from a separate, sourced general-election directory covering all 35 elections, checked November 3, 2026. Polling and forecast scenarios never determine ballot eligibility. Missing photographs use neutral placeholders.</p>
      </div>
      <p className="map-footnote">
        Election roster: <ExternalLink href="https://www.fec.gov/resources/cms-content/documents/2026pdates.pdf">FEC 2026 election schedule</ExternalLink> · 33 regular elections and Florida/Ohio specials. Open a state for its source-specific detail view. Map
        geometry: @svg-maps/usa, CC BY-NC 4.0.
      </p>
    </section>
  )
}

function trendPoints(points: Array<[string, number]>) {
  if (points.length < 2) return ""
  const values = points.map(([, value]) => value)
  const low = Math.min(...values, 30) - 2
  const high = Math.max(...values, 60) + 2
  return points
    .map(([, value], index) => {
      const x = (index / (points.length - 1)) * 600
      const y = 170 - ((value - low) / Math.max(high - low, 1)) * 150
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
}

function PollingDetailPanel({
  load,
  summary,
}: {
  load: DetailLoad<PollingDetail>
  summary?: PollingRace
}) {
  if (load.status === "loading") {
    return (
      <div className="provider-panel">
        <p className="eyebrow">PollingSource</p>
        <h3>Loading race polling</h3>
        <p>The race-specific average and survey rows are being validated.</p>
      </div>
    )
  }
  if (load.status === "error" || !load.data) {
    return (
      <ProviderState
        eyebrow="PollingSource unavailable"
        href={summary?.page ?? PROVIDERS.polling.href}
        linkLabel="Open PollingSource"
        title="Race polling could not be loaded"
      >
        {load.error ??
          "No validated race detail response is available for this contest."}
      </ProviderState>
    )
  }

  const detail = load.data
  const race = detail.race
  const demName =
    detail.average_trend.labels.democrat ||
    detail.recent_polls.polls[0]?.dem_candidate ||
    "Democratic candidate"
  const repName =
    detail.average_trend.labels.republican ||
    detail.recent_polls.polls[0]?.rep_candidate ||
    "Republican candidate"

  return (
    <>
      <div className="live-average">
        <div className="average-candidate dem">
          <span>{demName}</span>
          <strong>{formatPercent(race.dem_average)}</strong>
          <small>Democratic</small>
        </div>
        <div className="average-margin">
          <span>Polling margin</span>
          <strong>{race.margin_label ?? "—"}</strong>
          <small>{race.poll_count} polls in average</small>
        </div>
        <div className="average-candidate rep">
          <span>{repName}</span>
          <strong>{formatPercent(race.rep_average)}</strong>
          <small>Republican</small>
        </div>
      </div>
      <div className="average-bar" aria-label="Polling average comparison">
        <span
          className="dem"
          style={{ width: `${Math.max(race.dem_average ?? 0, 0)}%` }}
        />
        <span
          className="rep"
          style={{ width: `${Math.max(race.rep_average ?? 0, 0)}%` }}
        />
      </div>

      {detail.average_trend.democrat.length > 1 &&
        detail.average_trend.republican.length > 1 && (
          <section className="trend-section">
            <div className="data-section-heading">
              <div>
                <p className="eyebrow">Polling average over time</p>
                <h3>Trend</h3>
              </div>
              <span>
                Through {race.last_poll_date ?? "latest available poll"}
              </span>
            </div>
            <svg
              aria-label={`Polling trend for ${demName} and ${repName}`}
              className="trend-chart"
              role="img"
              viewBox="0 0 600 180"
            >
              <line
                className="trend-gridline"
                x1="0"
                x2="600"
                y1="90"
                y2="90"
              />
              <polyline
                className="trend-line dem"
                points={trendPoints(detail.average_trend.democrat)}
              />
              <polyline
                className="trend-line rep"
                points={trendPoints(detail.average_trend.republican)}
              />
            </svg>
            <div className="trend-legend">
              <span className="dem">{demName}</span>
              <span className="rep">{repName}</span>
            </div>
          </section>
        )}

      <section className="survey-section">
        <div className="data-section-heading">
          <div>
            <p className="eyebrow">Source surveys</p>
            <h3>Recent polls</h3>
          </div>
          <span>{detail.recent_polls.note}</span>
        </div>
        <div className="survey-table-wrap">
          <table className="survey-table">
            <thead>
              <tr>
                <th>Pollster</th>
                <th>Fieldwork end</th>
                <th>Sample</th>
                <th className="dem">D</th>
                <th className="rep">R</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {detail.recent_polls.polls.map((poll) => (
                <tr key={`${poll.pollster}-${poll.end_date}`}>
                  <td>
                    <strong>{poll.pollster}</strong>
                    <small>{poll.population ?? "Population unavailable"}</small>
                  </td>
                  <td>{poll.end_date}</td>
                  <td>{poll.sample_size?.toLocaleString() ?? "—"}</td>
                  <td className="dem">
                    {poll.dem_pct ? `${poll.dem_pct}%` : "—"}
                  </td>
                  <td className="rep">
                    {poll.rep_pct ? `${poll.rep_pct}%` : "—"}
                  </td>
                  <td>
                    <ExternalLink href={poll.source_url}>Original</ExternalLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="dataset-attribution">
          <span>{detail.attribution.cite_as}</span>
          <ExternalLink href={detail.attribution.methodology}>
            Methodology
          </ExternalLink>
        </div>
      </section>
    </>
  )
}

function ForecastDetailPanel({
  load,
  summary,
}: {
  load: DetailLoad<ForecastDetail>
  summary?: ForecastRace
}) {
  if (load.status === "loading") {
    return (
      <div className="provider-panel">
        <p className="eyebrow">Modeled forecast</p>
        <h3>Loading model projection</h3>
        <p>Probability and uncertainty fields are being validated.</p>
      </div>
    )
  }
  if (load.status === "error" || !load.data) {
    return (
      <ProviderState
        eyebrow="Polling Forecast unavailable"
        href={PROVIDERS.forecast.href}
        linkLabel="Open data documentation"
        title="Model projection could not be loaded"
      >
        {load.error ??
          "No validated forecast response is available for this contest."}
      </ProviderState>
    )
  }

  const detail = load.data
  const race = detail.race
  const leftChance = race.chance_left * 100
  const rightChance = 100 - leftChance
  const racePage = `https://www.pollingforecast.com${race.page}`

  return (
    <>
      <div className="forecast-callout">
        <strong>Modeled projection—not a polling average</strong>
        <span>
          Probability reflects model assumptions and uncertainty as of{" "}
          {detail.asOf}.
        </span>
      </div>
      <div className="live-average forecast">
        <div className="average-candidate dem">
          <span>{race.left_candidate}</span>
          <strong>{leftChance.toFixed(1)}%</strong>
          <small>Modeled win probability</small>
        </div>
        <div className="average-margin">
          <span>Model rating</span>
          <strong>{race.rating}</strong>
          <small>{race.polls_used} polls used by model</small>
        </div>
        <div className="average-candidate rep">
          <span>{race.rep_candidate}</span>
          <strong>{rightChance.toFixed(1)}%</strong>
          <small>Modeled win probability</small>
        </div>
      </div>
      <div
        className="average-bar forecast"
        aria-label="Modeled win probability"
      >
        <span className="dem" style={{ width: `${leftChance}%` }} />
        <span className="rep" style={{ width: `${rightChance}%` }} />
      </div>
      <div className="uncertainty-row">
        <div>
          <span>Best-bet modeled margin</span>
          <strong>{race.best_bet_margin.toFixed(1)}</strong>
        </div>
        <div>
          <span>80% model range</span>
          <strong>
            {race.range80_low.toFixed(1)} to {race.range80_high.toFixed(1)}
          </strong>
        </div>
        <div>
          <span>Row licence</span>
          <strong>{race.licence}</strong>
        </div>
      </div>
      <section className="survey-section">
        <div className="data-section-heading">
          <div>
            <p className="eyebrow">Model inputs</p>
            <h3>Recent source polls</h3>
          </div>
          <span>
            Poll rows retain their own source links and licence metadata.
          </span>
        </div>
        <div className="survey-table-wrap">
          <table className="survey-table forecast-polls">
            <thead>
              <tr>
                <th>Pollster</th>
                <th>Fieldwork</th>
                <th>Sample</th>
                <th>Published figures</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {detail.polls.slice(0, 8).map((poll) => (
                <tr key={poll.poll_id}>
                  <td>
                    <strong>{poll.pollster}</strong>
                    <small>{poll.sponsor ?? poll.source_grade ?? "—"}</small>
                  </td>
                  <td>{poll.fieldwork_end}</td>
                  <td>{poll.sample?.toLocaleString() ?? "—"}</td>
                  <td>{poll.figures}</td>
                  <td>
                    <ExternalLink href={poll.source_url}>Original</ExternalLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="dataset-attribution">
          <span>Polling Forecast · row licence: {race.licence}</span>
          <ExternalLink href={racePage}>Open race model</ExternalLink>
        </div>
      </section>
    </>
  )
}


function RelationshipGraph({
  articles,
  candidateNames,
}: {
  articles: ArticleBookmark[]
  candidateNames: string[]
}) {
  const article = articles[0]
  const candidate =
    article?.candidateName &&
      candidateNames.some((name) => name === article.candidateName)
      ? article.candidateName
      : null
  return (
    <section
      className="relationship-panel"
      aria-labelledby="relationship-title"
    >
      <div className="relationship-heading">
        <div className="provider-icon">
          <Icon name="network" size={22} />
        </div>
        <div>
          <p className="eyebrow">Source relationships</p>
          <h3 id="relationship-title">Candidate → story → publisher</h3>
        </div>
      </div>
      <div className="relationship-graph" aria-hidden="true">
        <div className="graph-node">
          <span>Candidate</span>
          <strong>{candidate ?? "No validated story link"}</strong>
        </div>
        <span className={candidate ? "graph-line" : "graph-line absent"} />
        <div className="graph-node">
          <span>Story</span>
          <strong>{article?.title ?? "No saved race story"}</strong>
        </div>
        <span className="graph-line" />
        <div className="graph-node">
          <span>Publisher</span>
          <strong>{article?.outlet ?? "Appears with a story"}</strong>
        </div>
      </div>
      <p className="relationship-copy">
        {article
          ? candidate
            ? "This relationship uses an exact provider-listed candidate name and a user-saved canonical story URL. It does not imply endorsement or sentiment."
            : "The saved story and publisher are linked by the canonical URL. No candidate edge is claimed without an exact provider-listed candidate association."
          : "No edges are drawn until a verified candidate and a source-linked story share a validated relationship. The graph never infers endorsement or sentiment."}
      </p>
      {articles.length > 1 && (
        <p className="relationship-copy">
          Showing the newest saved relationship. {articles.length - 1} more
          race-linked {articles.length === 2 ? "story is" : "stories are"}{" "}
          listed below.
        </p>
      )}
    </section>
  )
}

function ArticleList({
  articles,
  onDelete,
}: {
  articles: ArticleBookmark[]
  onDelete: (id: string) => void
}) {
  if (!articles.length) {
    return (
      <div className="article-empty">
        <Icon name="bookmark" />
        <div>
          <strong>No saved stories</strong>
          <p>
            Add a canonical publisher link manually. The dashboard does not
            generate headlines or article-volume metrics.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="article-list">
      {articles.map((article) => (
        <article className="article-row" key={article.id}>
          <div>
            <p className="eyebrow">
              {article.outlet} · {formatArticleDate(article.publishedDate)}
            </p>
            <h3>{article.title}</h3>
            {article.notes && <p>{article.notes}</p>}
            <div className="article-associations">
              {article.raceIds.map((id) => {
                const race = RACES.find((item) => item.id === id)
                return race ? <span key={id}>{race.code} Senate</span> : null
              })}
              {article.candidateName && (
                <span>Candidate: {article.candidateName}</span>
              )}
            </div>
          </div>
          <div className="article-actions">
            <ExternalLink href={article.url}>Open publisher</ExternalLink>
            <button
              className="text-button danger"
              onClick={() => onDelete(article.id)}
              type="button"
            >
              Remove
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

function ImportedNewsList({ snapshot }: { snapshot: NewsSnapshot | null }) {
  if (!snapshot?.articles.length) {
    return (
      <div className="article-empty">
        <Icon name="database" />
        <div>
          <strong>No imported snapshot</strong>
          <p>
            Paste a GNews JSON response to preview publisher-linked stories.
            Nothing here is presented as a live feed.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="imported-news-list">
      {snapshot.articles.map((story) => (
        <article className="imported-news-row" key={story.id}>
          <div>
            <p className="eyebrow">
              {story.source.name} · {formatProviderTime(story.publishedAt)}
            </p>
            <h3>{story.title}</h3>
            {story.description && <p>{story.description}</p>}
          </div>
          <ExternalLink href={story.url}>Open publisher</ExternalLink>
        </article>
      ))}
    </div>
  )
}

function PublicVoicesDirectory() {
  return (
    <section className="voices-section" aria-labelledby="voices-title">
      <div className="voices-heading">
        <div>
          <p className="eyebrow">Commentary and influence</p>
          <h2 id="voices-title">Public voices watch</h2>
          <p>
            Popularity is not reliability. Positions appear only when supported
            by a dated, direct source and remain separate from reported facts.
          </p>
        </div>
        <span className="source-state">
          <span aria-hidden="true" />
          No positions recorded
        </span>
      </div>
      <div className="voices-grid">
        {PUBLIC_VOICES.map((voice) => (
          <article className="voice-card" key={voice.name}>
            <div
              aria-describedby={`voice-${voice.initials}`}
              className="voice-avatar"
              tabIndex={0}
            >
              {voice.initials}
              <span className="identity-popover" id={`voice-${voice.initials}`}>
                {voice.identity}
              </span>
            </div>
            <div className="voice-content">
              <p className="eyebrow">{voice.kind}</p>
              <h3>{voice.name}</h3>
              <dl>
                <div>
                  <dt>Position source</dt>
                  <dd>{voice.positionSource}</dd>
                </div>
                <div>
                  <dt>Audience reach</dt>
                  <dd>Not imported</dd>
                </div>
                <div>
                  <dt>Profile status</dt>
                  <dd>{voice.profileDate}</dd>
                </div>
                <div>
                  <dt>Ad Fontes</dt>
                  <dd>{voice.adFontes}</dd>
                </div>
              </dl>
              <ExternalLink href={voice.href}>
                Open official source
              </ExternalLink>
              {voice.transparencyHref && (
                <ExternalLink href={voice.transparencyHref}>
                  Open outlet methodology
                </ExternalLink>
              )}
            </div>
          </article>
        ))}
      </div>
      <div className="voices-method">
        <strong>Inclusion rule</strong>
        <span>
          Outlets, hosts, journalists, and online creators may be tracked.
          Political identity, endorsement, opposition, and audience size each
          require their own source and date. Ad Fontes outlet ratings are never
          applied to individuals.
        </span>
      </div>
    </section>
  )
}

export default function App() {
  const guardianNews = useGuardianNews()
  const [page, setPage] = useState<Page>("home")
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>("results")
  const [office, setOffice] = useState<"Senate" | "Governor">("Senate")
  const [mode, setMode] = useState<"polling" | "election">("election")
  const [theme, setTheme] = useState<Theme>(loadTheme)
  const [predictions, setPredictions] =
    useState<PredictionState>(loadPredictions)
  const [watchlist, setWatchlist] = useState<WatchlistState>(loadWatchlist)
  const [articles, setArticles] = useState<ArticleState>(loadArticles)
  const [articleDraft, setArticleDraft] =
    useState<ArticleDraft>(EMPTY_ARTICLE_DRAFT)
  const [newsSnapshot, setNewsSnapshot] = useState<NewsSnapshot | null>(
    loadNewsSnapshot,
  )
  const [newsJson, setNewsJson] = useState("")
  const [pollingProvider, setPollingProvider] =
    useState<ProviderLoad<PollingRace[]>>({ ...EMPTY_PROVIDER })
  const [forecastProvider, setForecastProvider] =
    useState<ProviderLoad<ForecastDataset>>({ ...EMPTY_PROVIDER })
  const [pollingDetail, setPollingDetail] = useState<DetailLoad<PollingDetail>>(
    { ...EMPTY_PROVIDER, raceId: null },
  )
  const [forecastDetail, setForecastDetail] =
    useState<DetailLoad<ForecastDetail>>({ ...EMPTY_PROVIDER, raceId: null })
  const [pollingDetails, setPollingDetails] =
    useState<Record<string, PollingDetail>>({})
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "saved" | "suggested">("all")
  const [notice, setNotice] = useState<string | null>(null)
  const pollingBusy = useRef(false)
  const pollingDue = useRef(0)
  const [resultsNext, setResultsNext] = useState(Date.now())
  const [pollingNext, setPollingNext] = useState(Date.now() + 900000)
  const [resultsLoad, setResultsLoad] = useState<ProviderLoad<SenateResultsFeed>>({ ...EMPTY_PROVIDER })
  useEffect(() => {
    let mounted = true
    let delay = 60_000
    let timer: number
    const refresh = async () => {
      if (document.hidden) { timer = window.setTimeout(refresh, delay); return }
      try {
        const data = await fetchSenateResults()
        delay = !Object.keys(data.races).length || data.final ? 600_000 : 60_000
        if (mounted) setResultsLoad(current => ({ status: "success", data, lastSuccess: data.stale ? current.lastSuccess : new Date().toISOString(), error: null }))
      } catch (error) {
        delay = Math.min(delay * 2, 600_000)
        if (mounted) setResultsLoad((current) => ({ ...current, status: "error", error: errorMessage(error) }))
      }
      if (mounted) { setResultsNext(Date.now() + delay); timer = window.setTimeout(refresh, delay) }
    }
    void refresh()
    return () => { mounted = false; window.clearTimeout(timer) }
  }, [])

  const loadProviderData = async (announce: boolean) => {
    if (pollingBusy.current || document.hidden) return
    pollingBusy.current = true
    setPollingProvider((current) => ({ ...current, status: "loading" }))
    setForecastProvider((current) => ({ ...current, status: "loading" }))
    const [pollingResult, forecastResult] = await Promise.allSettled([
      fetchPollingRaces(),
      fetchForecastRaces(),
    ])
    pollingBusy.current = false
    pollingDue.current = Date.now() + 900000
    setPollingNext(pollingDue.current)
    const completedAt = new Date().toISOString()
    if (pollingResult.status === "fulfilled") {
      setPollingProvider({
        status: "success",
        data: pollingResult.value,
        lastSuccess: completedAt,
        error: null,
      })
    } else {
      setPollingProvider((current) => ({
        ...current,
        status: "error",
        error: errorMessage(pollingResult.reason),
      }))
    }
    if (forecastResult.status === "fulfilled") {
      setForecastProvider({
        status: "success",
        data: forecastResult.value,
        lastSuccess: completedAt,
        error: null,
      })
    } else {
      setForecastProvider((current) => ({
        ...current,
        status: "error",
        error: errorMessage(forecastResult.reason),
      }))
    }
    if (announce) {
      const successful =
        Number(pollingResult.status === "fulfilled") +
        Number(forecastResult.status === "fulfilled")
      setNotice(
        successful === 2
          ? "PollingSource and Polling Forecast refreshed."
          : successful === 1
            ? "One provider refreshed; one provider reported an error."
            : "Polling providers could not be refreshed.",
      )
    }
  }

  useEffect(() => {
    const refreshDue = () => {
      if (!document.hidden && Date.now() >= pollingDue.current) void loadProviderData(false)
    }
    refreshDue()
    const timer = window.setInterval(refreshDue, 1000)
    document.addEventListener('visibilitychange', refreshDue)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refreshDue) }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist))
  }, [watchlist])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // Theme remains available for the current session when storage is blocked.
    }
  }, [theme])

  useEffect(() => {
    try {
      localStorage.setItem(PREDICTIONS_KEY, JSON.stringify(predictions))
    } catch {
      // Private predictions remain in memory when storage is unavailable.
    }
  }, [predictions])

  useEffect(() => {
    try {
      localStorage.setItem(ARTICLES_KEY, JSON.stringify(articles))
    } catch {
      // Saved articles remain available in memory when storage is unavailable.
    }
  }, [articles])

  useEffect(() => {
    try {
      if (newsSnapshot) {
        localStorage.setItem(NEWS_SNAPSHOT_KEY, JSON.stringify(newsSnapshot))
      } else {
        localStorage.removeItem(NEWS_SNAPSHOT_KEY)
      }
    } catch {
      // Imported news remains available in memory when storage is unavailable.
    }
  }, [newsSnapshot])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), 3200)
    return () => window.clearTimeout(timeout)
  }, [notice])

  useEffect(() => {
    if (!detailId) return
    const race = RACES.find((item) => item.id === detailId)
    if (!race) return
    const isSpecial = race.seat === "SP"
    const pollingSummary = pollingProvider.data
      ? matchPollingRace(pollingProvider.data, race.code, isSpecial)
      : undefined
    const forecastSummary = forecastProvider.data
      ? matchForecastRace(forecastProvider.data.rows, race.code, isSpecial)
      : undefined
    let cancelled = false

    if (pollingSummary) {
      setPollingDetail({
        status: "loading",
        data: null,
        lastSuccess: null,
        error: null,
        raceId: race.id,
      })
      void fetchPollingDetail(pollingSummary.detail)
        .then((data) => {
          if (!cancelled) {
            setPollingDetail({
              status: "success",
              data,
              lastSuccess: new Date().toISOString(),
              error: null,
              raceId: race.id,
            })
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setPollingDetail({
              status: "error",
              data: null,
              lastSuccess: null,
              error: errorMessage(error),
              raceId: race.id,
            })
          }
        })
    } else if (pollingProvider.status === "success") {
      setPollingDetail({
        status: "error",
        data: null,
        lastSuccess: null,
        error:
          "PollingSource returned no matching regular/special Senate race.",
        raceId: race.id,
      })
    }

    if (forecastSummary) {
      setForecastDetail({
        status: "loading",
        data: null,
        lastSuccess: null,
        error: null,
        raceId: race.id,
      })
      void fetchForecastDetail(forecastSummary.key)
        .then((data) => {
          if (!cancelled) {
            setForecastDetail({
              status: "success",
              data,
              lastSuccess: new Date().toISOString(),
              error: null,
              raceId: race.id,
            })
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setForecastDetail({
              status: "error",
              data: null,
              lastSuccess: null,
              error: errorMessage(error),
              raceId: race.id,
            })
          }
        })
    } else if (forecastProvider.status === "success") {
      setForecastDetail({
        status: "error",
        data: null,
        lastSuccess: null,
        error:
          "Polling Forecast returned no matching regular/special Senate race.",
        raceId: race.id,
      })
    }

    return () => {
      cancelled = true
    }
  }, [detailId, pollingProvider.data, forecastProvider.data])

  useEffect(() => {
    if (!pollingProvider.data) return
    let cancelled = false
    const matches = pollingProvider.data.map((summary) => ({
      id: pollingRaceId(summary),
      summary,
    }))

    void (async () => {
      const loaded: Record<string, PollingDetail> = {}
      for (let index = 0; index < matches.length; index += 4) {
        const batch = matches.slice(index, index + 4)
        const results = await Promise.allSettled(
          batch.map(({ summary }) => fetchPollingDetail(summary.detail)),
        )
        results.forEach((result, resultIndex) => {
          if (result.status === "fulfilled") {
            loaded[batch[resultIndex].id] = result.value
          }
        })
      }
      if (!cancelled) setPollingDetails(loaded)
    })()

    return () => {
      cancelled = true
    }
  }, [pollingProvider.data])

  const savedRaces = useMemo(
    () =>
      watchlist.savedIds
        .map((id) => RACES.find((race) => race.id === id))
        .filter((race): race is Race => Boolean(race)),
    [watchlist.savedIds],
  )

  const navigate = (nextPage: Page) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const openRace = (id: string) => {
    setDetailId(id)
    setDetailTab("results")
    navigate("detail")
  }

  const openRaceMetric = (race: Race, metric: MapMetric) => {
    setDetailId(race.id)
    setDetailTab(metric)
    setMode(metric === "results" ? "election" : "polling")
    navigate("detail")
  }

  const toggleSaved = (id: string) => {
    const race = RACES.find((item) => item.id === id)
    const isSaved = watchlist.savedIds.includes(id)
    setWatchlist((current) => ({
      ...current,
      savedIds: isSaved
        ? current.savedIds.filter((savedId) => savedId !== id)
        : [...current.savedIds, id],
      assignments: { ...current.assignments, [id]: null },
    }))
    setNotice(
      `${race?.state ?? "Race"} ${isSaved ? "removed from" : "added to"
      } your watchlist.`,
    )
  }

  const moveRace = (id: string, tier: number | null) => {
    setWatchlist((current) => ({
      ...current,
      assignments: { ...current.assignments, [id]: tier },
    }))
    const race = RACES.find((item) => item.id === id)
    setNotice(
      `${race?.state ?? "Race"} moved to ${tier === null ? "Unassigned" : `Tier ${tier + 1}`
      }.`,
    )
  }

  const renameTier = (index: number, name: string) => {
    setWatchlist((current) => ({
      ...current,
      tierNames: current.tierNames.map((currentName, currentIndex) =>
        currentIndex === index ? name : currentName,
      ),
    }))
  }

  const onDrop = (event: React.DragEvent, tier: number | null) => {
    event.preventDefault()
    const id = event.dataTransfer.getData("text/race-id")
    if (watchlist.savedIds.includes(id)) moveRace(id, tier)
  }

  const requestRefresh = () => {
    void loadProviderData(true)
  }

  const saveArticle = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const url = canonicalUrl(articleDraft.url.trim())
      if (
        articles.items.some(
          (article) =>
            canonicalUrl(article.url).toLowerCase() === url.toLowerCase(),
        )
      ) {
        setNotice("That canonical article URL is already saved.")
        return
      }
      const bookmark: ArticleBookmark = {
        ...articleDraft,
        id:
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `article-${Date.now()}`,
        title: articleDraft.title.trim(),
        outlet: articleDraft.outlet.trim(),
        url,
        notes: articleDraft.notes.trim(),
        candidateName: articleDraft.candidateName.trim(),
        savedAt: new Date().toISOString(),
      }
      setArticles((current) => ({
        ...current,
        items: [bookmark, ...current.items],
      }))
      setArticleDraft(EMPTY_ARTICLE_DRAFT)
      setNotice("Article saved to this browser.")
    } catch (error) {
      setNotice(errorMessage(error))
    }
  }

  const deleteArticle = (id: string) => {
    setArticles((current) => ({
      ...current,
      items: current.items.filter((article) => article.id !== id),
    }))
    setNotice("Saved article removed.")
  }

  const importNews = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const snapshot = parseNewsSnapshot(newsJson)
      setNewsSnapshot(snapshot)
      setNewsJson("")
      setNotice(
        `${snapshot.articles.length} news ${snapshot.articles.length === 1 ? "story" : "stories"
        } imported as a local snapshot.`,
      )
    } catch (error) {
      setNotice(errorMessage(error))
    }
  }

  const navItems: Array<[Page, string]> = [
    ["home", "Senate Map"],
    ["watchlist", "My Watchlist"],
    ["races", "All Senate Races"],
    ["media", "Media Sources"],
    ["settings", "Methodology & Settings"],
  ]

  const [selectedMapState, setSelectedMapState] = useState<string | null>(null)
  const [directoryView, setDirectoryView] = useState<"polling" | "results" | "closings">("results")
  const [directorySort, setDirectorySort] = useState("alpha")
  const directoryNow = useElectionClock()
  const renderHome = () => {
    const locations = (usaMap.locations as MapLocation[]).filter((location) => location.id !== "dc")
    const rows = locations.map((location) => {
      const code = location.id.toUpperCase()
      const race = RACES.find((race) => race.code === code)
      const polling = (pollingProvider.data ?? []).filter((row) => row.state === code && race && row.is_special === (race.seat === "SP"))
      const results = Object.entries(resultsLoad.data?.races ?? {}).filter(([key]) => key.toUpperCase().startsWith(code + "-"))
      return { code, race, state: location.name, polling, results, pollCount: polling.reduce((sum, item) => sum + (item.poll_count ?? 0), 0) }
    }).sort((a, b) => {
      const score = (row: typeof a) => directorySort === "closing" ? Math.min(...stateClosingHours(row.state).map(closingTime).filter(t => t > directoryNow)) : directorySort === "closest" ? Math.min(...row.polling.map(p => margin(p.dem_average, p.rep_average)).filter((v): v is number => v != null).map(Math.abs)) : directorySort === "featured" ? (DEFAULT_STATES.some(([, code]) => code === row.code) ? 0 : 1) : 0
      const av = score(a), bv = score(b)
      return (av === bv ? 0 : av < bv ? -1 : 1) || a.state.localeCompare(b.state)
    })
    return <>
      <div className="page-heading">
        <div><p className="eyebrow">Election night · November 3, 2026</p><h1>Poll Cat · U.S. Senate Map</h1><p className="subhead">Explore races across all 50 states.</p></div>
        <RefreshStatus label="Senate polling" next={pollingNext} success={pollingProvider.lastSuccess} interval={900000} failed={pollingProvider.status === "error"} /><RefreshStatus label="Senate results" next={resultsNext} success={resultsLoad.lastSuccess} interval={!Object.keys(resultsLoad.data?.races ?? {}).length || resultsLoad.data?.final ? 600000 : 60000} failed={resultsLoad.status === "error" || resultsLoad.data?.stale} /><button className="button secondary" type="button" onClick={requestRefresh}><Icon name="refresh" size={16} />Refresh polling</button>
      </div>
      <div className="live-feed-status" role="status">
        <strong>{resultsLoad.data?.stale || (resultsLoad.status === "error" && resultsLoad.data) ? "STALE RESULTS · refresh unavailable or delayed" : resultsLoad.data?.live ? "LIVE STATE REPORTS" : resultsLoad.status === "error" ? "RESULTS FEED UNAVAILABLE" : resultsLoad.data?.counting ? "Reported vote totals" : "Awaiting election-night vote totals"}</strong>
        <span>Official state election offices via <a href="https://openamerica.io/elections/api/" target="_blank" rel="noopener noreferrer">Open America</a> · {resultsLoad.data?.as_of ? `Source as of ${formatProviderTime(resultsLoad.data.as_of)}` : "No reported source timestamp"} · 22-state feed coverage, not a national race-call service.</span>
      </div>
      <div className="national-explorer-layout">
        <div>
          <SenateMap onViewChange={setDirectoryView} selectedState={selectedMapState} onSelectState={setSelectedMapState} onOpenRace={(race) => openRaceMetric(race, mode === "election" ? "results" : "polling")} pollingProvider={pollingProvider} pollingDetails={pollingDetails} savedIds={watchlist.savedIds} mode={mode} resultsFeed={resultsLoad.data} resultsSuccess={resultsLoad.lastSuccess} resultsNext={resultsNext} resultsError={resultsLoad.error} forecastRows={forecastProvider.data?.rows} />
          </div>
        <aside className="national-state-sidebar" aria-label="All 50 states and polling attention">
          <GuardianNews news={guardianNews} compact />
          <div className="national-state-sidebar-heading"><p className="eyebrow">National directory</p><h2>All 50 states</h2><p>35 election states (33 regular, 2 special); 15 without a Senate election. Choose a directory order below. Map color measures D/R margin, not a prediction.</p></div>
          <label className="directory-sort">Sort states<select value={directorySort} onChange={e => setDirectorySort(e.target.value)}><option value="alpha">Alphabetical: A–Z</option><option value="closing">Poll closing: Soonest first</option><option value="closest">Closest races</option><option value="featured">Featured races</option></select></label>
          <p className="directory-sort-note">{directorySort === "featured" ? "Editorial watchlist: the 14 states maintained in DEFAULT_STATES for focused coverage. Other states follow alphabetically; inclusion is not a popularity or importance score." : directorySort === "closest" ? "Comparable metric: absolute D/R polling-average difference. Missing margins follow measured races." : directorySort === "closing" ? "Next regional closing first. States with no upcoming scheduled closing follow." : "All 50 states, alphabetically."}</p>
          <div className="national-state-rows">
            {rows.map((row, index) => <button type="button" aria-pressed={selectedMapState === row.code} onClick={() => setSelectedMapState(row.code)} style={{borderLeftColor: directoryView === "closings" ? marginColor(null) : marginColor(directoryView === "results" ? voteMargin(row.results[0]?.[1]) : margin(row.polling[0]?.dem_average, row.polling[0]?.rep_average))}} className={`national-state-row ${row.race && watchlist.savedIds.includes(row.race.id) ? "bookmarked" : ""} ${row.polling.some(isTossUp) ? "tossup" : ""}`} key={row.code}>
              <span className="national-state-position">{index + 1}</span><StateSilhouette code={row.code} color={!row.race ? "#454951" : directoryView === "closings" ? marginColor(null) : marginColor(directoryView === "results" ? voteMargin(row.results[0]?.[1]) : margin(row.polling[0]?.dem_average, row.polling[0]?.rep_average))} />
              <div><strong>{row.state}{row.race && watchlist.savedIds.includes(row.race.id) ? " · ★" : ""}{stateClosingHours(row.state).includes(CLOSINGS.find(([h]) => closingTime(h) > directoryNow)?.[0] ?? -1) ? " · ◷ Next" : ""}</strong><small>{!row.race ? NO_SENATE_ELECTION : row.polling.length ? row.polling.map((r) => r.rating || "Unrated").join(" / ") : "Missing sorting data · polling unavailable"}</small><small>{closingStatus(row.state, directoryNow)}</small><small>{!row.race ? "" : row.results.some(([, r]) => r.total > 0) ? `${row.results.reduce((n, [, r]) => n + r.total, 0).toLocaleString()} votes reported` : "No reported vote count in feed"}</small></div>
              <span className="national-state-polls">{row.race ? marginLabel(directoryView === "results" ? voteMargin(row.results[0]?.[1]) : margin(row.polling[0]?.dem_average, row.polling[0]?.rep_average)) : "—"}</span>
            </button>)}
          </div>
        </aside>
      </div>
    </>
  }

  const renderWatchlist = () => {
    const unassigned = savedRaces.filter(
      (race) => watchlist.assignments[race.id] == null,
    )
    const rankedPollingRows = [...(pollingProvider.data ?? [])].sort((a, b) => {
      const aDetail = pollingDetails[pollingRaceId(a)]
      const bDetail = pollingDetails[pollingRaceId(b)]
      const activityDifference =
        (bDetail?.recent_polls.polls.length ?? b.poll_count) -
        (aDetail?.recent_polls.polls.length ?? a.poll_count)
      if (activityDifference) return activityDifference
      return (
        Math.abs(a.margin ?? Number.POSITIVE_INFINITY) -
        Math.abs(b.margin ?? Number.POSITIVE_INFINITY)
      )
    })
    const loadedPollsterCount = new Set(
      Object.values(pollingDetails).flatMap(pollingDetailPollsters),
    ).size
    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">Personal dashboard</p>
            <h1>My Watchlist</h1>
            <p className="subhead">
              Organize saved races into your own tiers. No rankings or outcomes
              are inferred.
            </p>
          </div>
          <button
            className="button secondary"
            onClick={requestRefresh}
            type="button"
          >
            <Icon name="refresh" size={16} />
            Refresh sources
          </button>
        </div>

        <div className="summary-strip">
          <div>
            <strong>{savedRaces.length}</strong>
            <span>saved races</span>
          </div>
          <div>
            <strong>{savedRaces.length - unassigned.length}</strong>
            <span>assigned to tiers</span>
          </div>
          <div>
            <strong>
              {loadedPollsterCount
                ? `${loadedPollsterCount} pollsters`
                : pollingProvider.status === "loading"
                  ? "Loading"
                  : "Unavailable"}
            </strong>
            <span>named polling sources</span>
          </div>
          <div className="summary-source">
            <span>Last successful update</span>
            <strong>{formatProviderTime(pollingProvider.lastSuccess)}</strong>
          </div>
        </div>

        <div className="watchlist-intelligence">
          <SenateMap
            onOpenRace={(race) => openRaceMetric(race, "polling")}
            pollingProvider={pollingProvider}
            pollingDetails={pollingDetails}
            savedIds={watchlist.savedIds}
          />
          <GuardianNews news={guardianNews} compact />
        </div>

        <section className="tier-section unassigned">
          <div className="tier-heading">
            <div>
              <span className="tier-number neutral">—</span>
              <div>
                <h2>Polling attention ranking</h2>
                <p>
                  Ranked by recent poll count, then by the closest polling
                  margin. This measures polling activity—not news mentions.
                </p>
              </div>
            </div>
            <span className="count">{rankedPollingRows.length}</span>
          </div>
          <div className="polling-ranking-list">
            {rankedPollingRows.map((polling, index) => {
              const configuredRace = RACES.find(
                (race) =>
                  race.code === polling.state &&
                  (race.seat === "SP") === polling.is_special,
              )
              return (
                <PollingRankCard
                  detail={pollingDetails[pollingRaceId(polling)]}
                  key={pollingRaceId(polling)}
                  onOpen={
                    configuredRace
                      ? () => openRace(configuredRace.id)
                      : undefined
                  }
                  polling={polling}
                  rank={index + 1}
                />
              )
            })}
            {pollingProvider.status === "loading" && (
              <div className="tier-empty">Loading national Senate polling…</div>
            )}
            {pollingProvider.status === "error" &&
              rankedPollingRows.length === 0 && (
                <div className="tier-empty">
                  National polling could not be loaded. Use Refresh sources to
                  try again.
                </div>
              )}
          </div>
        </section>

        <section
          className="tier-section unassigned"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => onDrop(event, null)}
        >
          <div className="tier-heading">
            <div>
              <span className="tier-number neutral">—</span>
              <div>
                <h2>Unassigned races</h2>
                <p>Move saved races into a tier using their menu or drag and drop.</p>
              </div>
            </div>
            <span className="count">{unassigned.length}</span>
          </div>
          <div className="race-grid">
            {unassigned.map((race) => (
              <RaceCard
                activityCount={pollingDetails[race.id]?.recent_polls.polls.length}
                key={race.id}
                onMove={(tier) => moveRace(race.id, tier)}
                onOpen={() => openRace(race.id)}
                onToggleSaved={() => toggleSaved(race.id)}
                polling={pollingProvider.data
                  ? matchPollingRace(pollingProvider.data, race.code, race.seat === "SP")
                  : undefined}
                pollsters={pollingDetailPollsters(pollingDetails[race.id])}
                race={race}
                saved
                tier={null}
                tierNames={watchlist.tierNames}
              />
            ))}
            {unassigned.length === 0 && (
              <div className="tier-empty">All saved races are assigned to tiers.</div>
            )}
          </div>
        </section>

        <div className="tiers-list">
          {watchlist.tierNames.map((name, tierIndex) => {
            const tierRaces = savedRaces.filter(
              (race) => watchlist.assignments[race.id] === tierIndex,
            )
            return (
              <section
                className="tier-section"
                key={tierIndex}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => onDrop(event, tierIndex)}
              >
                <div className="tier-heading">
                  <div>
                    <span className="tier-number">{tierIndex + 1}</span>
                    <div>
                      <label className="editable-tier-label">
                        <span className="sr-only">
                          Name for tier {tierIndex + 1}
                        </span>
                        <input
                          maxLength={36}
                          onChange={(event) =>
                            renameTier(tierIndex, event.target.value)
                          }
                          value={name}
                        />
                      </label>
                      <p>Personal organization only</p>
                    </div>
                  </div>
                  <span className="count">{tierRaces.length}</span>
                </div>
                <div className="race-grid">
                  {tierRaces.map((race) => (
                    <RaceCard
                      activityCount={
                        pollingDetails[race.id]?.recent_polls.polls.length
                      }
                      key={race.id}
                      onMove={(tier) => moveRace(race.id, tier)}
                      onOpen={() => openRace(race.id)}
                      onToggleSaved={() => toggleSaved(race.id)}
                      polling={
                        pollingProvider.data
                          ? matchPollingRace(
                              pollingProvider.data,
                              race.code,
                              race.seat === "SP",
                            )
                          : undefined
                      }
                      pollsters={pollingDetailPollsters(
                        pollingDetails[race.id],
                      )}
                      race={race}
                      saved
                      tier={tierIndex}
                      tierNames={watchlist.tierNames}
                    />
                  ))}
                  {tierRaces.length === 0 && (
                    <div className="tier-empty">
                      Drag a saved race here or use its accessible tier menu.
                    </div>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </>
    )
}

const renderRaces = () => {
  const query = search.trim().toLowerCase()
  const filtered = RACES.filter((race) => {
    const matchesSearch =
      !query ||
      race.state.toLowerCase().includes(query) ||
      race.code.toLowerCase().includes(query)
    const matchesFilter =
      filter === "all" ||
      (filter === "saved" && watchlist.savedIds.includes(race.id)) ||
      (filter === "suggested" && race.suggested)
    return matchesSearch && matchesFilter
  })
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Race discovery</p>
          <h1>All Senate Races</h1>
          <p className="subhead">
            Browse configured 2026 contests. Full national catalog
            availability depends on a connected provider.
          </p>
        </div>
      </div>
      <div className="directory-tools">
        <label className="search-field">
          <span className="sr-only">Search races</span>
          <Icon name="search" />
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by state or abbreviation"
            type="search"
            value={search}
          />
        </label>
        <div aria-label="Filter races" className="filter-group" role="group">
          {(["all", "saved", "suggested"] as const).map((item) => (
            <button
              aria-pressed={filter === item}
              className={filter === item ? "filter active" : "filter"}
              key={item}
              onClick={() => setFilter(item)}
              type="button"
            >
              {item === "all"
                ? "Configured races"
                : item === "saved"
                  ? "Saved"
                  : "Suggestions"}
            </button>
          ))}
        </div>
      </div>
      <div className="discovery-note">
        <strong>Discovery scope</strong>
        <span>
          Seven suggestions are included for coverage interests—not as claims
          of competitiveness. A provider connection will enable searching all
          available 2026 Senate races.
        </span>
      </div>
      <div className="race-grid directory-grid">
        {filtered.map((race) => (
          <div className="directory-item" key={race.id}>
            {race.suggested && (
              <span className="suggestion-label">Coverage suggestion</span>
            )}
            <RaceCard
              activityCount={
                pollingDetails[race.id]?.recent_polls.polls.length
              }
              onMove={(tier) => moveRace(race.id, tier)}
              onOpen={() => openRace(race.id)}
              onToggleSaved={() => toggleSaved(race.id)}
              polling={
                pollingProvider.data
                  ? matchPollingRace(
                    pollingProvider.data,
                    race.code,
                    race.seat === "SP",
                  )
                  : undefined
              }
              pollsters={pollingDetailPollsters(pollingDetails[race.id])}
              race={race}
              saved={watchlist.savedIds.includes(race.id)}
              tier={watchlist.assignments[race.id] ?? null}
              tierNames={watchlist.tierNames}
            />
            {race.note && <p className="coverage-note">{race.note}</p>}
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="empty-search">
          <Icon name="search" />
          <h3>No configured races match</h3>
          <p>Try another state name or change the selected filter.</p>
        </div>
      )}
    </>
  )
}

const renderDetail = () => {
  const race = RACES.find((item) => item.id === detailId) ?? RACES[0]
  const pollingSummary = pollingProvider.data
    ? matchPollingRace(pollingProvider.data, race.code, race.seat === "SP")
    : undefined
  const forecastSummary = forecastProvider.data
    ? matchForecastRace(
      forecastProvider.data.rows,
      race.code,
      race.seat === "SP",
    )
    : undefined
  const activePollingDetail: DetailLoad<PollingDetail> =
    pollingDetail.raceId === race.id
      ? pollingDetail
      : {
        ...EMPTY_PROVIDER,
        status: pollingProvider.status === "error" ? "error" : "loading",
        error: pollingProvider.error,
        raceId: race.id,
      }
  const activeForecastDetail: DetailLoad<ForecastDetail> =
    forecastDetail.raceId === race.id
      ? forecastDetail
      : {
        ...EMPTY_PROVIDER,
        status: forecastProvider.status === "error" ? "error" : "loading",
        error: forecastProvider.error,
        raceId: race.id,
      }
  const raceCandidates = getRaceCandidates(
    race,
    pollingDetail.raceId === race.id ? pollingDetail.data ?? undefined : pollingDetails[race.id],
    forecastProvider.data ? matchForecastRace(forecastProvider.data.rows, race.code, race.seat === "SP") : undefined,
    resultsLoad.data?.races[`${race.code}-${race.seat}`],
  )
  const tabs: Array<[DetailTab, string]> = [
    ["polling", "PollingSource"],
    ["forecast", "Polling Forecast"],
    ["results", "Election Results"],
    ["reporting", "Reporting & Sources"],
  ]
  const raceArticles = articles.items.filter((article) =>
    article.raceIds.includes(race.id),
  )
  return (
    <>
      <button
        className="back-button"
        onClick={() => navigate("watchlist")}
        type="button"
      >
        <span aria-hidden="true">←</span> Back to watchlist
      </button>
      <div className="detail-heading">
        <div>
          <span className="state-code large">{race.code}</span>
          <div>
            <p className="eyebrow">{race.id}</p>
            <h1>{race.state} U.S. Senate</h1>
            <p className="subhead">
              {race.seat === "SP" ? "Special election · " : ""}November 3,
              2026
            </p>
          </div>
        </div>
        <button
          className={
            watchlist.savedIds.includes(race.id)
              ? "button secondary saved"
              : "button secondary"
          }
          onClick={() => toggleSaved(race.id)}
          type="button"
        >
          <Icon name="bookmark" size={16} />
          {watchlist.savedIds.includes(race.id) ? "Saved" : "Save race"}
        </button>
      </div>

      <div
        aria-label="Race data views"
        className="detail-tabs"
        role="tablist"
      >
        {tabs.map(([id, label]) => (
          <button
            aria-selected={detailTab === id}
            className={detailTab === id ? "detail-tab active" : "detail-tab"}
            key={id}
            onClick={() => setDetailTab(id)}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="detail-content">
        <main className="detail-main">
          {detailTab === "polling" && (
            <>
              <div className="section-title">
                <div>
                  <p className="eyebrow">Polling data</p>
                  <h2>PollingSource average</h2>
                </div>
                <span
                  className={
                    activePollingDetail.status === "success"
                      ? "status-pill good"
                      : activePollingDetail.status === "error"
                        ? "status-pill warning"
                        : "status-pill"
                  }
                >
                  {activePollingDetail.status === "success"
                    ? "Live data"
                    : activePollingDetail.status === "error"
                      ? "Provider error"
                      : "Loading"}
                </span>
              </div>
              <PollingDetailPanel
                load={activePollingDetail}
                summary={pollingSummary}
              />
            </>
          )}
          {detailTab === "forecast" && (
            <>
              <div className="section-title">
                <div>
                  <p className="eyebrow">Modeled projection</p>
                  <h2>Polling Forecast model</h2>
                </div>
                <span
                  className={
                    activeForecastDetail.status === "success"
                      ? "status-pill good"
                      : activeForecastDetail.status === "error"
                        ? "status-pill warning"
                        : "status-pill"
                  }
                >
                  {activeForecastDetail.status === "success"
                    ? "Live model"
                    : activeForecastDetail.status === "error"
                      ? "Provider error"
                      : "Loading"}
                </span>
              </div>
              <div className="explanation">
                Forecast probabilities are modeled outcomes, not polling
                averages. They will remain separate from survey percentages
                and polling margins.
              </div>
              <ForecastDetailPanel
                load={activeForecastDetail}
                summary={forecastSummary}
              />
            </>
          )}
          {detailTab === "results" && (
            <>
              <div className="section-title">
                <div>
                  <p className="eyebrow">Actual reported votes</p>
                  <h2>Election results</h2>
                </div>
                <span className={resultsLoad.data?.live ? "status-pill good" : "status-pill warning"}>
                  {resultsLoad.data?.live ? "Live reports" : "Partial coverage"}
                </span>
              </div>
              <div className="explanation">
                Preliminary returns are not certified results. Vote totals,
                reporting estimates, and publisher race calls will only appear
                with authorized, source-specific data.
              </div>
              <section className="live-race-results">
                <h3>State-reported Senate votes</h3>
                {Object.entries(resultsLoad.data?.races ?? {}).filter(([key]) => key === `${race.code}-${race.seat}`).map(([key, result]) => <div className="live-result-item" key={key}>
                  <strong>{key} · {result.total.toLocaleString()} votes counted</strong>
                  {result.cands.map((candidate) => <div className="live-candidate-result" key={candidate.n + candidate.p}><span>{candidate.n} ({candidate.p || "—"})</span><strong>{candidate.v.toLocaleString()} · {candidate.pct == null ? "—" : `${candidate.pct.toFixed(1)}%`}</strong></div>)}
                  <small>{result.pct_in == null ? "Precinct reporting unavailable" : `${result.pct_in}% precincts reporting`} · Not a race call</small>
                </div>)}
                {!Object.keys(resultsLoad.data?.races ?? {}).some((key) => key === `${race.code}-${race.seat}`) && <p>No reported Senate vote totals for this race from the connected feed. This does not mean zero votes or that the race has ended.</p>}
                {resultsLoad.status === "error" && <p>Feed request failed: {resultsLoad.error}. Last successful data, if any, is retained.</p>}
                <p className="senate-state-note">Source: <ExternalLink href="https://openamerica.io/elections/api/">Official state election offices via Open America</ExternalLink>. Last state update: {formatProviderTime(resultsLoad.data?.as_of ?? null)}. Limited participating-state coverage; no projected winners.</p>
              </section>
            </>
          )}
          {detailTab === "reporting" && (
            <>
              <div className="section-title">
                <div>
                  <p className="eyebrow">Reporting and commentary</p>
                  <h2>Stories, sources & public voices</h2>
                </div>
                <span className="status-pill warning">
                  Connection required
                </span>
              </div>
              <div className="explanation">
                Reported stories, outlet ratings, and public commentary are
                separate evidence types. A public figure’s position is shown
                only with a dated source and is never treated as polling.
              </div>
              <RelationshipGraph
                articles={raceArticles}
                candidateNames={raceCandidates.map(
                  (candidate) => candidate.name,
                )}
              />
              <section className="saved-stories-section">
                <div className="data-section-heading">
                  <div>
                    <p className="eyebrow">Manual bookmarks</p>
                    <h3>Saved reporting for {race.code}</h3>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("media")}
                    type="button"
                  >
                    Manage bookmarks
                  </button>
                </div>
                <ArticleList
                  articles={raceArticles}
                  onDelete={deleteArticle}
                />
              </section>
              <GuardianNews news={guardianNews} />
            </>
          )}
        </main>
        <aside className="detail-aside">
          <div className="aside-card">
            <p className="eyebrow">Candidates</p>
            <CandidateProfiles code={race.code} result={resultsLoad.data?.races[`${race.code}-${race.seat}`]} updatedAt={resultsLoad.data?.as_of} />
          </div>
          <div className="aside-card prediction-card">
            <p className="eyebrow">Private · stored on this device</p>
            <h3>My winner prediction</h3>
            <p>
              Enter the candidate you expect to win. This is your private
              note—not polling, a forecast, or a statement of support.
            </p>
            <label className="prediction-field">
              <span>Candidate name</span>
              <input
                autoComplete="off"
                list={`candidates-${race.id}`}
                onChange={(event) =>
                  setPredictions((current) => ({
                    ...current,
                    [race.id]: event.target.value,
                  }))
                }
                placeholder="No prediction yet"
                value={predictions[race.id] ?? ""}
              />
              <datalist id={`candidates-${race.id}`}>
                {raceCandidates.map((candidate) => (
                  <option key={candidate.name} value={candidate.name} />
                ))}
              </datalist>
            </label>
            {predictions[race.id] && (
              <button
                className="text-button prediction-clear"
                onClick={() =>
                  setPredictions((current) => {
                    const next = { ...current }
                    delete next[race.id]
                    return next
                  })
                }
                type="button"
              >
                Clear prediction
              </button>
            )}
          </div>
          <div className="aside-card">
            <p className="eyebrow">Dataset status</p>
            <dl>
              <div>
                <dt>Last attempt</dt>
                <dd>
                  {pollingProvider.status === "loading"
                    ? "In progress"
                    : "Completed"}
                </dd>
              </div>
              <div>
                <dt>Last success</dt>
                <dd>{formatProviderTime(pollingProvider.lastSuccess)}</dd>
              </div>
              <div>
                <dt>Auto-refresh</dt>
                <dd>Manual refresh</dd>
              </div>
            </dl>
            <button
              className="button secondary full"
              onClick={requestRefresh}
              type="button"
            >
              <Icon name="refresh" size={16} /> Refresh this source
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}

const renderMedia = () => (
  <>
    <div className="page-heading">
      <div>
        <p className="eyebrow">Reference directory</p>
        <h1>Media Sources</h1>
        <p className="subhead">
          Separate measures, separate methodologies. No outlet-level values
          have been inferred.
        </p>
      </div>
    </div>
    <div className="media-grid">
      <section className="media-card">
        <span className="measure-index">01</span>
        <p className="eyebrow">Outlet-level measure</p>
        <h2>Content bias</h2>
        <p>
          Ad Fontes evaluates the political positioning of outlet content. An
          outlet rating does not assess every individual story.
        </p>
        <div className="unavailable-row">
          <span>Verified score</span>
          <strong>Unavailable</strong>
        </div>
        <dl className="transparency-meta">
          <div>
            <dt>Source</dt>
            <dd>Ad Fontes Media</dd>
          </div>
          <div>
            <dt>Reference configured</dt>
            <dd>Nov. 1, 2026</dd>
          </div>
        </dl>
        <ExternalLink href="https://app.adfontesmedia.com/chart/interactive">
          View Ad Fontes rating
        </ExternalLink>
      </section>
      <section className="media-card">
        <span className="measure-index">02</span>
        <p className="eyebrow">Outlet-level measure</p>
        <h2>Factual reliability</h2>
        <p>
          Reliability is distinct from political bias. Licensed, verified
          values may be added later with source and verification dates.
        </p>
        <div className="unavailable-row">
          <span>Verified score</span>
          <strong>Unavailable</strong>
        </div>
        <dl className="transparency-meta">
          <div>
            <dt>Source</dt>
            <dd>Ad Fontes Media</dd>
          </div>
          <div>
            <dt>Scope</dt>
            <dd>Outlet average, not article score</dd>
          </div>
        </dl>
        <ExternalLink href="https://app.adfontesmedia.com/chart/interactive">
          View Ad Fontes methodology
        </ExternalLink>
      </section>
      <section className="media-card">
        <span className="measure-index">03</span>
        <p className="eyebrow">Audience research</p>
        <h2>Audience composition</h2>
        <p>
          Pew audience measures require a clear denominator. “Share of
          Democrats who use an outlet” is not the same as “share of an
          outlet’s audience who are Democrats.”
        </p>
        <div className="unavailable-row">
          <span>Outlet percentages</span>
          <strong>Not imported</strong>
        </div>
        <dl className="transparency-meta">
          <div>
            <dt>Source</dt>
            <dd>Pew Research Center</dd>
          </div>
          <div>
            <dt>Published</dt>
            <dd>June 10, 2025</dd>
          </div>
        </dl>
        <ExternalLink href="https://www.pewresearch.org/journalism/2025/06/10/the-political-gap-in-americans-news-sources/">
          Read Pew research
        </ExternalLink>
      </section>
    </div>
    <section className="reference-section">
      <div>
        <p className="eyebrow">Editorial references</p>
        <h2>External reading</h2>
      </div>
      <div className="reference-item">
        <div className="reference-mark">NPR</div>
        <div>
          <strong>NPR — 2026 Senate Map</strong>
          <p>
            External editorial reference · Article content has not been
            imported
          </p>
        </div>
        <ExternalLink href="https://www.npr.org/2026/10/30/g-s1-149975/2026-midterms-senate-map">
          Open article
        </ExternalLink>
      </div>
    </section>
    <GuardianNews news={guardianNews} />
    <section
      className="news-import-section"
      aria-labelledby="news-import-title"
    >
      <div className="bookmark-library-heading">
        <div>
          <p className="eyebrow">Frontend-only · manual snapshot</p>
          <h2 id="news-import-title">Imported news feed</h2>
          <p>
            Paste a GNews JSON response here. Imported stories are stored only
            in this browser and are always labeled as a snapshot—not live
            reporting.
          </p>
        </div>
        <span className="status-pill warning">
          {newsSnapshot ? "Snapshot loaded" : "Not connected"}
        </span>
      </div>
      <div className="news-import-layout">
        <form className="bookmark-form" onSubmit={importNews}>
          <label>
            <span>GNews JSON response</span>
            <textarea
              onChange={(event) => setNewsJson(event.target.value)}
              placeholder={'{"totalArticles": 1, "articles": [...]}'}
              required
              rows={10}
              value={newsJson}
            />
            <small>
              Paste response data only. Never paste an API key into this form.
            </small>
          </label>
          <div className="news-import-actions">
            <button className="button primary" type="submit">
              Import snapshot
            </button>
            {newsSnapshot && (
              <button
                className="button ghost danger"
                onClick={() => {
                  setNewsSnapshot(null)
                  setNotice("Imported news snapshot cleared.")
                }}
                type="button"
              >
                Clear snapshot
              </button>
            )}
          </div>
        </form>
        <div>
          {newsSnapshot && (
            <div className="snapshot-meta">
              <span>
                Imported {formatProviderTime(newsSnapshot.importedAt)}
              </span>
              <strong>{newsSnapshot.articles.length} displayed</strong>
            </div>
          )}
          <ImportedNewsList snapshot={newsSnapshot} />
        </div>
      </div>
    </section>
    <section className="bookmark-library" aria-labelledby="bookmarks-title">
      <div className="bookmark-library-heading">
        <div>
          <p className="eyebrow">Stored on this device · schema version 1</p>
          <h2 id="bookmarks-title">Article bookmarks</h2>
          <p>
            Save external reporting without importing article text. Every
            title, outlet, note, date, and race association is entered by you.
          </p>
        </div>
        <span className="count">{articles.items.length} saved</span>
      </div>
      <div className="bookmark-layout">
        <form className="bookmark-form" onSubmit={saveArticle}>
          <label>
            <span>Article title</span>
            <input
              onChange={(event) =>
                setArticleDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              required
              value={articleDraft.title}
            />
          </label>
          <div className="form-split">
            <label>
              <span>Outlet</span>
              <input
                onChange={(event) =>
                  setArticleDraft((current) => ({
                    ...current,
                    outlet: event.target.value,
                  }))
                }
                required
                value={articleDraft.outlet}
              />
            </label>
            <label>
              <span>Published date</span>
              <input
                onChange={(event) =>
                  setArticleDraft((current) => ({
                    ...current,
                    publishedDate: event.target.value,
                  }))
                }
                type="date"
                value={articleDraft.publishedDate}
              />
            </label>
          </div>
          <label>
            <span>Canonical publisher URL</span>
            <input
              inputMode="url"
              onChange={(event) =>
                setArticleDraft((current) => ({
                  ...current,
                  url: event.target.value,
                }))
              }
              placeholder="https://publisher.example/article"
              required
              type="url"
              value={articleDraft.url}
            />
          </label>
          <label>
            <span>Add race association</span>
            <select
              onChange={(event) => {
                const id = event.target.value
                if (id && !articleDraft.raceIds.includes(id)) {
                  setArticleDraft((current) => ({
                    ...current,
                    raceIds: [...current.raceIds, id],
                  }))
                }
                event.target.value = ""
              }}
              value=""
            >
              <option value="">Choose a configured race</option>
              {RACES.map((race) => (
                <option key={race.id} value={race.id}>
                  {race.state} · {race.seat === "SP" ? "special" : "regular"}
                </option>
              ))}
            </select>
          </label>
          {articleDraft.raceIds.length > 0 && (
            <div className="selected-races" aria-label="Selected races">
              {articleDraft.raceIds.map((id) => {
                const race = RACES.find((item) => item.id === id)
                return (
                  <button
                    key={id}
                    onClick={() =>
                      setArticleDraft((current) => ({
                        ...current,
                        raceIds: current.raceIds.filter(
                          (raceId) => raceId !== id,
                        ),
                      }))
                    }
                    type="button"
                  >
                    {race?.code ?? id} <span aria-hidden="true">×</span>
                    <span className="sr-only">Remove association</span>
                  </button>
                )
              })}
            </div>
          )}
          <label>
            <span>Candidate association (optional)</span>
            <input
              onChange={(event) =>
                setArticleDraft((current) => ({
                  ...current,
                  candidateName: event.target.value,
                }))
              }
              placeholder="Use an exact provider-listed name"
              value={articleDraft.candidateName}
            />
            <small>
              A graph edge appears only when this exactly matches a
              provider-listed candidate on the associated race.
            </small>
          </label>
          <label>
            <span>Notes (optional)</span>
            <textarea
              onChange={(event) =>
                setArticleDraft((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              rows={3}
              value={articleDraft.notes}
            />
          </label>
          <button className="button primary" type="submit">
            <Icon name="bookmark" size={16} />
            Save article
          </button>
        </form>
        <div className="bookmark-results">
          <ArticleList articles={articles.items} onDelete={deleteArticle} />
        </div>
      </div>
    </section>
    <PublicVoicesDirectory />
  </>
)

const renderSettings = () => (
  <>
    <div className="page-heading">
      <div>
        <p className="eyebrow">Definitions and preferences</p>
        <h1>Methodology & Settings</h1>
        <p className="subhead">
          How the watchlist stores preferences and labels election data.
        </p>
      </div>
    </div>
    <div className="settings-layout">
      <section className="settings-card">
        <p className="eyebrow">Data language</p>
        <h2>Keep unlike metrics separate</h2>
        <dl className="definition-list">
          <div>
            <dt>Polling average</dt>
            <dd>
              A summary of survey responses, attributed to its polling data
              provider.
            </dd>
          </div>
          <div>
            <dt>Polling activity rank</dt>
            <dd>
              Ordered by the number of recent named survey rows, then by the
              closest average margin. It is not a count of news mentions.
            </dd>
          </div>
          <div>
            <dt>Modeled forecast</dt>
            <dd>
              A projection with uncertainty—not a poll result or counted vote.
            </dd>
          </div>
          <div>
            <dt>Election result</dt>
            <dd>
              Actual reported votes. Preliminary returns are never called
              certified.
            </dd>
          </div>
          <div>
            <dt>Personal tier</dt>
            <dd>
              Your organization field, not a competitiveness or provider
              rating.
            </dd>
          </div>
          <div>
            <dt>My prediction</dt>
            <dd>
              A private, locally stored winner pick. It is not a poll,
              forecast, endorsement, or community aggregate.
            </dd>
          </div>
          <div>
            <dt>Public voice</dt>
            <dd>
              A sourced position from an outlet, host, commentator, or
              creator. Popularity and opinion are not measures of factual
              reliability.
            </dd>
          </div>
          <div>
            <dt>Party color</dt>
            <dd>
              Blue identifies Democratic affiliation and red identifies
              Republican affiliation. Democratic Socialists use their
              organization’s brand red; independent and other affiliations
              retain separate colors. Purple is not a party—it marks a race
              PollingSource explicitly rates “Toss-up.”
            </dd>
          </div>
        </dl>
      </section>
      <div className="settings-stack">
        <section className="settings-card">
          <p className="eyebrow">Local data</p>
          <h2>Watchlist storage</h2>
          <p>
            Saved races, assignments, tier names, private predictions, and
            article bookmarks are stored in this browser. Watchlist and
            article records each use a versioned schema.
          </p>
          <div className="settings-actions">
            <button
              className="button secondary"
              onClick={() => {
                const blob = new Blob([JSON.stringify(watchlist, null, 2)], {
                  type: "application/json",
                })
                const url = URL.createObjectURL(blob)
                const link = document.createElement("a")
                link.href = url
                link.download = "election-watchlist-v1.json"
                link.click()
                URL.revokeObjectURL(url)
                setNotice("Watchlist exported.")
              }}
              type="button"
            >
              Export watchlist
            </button>
            <button
              className="button ghost danger"
              onClick={() => {
                setWatchlist(DEFAULT_WATCHLIST)
                setNotice("Watchlist reset to the 14 default saved races.")
              }}
              type="button"
            >
              Reset defaults
            </button>
          </div>
        </section>
        <section className="settings-card">
          <p className="eyebrow">Refresh behavior</p>
          <h2>Provider updates</h2>
          <div className="setting-row">
            <div>
              <strong>Automatic refresh</strong>
              <p>
                Live providers load on page start and can be refreshed
                manually. Polling refreshes every 15 minutes; results refresh every 1–10 minutes with error backoff. Requests pause while inactive.
              </p>
            </div>
            <span className="status-pill good">Connected</span>
          </div>
          <div className="setting-row">
            <div>
              <strong>Offline fallback</strong>
              <p>
                Live data is not yet cached across browser restarts. A failed
                refresh keeps the current in-memory response visible.
              </p>
            </div>
            <span className="status-pill warning">Session only</span>
          </div>
        </section>
      </div>
    </div>
  </>
)

return (
  <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
        <button
          className="brand"
          onClick={() => navigate("home")}
          type="button"
        >
          <img
            src={theme === "dark" ? "/Branding/POLLCATDARK.svg" : "/Branding/POLLCATLIGHT.svg"}
            alt="Poll Cat — 2026 election explorer"
            width="549" height="593"
            className="brand-mark"
          />
          <span>
            <strong>Poll Cat</strong>
            <small>2026 Election Night</small>
          </span>
        </button>
          <nav aria-label="Primary navigation">
            {navItems.map(([id, label]) => (
              <button
                aria-current={page === id ? "page" : undefined}
                className={page === id ? "nav-link active" : "nav-link"}
                key={id}
                onClick={() => navigate(id)}
                type="button"
              >
                {label}
              </button>
            ))}
          </nav>
          <button
            aria-label={`Switch to ${
              theme === "dark" ? "light" : "dark"
            } theme`}
            className="theme-toggle"
            onClick={() =>
              setTheme((current) => (current === "dark" ? "light" : "dark"))
            }
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            type="button"
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
          </button>
          <div className="mode-switch" role="group" aria-label="Election office">{(["Senate", "Governor"] as const).map(item => <button key={item} type="button" aria-pressed={office === item} className={office === item ? "active" : ""} onClick={() => { setOffice(item); navigate("home") }}>{item === "Senate" ? "U.S. Senate" : item}</button>)}</div>
          <div aria-label="Dashboard mode" className="mode-switch" role="group">
            <button
              aria-pressed={mode === "polling"}
              className={mode === "polling" ? "active" : ""}
              onClick={() => setMode("polling")}
              type="button"
            >
              Polling
            </button>
            <button
              aria-pressed={mode === "election"}
              className={mode === "election" ? "active" : ""}
              onClick={() => {
                setMode("election")
                setNotice(
                  "Showing official state-reported votes where Open America provides coverage. Missing results are not zeros.",
                )
              }}
              type="button"
            >
              Election Night
            </button>
          </div>
        </div >
      </header >

  { mode === "election" && (
    <div className="mode-banner">
      <div>
        <strong>Election Night mode</strong>
        <span>
          Official state-reported votes via Open America are available only for participating states. No winner projections or race calls. Polls are separate.
        </span>
      </div>
      <ExternalLink href="https://openamerica.io/elections/api/">
        Live results source &amp; limitations
      </ExternalLink>
    </div>
  )}

      <SeatComposition office={office} />
      <main className="page-container">
        {page === "home" && <>{office === "Governor" ? <GovernorMap mode={mode} news={guardianNews}/> : renderHome()}<ForecastCoverage /><CivicResults /></>}
        {page === "watchlist" && renderWatchlist()}
        {page === "races" && renderRaces()}
        {page === "detail" && renderDetail()}
        {page === "media" && renderMedia()}
        {page === "settings" && renderSettings()}
      </main>

      <footer>
        <span>Poll Cat · 2026 election explorer</span>
        <span>Polling is not voting · No race calls implied</span>
      </footer>

{
  notice && (
    <div aria-live="polite" className="toast" role="status">
      {notice}
    </div>
  )
}
    </div >
  )
}
