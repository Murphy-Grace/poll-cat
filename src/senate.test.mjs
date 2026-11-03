import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'

// Load the actual TypeScript data modules without introducing a test runtime dependency.
async function loadModule(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } })
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
}
const { SENATE_DIRECTORY, SENATE_STATES, candidateResult, getRaceCandidates, migrateRaceId } = await loadModule('./senate.ts')
const { parseSenateResults } = await loadModule('./results.ts')
const { default: map } = await import('@svg-maps/usa')

test('verified roster covers 35 of the 50 map states, leaving 15 without elections', () => {
  const states = map.locations.filter(({ id }) => id !== 'dc').map(({ id }) => id.toUpperCase())
  assert.equal(states.length, 50)
  assert.equal(new Set(SENATE_STATES).size, 35)
  assert.ok(SENATE_STATES.every((code) => states.includes(code)))
  assert.equal(states.filter((code) => !SENATE_STATES.includes(code)).length, 15)
  assert.equal(SENATE_STATES.filter((code) => !['FL', 'OH'].includes(code)).length, 33)
  assert.ok(SENATE_STATES.includes('OK'))
})

test('every election has sourced general nominees without polling, forecasts or results', () => {
  for (const code of SENATE_STATES) {
    const entry = SENATE_DIRECTORY[code]
    const candidates = getRaceCandidates({ code, seat: entry.seat })
    assert.ok(candidates.length >= 2, code)
    assert.equal(new Set(candidates.map(c => c.name)).size, candidates.length)
    assert.ok(candidates.every(c => c.source && new URL(c.source).protocol === "https:" && c.party && c.name))
    assert.equal(entry.checkedOn, '2026-11-03')
  }
  assert.equal(getRaceCandidates({ code: 'CA', seat: 'REG' }).length, 0)
  assert.equal(getRaceCandidates({ code: 'OH', seat: 'REG' }).length, 0)
})

test('polling scenarios and incomplete result feeds cannot replace the directory', () => {
  const race = { code: 'OH', seat: 'SP' }
  const before = getRaceCandidates(race)
  const after = getRaceCandidates(race, undefined, { left_candidate: 'Primary candidate', rep_candidate: 'Withdrawn candidate' }, { cands: [{ n: 'Wrong person', p: 'I', v: 0 }] })
  assert.deepEqual(before, after)
  assert.ok(after.some(c => c.party === 'Libertarian'))
  assert.ok(after.some(c => c.writeIn))
  assert.ok(!SENATE_DIRECTORY.ME.candidates.some(c => c.name.includes('Platner')))
  assert.ok(!SENATE_DIRECTORY.ID.candidates.some(c => c.name === 'David Roth'))
})

test('portraits have identity-specific sources and neutral fallback metadata', () => {
  const candidates = Object.values(SENATE_DIRECTORY).flatMap(e => e.candidates)
  assert.ok(candidates.some(c => c.photo))
  assert.ok(candidates.some(c => c.photo === null))
  for (const c of candidates.filter(c => c.photo)) {
    assert.ok(c.photo.source.startsWith('https://commons.wikimedia.org/wiki/File:'))
    assert.ok(c.photo.credit.includes('Public domain'))
  }
})

test('vote matching never uses similar surnames or treats missing rows as zero votes', () => {
  const entry = SENATE_DIRECTORY.AK
  const incumbent = entry.candidates.find(c => c.name === 'Dan S. Sullivan')
  const other = entry.candidates.find(c => c.name === 'Daniel J. Sullivan Jr.')
  const results = { total: 10, cands: [{ n: 'dan s. sullivan', p: 'R', v: 10, pct: 100 }] }
  assert.equal(candidateResult(incumbent, results).v, 10)
  assert.equal(candidateResult(other, results), undefined)
  assert.equal(candidateResult(incumbent), undefined)
})

test('special and regular vote totals remain separate and absent races are not zero-filled', () => {
  const race = (total) => ({ leader: total ? 'I' : '', total, pct_in: null, cands: [{ n: 'Fixture Independent', p: 'I', v: total, pct: total ? 100 : null }] })
  const feed = parseSenateResults({ api: 1, year: 2026, office: 'Senate', live: true, counting: true, as_of: '2026-11-04T01:00:00Z', races: { 'OH-special': race(321), OK: race(0) } })
  assert.equal(feed.races['OH-SP'].cands[0].v, 321)
  assert.equal(feed.races['OK-REG'].total, 0)
  assert.equal(feed.races['OH-REG'], undefined)
  assert.equal(feed.races['AK-REG'], undefined)
  assert.throws(() => parseSenateResults({ api: 1, year: 2024 }))
})

test('stored race associations migrate to corrected seats without changing other ids', () => {
  assert.equal(migrateRaceId('US-SEN-2026-OH-REG'), 'US-SEN-2026-OH-SP')
  assert.equal(migrateRaceId('US-SEN-2026-OK-SP'), 'US-SEN-2026-OK-REG')
  assert.equal(migrateRaceId('US-SEN-2026-AK-REG'), 'US-SEN-2026-AK-REG')
})
