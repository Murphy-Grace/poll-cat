import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseCivicSearch, parseCivicResult, civicRequest } from './civic.ts'
const row = {id:1,type:'US Senate',country:'US',province:'OH',district:null,election_name:'Ohio US Senate Special General',election_type:'General',election_date:'2026-11-03T05:00:00Z'}
const search = rows => parseCivicSearch({count:rows.length,races:rows},'Senate')
test('deduplicates IDs, keeps special seats distinct, excludes aggregates and conflicting seats',()=>{
 assert.equal(search([row,row]).length,1)
 assert.equal(search([row,{...row,id:2}]).length,0)
 assert.equal(search([row,{...row,id:2,election_name:'Ohio US Senate'}]).length,2)
 assert.equal(search([{...row,province:'US'},{...row,election_name:'Ohio US Senate Primary'}]).length,0)
 assert.throws(()=>parseCivicSearch({count:2,races:[row]},'Senate'))
})
test('full response preserves missing fields, zero votes, reported percentages and calls',()=>{
 const race=search([row])[0]
 const payload={...row,election_type:'US Senate',test_data:false,candidates:[{name:'A',party:'Independent',votes:0,percent:0,winner:false},{name:'B',party:'D',votes:null,percent:52.34,winner:true}]}
 const result=parseCivicResult(payload,race)
 assert.equal(result.candidates[0].votes,0);assert.equal(result.candidates[1].votes,null)
 assert.equal(result.candidates[1].percent,52.34);assert.equal(result.candidates[1].winner,true)
 assert.equal(result.updated,null);assert.equal(result.reporting,null)
 assert.throws(()=>parseCivicResult({...payload,test_data:true},race))
 assert.throws(()=>parseCivicResult({...payload,province:'FL'},race))
})
test('request coalescing, cache and 429 Retry-After cooldown',async()=>{
 const original=globalThis.fetch;let calls=0
 try {
 globalThis.fetch=async()=>{calls++;return new Response('{"ok":true}')}
 await Promise.all([civicRequest('test-cache'),civicRequest('test-cache')]);await civicRequest('test-cache');assert.equal(calls,1)
 globalThis.fetch=async()=>{calls++;return new Response('',{status:429,headers:{'Retry-After':'120'}})}
 await assert.rejects(civicRequest('test-limit'),/rate limit/)
 await assert.rejects(civicRequest('test-another'),/rate limit/)
 assert.equal(calls,2)
 }finally{globalThis.fetch=original}
})
