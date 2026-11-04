import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resultsSignature, electionStatus } from './election-status.ts'

test('status follows refresh lifecycle and schedule without implying vote completion', () => {
 const base = { failed:false, closed:false, initial:false, votes:10, beforeFirstClosing:false, fresh:false }
 for (const [change, expected] of [
  [{initial:true,votes:0},'loading'], [{votes:0,beforeFirstClosing:true},'open'],
  [{votes:0},'first'], [{},'waiting'], [{fresh:true},'new'],
  [{closed:true,fresh:true},'closed'], [{failed:true,closed:true},'error'],
 ]) assert.equal(electionStatus({...base,...change}),expected)
})
test('only changed applicable results count as new, not provider timestamps or ordering', () => {
 const race = {total:10,pct_in:1,cands:[{n:'A',p:'D',v:6,pct:60},{n:'B',p:'R',v:4,pct:40}]}
 const a = {as_of:'first',races:{'OH-SP':race,'CA-REG':race}}
 const b = {as_of:'later',races:{'CA-REG':{...race,total:30},'OH-SP':{...race,cands:[...race.cands].reverse()}}}
 assert.equal(resultsSignature(a,['OH']),resultsSignature(b,['OH']))
 assert.notEqual(resultsSignature(a,['OH']),resultsSignature({...a,races:{'OH-SP':{...race,total:11}}},['OH']))
})
