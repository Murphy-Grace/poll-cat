import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { createGuardianHandler } from './guardian.ts'

const root = resolve('dist')
const guardian = createGuardianHandler(process.env.GUARDIAN_API_KEY)
const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' }
createServer((req, res) => {
  void guardian(req, res, () => {
    void (async () => {
      try {
        const pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname)
        if (pathname.startsWith('/api/')) { res.statusCode = 404; res.end(); return }
        if (req.method !== 'GET' && req.method !== 'HEAD') { res.statusCode = 405; res.end(); return }
        const file = resolve(root, '.' + pathname)
        if (!file.startsWith(root + sep) && file !== root) { res.statusCode = 403; res.end(); return }
        let body: Buffer
        let extension = extname(file)
        try { body = await readFile(file) } catch {
          if (extension) { res.statusCode = 404; res.end(); return }
          body = await readFile(resolve(root, 'index.html'))
          extension = '.html'
        }
        res.setHeader('Content-Type', types[extension] || 'application/octet-stream')
        res.setHeader('X-Content-Type-Options', 'nosniff')
        res.end(req.method === 'HEAD' ? undefined : body)
      } catch { res.statusCode = 500; res.end('Unable to serve application.') }
    })()
  })
}).listen(Number(process.env.PORT || 8443), process.env.HOST || '0.0.0.0')
