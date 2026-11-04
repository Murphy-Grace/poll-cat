import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import ts from 'typescript'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
async function load(path) {
  const source = await readFile(resolve(root, path), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } })
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
}
const { SENATE_DIRECTORY } = await load('src/senate.ts')
const { GOVERNOR_PORTRAITS } = await load('src/governor-portraits.ts')
const governors = JSON.parse(await readFile(resolve(root, 'src/governors.json'), 'utf8'))
const rows = []
for (const [code, race] of Object.entries(SENATE_DIRECTORY)) {
  for (const c of race.candidates) rows.push({ name: c.name, state: race.state, code, office: 'Senate', seat: race.seat, party: c.party, writeIn: c.writeIn, directorySource: c.source, photo: c.photo })
}
const parties = { D: 'Democratic', R: 'Republican', I: 'Independent', L: 'Libertarian', G: 'Green' }
for (const race of governors) {
  let groupParty = null
  for (const label of race.candidates) {
    if (/^Independents:/.test(label)) groupParty = 'Independent'
    const name = label.replace(/^Independents:\s*/, '').replace(/^Gov\. /, '').replace(/ \([^)]+\)$/, '').trim()
    const abbreviation = label.match(/ \(([^)]+)\)$/)?.[1]
    const party = parties[abbreviation] ?? abbreviation ?? groupParty ?? 'Unspecified in directory'
    // Match the lookup used by GovernorMap, retaining raw labels for traceability.
    const identity = label.replace(/^Gov\. /, '').replace(/ \([^)]+\)$/, '').toLowerCase()
    rows.push({ name, state: race.state, code: race.code, office: 'Governor', seat: 'REG', party, writeIn: false, originalLabel: label, directorySource: race.source, photo: GOVERNOR_PORTRAITS[identity] ?? null })
  }
}
const checks = new Map()
for (const row of rows) {
  row.existingHeadshotSource = row.photo?.source ?? null
  row.imageUrl = row.photo?.url ?? null
  row.credit = row.photo?.credit ?? null
  delete row.photo
  if (!row.imageUrl) {
    row.usableImage = false
    row.displayStatus = 'Initials placeholder; no image assigned'
    row.dimensions = null
    continue
  }
  if (!checks.has(row.imageUrl)) {
    const path = resolve(root, 'public', row.imageUrl.replace(/^\//, ''))
    const result = spawnSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', path], { encoding: 'utf8' })
    const width = Number(result.stdout?.match(/pixelWidth: (\d+)/)?.[1])
    const height = Number(result.stdout?.match(/pixelHeight: (\d+)/)?.[1])
    checks.set(row.imageUrl, { usable: result.status === 0 && width > 0 && height > 0, dimensions: width && height ? { width, height } : null })
  }
  const check = checks.get(row.imageUrl)
  row.usableImage = check.usable
  row.dimensions = check.dimensions
  row.displayStatus = check.usable ? 'Local image decodes; assigned to portrait component' : 'Broken image; component falls back to initials'
}
const count = office => {
  const group = rows.filter(r => r.office === office)
  return { candidates: group.length, races: new Set(group.map(r => r.code)).size, usable: group.filter(r => r.usableImage).length, missing: group.filter(r => !r.usableImage).length }
}
const summary = { Senate: count('Senate'), Governor: count('Governor') }
await writeFile(resolve(root, 'docs/headshot-inventory-2026.json'), JSON.stringify({ checkedOn: '2026-11-03', method: 'Complete local directory extraction; assigned local images decoded using macOS sips. No browser rendering, identity, crop, or remote-source verification claimed.', summary, candidates: rows }, null, 2) + '\n')
const cell = value => String(value ?? 'None').replaceAll('|', '\\|').replaceAll('\n', ' ')
const lines = [ '# Candidate headshot audit — 2026', '', 'Complete inventory of the checked-in Senate and Governor directories, including write-ins, third parties, independents, and territories. This audits the existing roster; it does not independently certify ballot eligibility or expand candidate initials into unverified legal names.', '', 'Checked November 3, 2026. Regenerate with `node scripts/audit-headshots.mjs` on macOS (`sips` required). Machine-readable detail: [headshot-inventory-2026.json](headshot-inventory-2026.json).', '', '| Office | Races | Candidates | Usable assigned images | Missing images |', '| --- | ---: | ---: | ---: | ---: |', ...Object.entries(summary).map(([office, s]) => `| ${office} | ${s.races} | ${s.candidates} | ${s.usable} | ${s.missing} |`), '', '“Usable” means the assigned local file decodes with positive pixel dimensions. The portrait component displays it when that candidate is rendered; candidates need not be selected or visible on the map. Browser rendering, subject identity, framing quality, and upstream source availability have not been independently verified. Missing images render neutral initials; placeholders are not counted as photographs. All existing local portraits and credits were preserved.', '', 'Governor party suffixes are expanded where explicit. The Virgin Islands “Independents” group applies to its following entries. Raw labels and directory evidence are retained in JSON. Live provider result rows and polling scenarios are not a fixed candidate directory and are outside this inventory.', '', '| Full directory name | State | Office | Party | Write-in | Existing image | Source | Usable image displayed when rendered |', '| --- | --- | --- | --- | --- | --- | --- | --- |', ...rows.map(r => `| ${[r.name, r.state, r.office + (r.seat === 'SP' ? ' (special)' : ''), r.party, r.writeIn ? 'Yes' : 'No', r.imageUrl, r.existingHeadshotSource, r.usableImage ? 'Yes — file decodes (render not verified)' : r.displayStatus].map(cell).join(' | ')} |`), '' ]
await writeFile(resolve(root, 'docs/HEADSHOT-AUDIT-2026.md'), lines.join('\n'))
console.log(JSON.stringify(summary, null, 2))
