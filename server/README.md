# Guardian news

The browser requests only `GET /api/news`. The server reads `GUARDIAN_API_KEY` from `.env.local` (already ignored by Git) or the deployment environment. Never rename it with a `VITE_` prefix.

The endpoint requests the latest 12 Guardian US-news articles matching election, elections, midterms, or senate. These are general election headlines, not verified race associations or endorsements. Headline, publication time, article link, source attribution, and provider thumbnail (when available) are returned.

Vite development and preview servers register the endpoint automatically. Editing the Vite configuration should restart the existing dev server. The client refreshes every 15 minutes while visible and on returning to the tab. Server instances cache responses for 15 minutes, merge concurrent refreshes, time out upstream requests after 10 seconds, and back off failures for one minute. Failed refreshes retain the last available feed and label it stale. Manual refresh respects the server cache.

For production, use Node 22.18+ or Node 24:

```
npm run build
npm start
```

`npm start` serves `dist` and the API on `PORT` (default 8443). Set `GUARDIAN_API_KEY` as a secret in your hosting platform. Static-only hosting, including a static Figma export, needs a separate server or serverless deployment of the endpoint; uploading `dist` alone does not deploy this API. Multiple server instances have separate caches.

Run `npm run test:news` for endpoint tests. Guardian API documentation: https://open-platform.theguardian.com/documentation/

Vercel configuration and launch requirements are documented in `docs/PRODUCTION-LAUNCH.md`. `api/news.ts` adapts the same handler as a native Vercel Node function; public results continue to use browser-side provider adapters.
