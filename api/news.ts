import type { IncomingMessage, ServerResponse } from 'node:http'
import { createGuardianHandler } from '../server/guardian.ts'
// Module scope preserves coalescing, TTL and backoff within a warm instance.
const guardian = createGuardianHandler(process.env.GUARDIAN_API_KEY)
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await guardian(req, res, () => { res.statusCode = 404; res.end() })
}
