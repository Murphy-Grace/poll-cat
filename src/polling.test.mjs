import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchForecastRaces, validateForecastRace, matchForecastRace } from './polling.ts'
const row = { key:'OH-S',kind:'Senate',state:'OH',special:true,as_of:'2026-11-02',left_party:'D',chance_left:0.6,range80_low:-5,range80_high:8,best_bet_margin:2,poll_average:null }
test('missing polling remains unavailable and forecast margin is independent', () => {
 assert.equal(validateForecastRace({...row}).poll_average,null)
 assert.equal(validateForecastRace({...row,poll_average:undefined}).poll_average,null)
 assert.equal(validateForecastRace({...row,poll_average:0}).poll_average,0)
 assert.throws(()=>validateForecastRace({...row,poll_average:'2'}))
 assert.throws(()=>validateForecastRace({...row,best_bet_margin:null}))
 assert.equal(matchForecastRace([row], 'OH',false),undefined)
})
test('requests exact documented office URLs, validates envelopes and reports failed URLs', async () => {
 const original = globalThis.fetch
 const urls=[]
 try {
 globalThis.fetch=async url=>{
  urls.push(url)
  const office=url.split('/').at(-1)
  if(office==='governors') return new Response('',{status:404})
  return Response.json({dataset:office,asOf:'2026-11-02',licence:'CC BY 4.0',attribution:'Polling Forecast',count:1,rows:[{...row,kind:office==='house'?'House':'Senate'}]})
 }
 await Promise.all([fetchForecastRaces(),fetchForecastRaces()])
 await fetchForecastRaces('house')
 assert.deepEqual(urls,['https://www.pollingforecast.com/api/us/senate','https://www.pollingforecast.com/api/us/house'])
 await assert.rejects(fetchForecastRaces('governors'),/HTTP 404 for https:\/\/www.pollingforecast.com\/api\/us\/governors/)
 globalThis.fetch=async()=>new Response('',{status:429,headers:{'Retry-After':'120'}})
 await assert.rejects(fetchForecastRaces('governors'),/HTTP 429/)
 await assert.rejects(fetchForecastRaces('governors'),/cooldown/)
 } finally {globalThis.fetch=original}
})

test('polling outage stays an error and a later valid response preserves office separation', async () => {
 const { fetchPollingRaces } = await import('./polling.ts')
 const original = globalThis.fetch
 try {
  globalThis.fetch = async () => Response.json({error:'race list temporarily unavailable; retry shortly'}, {status:503})
  await assert.rejects(fetchPollingRaces('governor'), /HTTP 503/)
  const race = {state:'AL',race_type:'governor',is_special:false,page:'https://pollingsource.com/race',detail:'https://pollingsource.com/api/v1/race?state=AL',dem_average:null,rep_average:null}
  globalThis.fetch = async () => Response.json({dataset:'PollingSource race polling averages',races:[race,{...race,race_type:'senate'}]})
  assert.deepEqual(await fetchPollingRaces('governor'), [race])
  assert.deepEqual(await fetchPollingRaces('senate'), [{...race,race_type:'senate'}])
 } finally { globalThis.fetch = original }
})
