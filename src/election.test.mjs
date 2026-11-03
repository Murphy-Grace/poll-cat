import { test } from 'node:test'
import assert from 'node:assert/strict'
import { margin, marginColor, voteMargin } from './election.ts'
test('percentage points remain distinct and missing data stays neutral',()=>{
 assert.ok(Math.abs(margin(48.4,48)-0.4)<1e-10)
 assert.equal(margin(null,48),null)
 assert.equal(margin(NaN,48),null)
 assert.notEqual(marginColor(null),marginColor(0))
 assert.notEqual(marginColor(0.4),marginColor(4))
 assert.equal(marginColor(20),marginColor(40))
})
test('vote margins require both parties and positive reported totals',()=>{
 assert.equal(voteMargin({total:0,cands:[]}),null)
 assert.equal(voteMargin({total:100,cands:[{p:'D',v:52}]}),null)
 assert.equal(voteMargin({total:100,cands:[{p:'D',v:52},{p:'R',v:48}]}),4)
})

test('reported totals update the continuous fill without polling fallbacks', () => {
 const race = {total:100, cands:[{n:'Democrat',p:'D',v:52},{n:'Republican',p:'R',v:48}]}
 const initial = marginColor(voteMargin(race))
 race.cands[0].v = 48
 race.cands[1].v = 52
 assert.notEqual(marginColor(voteMargin(race)), initial)
 race.total = 0
 assert.equal(marginColor(voteMargin(race)), marginColor(null))
})
