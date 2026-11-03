import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
const source = await readFile(new URL('./composition.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } })
const { senateComposition, SENATE_BASELINE, governorComposition, GOVERNOR_BASELINE } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
test('official baseline accounts for all 100 seats and independent caucus affiliation', () => {
  const seats = senateComposition()
  assert.deepEqual(seats, { D:45, I:2, R:53 })
  assert.equal(Object.values(seats).reduce((a,b) => a+b),100)
  assert.equal(seats.D + seats.I,47)
})
test('partial leaders, complete counts, duplicate snapshots and untrusted calls never change membership', () => {
  for (const fixture of [{leader:'D',pct_in:20}, {leader:'D',pct_in:100}, {called:true,winner:'D'}, [{state:'TX',winner:'D'},{state:'TX',winner:'D'}], null]) {
    assert.deepEqual(senateComposition(fixture), SENATE_BASELINE)
  }
})
test('refreshes and modified consumer copies cannot destroy initial baseline', () => {
  const copy = senateComposition(); copy.R = 0
  assert.equal(senateComposition().R,53)
  assert.ok(Object.isFrozen(SENATE_BASELINE))
})

test('governor baseline counts 50 states separately and ignores unverified calls', () => {
  assert.deepEqual(governorComposition({ winner: 'D', called: true }), { D: 24, I: 0, R: 26 })
  assert.equal(Object.values(governorComposition()).reduce((a, b) => a + b), 50)
  const copy = governorComposition(); copy.D = 50
  assert.equal(governorComposition().D, 24)
  assert.ok(Object.isFrozen(GOVERNOR_BASELINE))
})
