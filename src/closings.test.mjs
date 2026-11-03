import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
const source = (await readFile(new URL('./PollClosings.tsx', import.meta.url), 'utf8')).replace('import { useEffect, useState } from "react"', '')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React } })
const { closingTime, closingStatus, closingStyle, closingStage, closingColor, stateClosingHours } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
test('split-region states close fully only at their final scheduled wave', () => {
  assert.deepEqual(stateClosingHours('Florida'), [19,20])
  assert.deepEqual(stateClosingHours('Alaska'), [24,25])
  const partial = closingTime(19) + 1
  assert.match(closingStatus('Florida', partial), /Some regions/)
  assert.equal(closingStage('Florida', partial).partial, true)
  assert.equal(closingStage('Florida', partial).closed, false)
  assert.equal(closingStyle('Florida', closingTime(20), 'closings').fill, closingColor('Florida', closingTime(20)))
})
test('EST conversion crosses UTC midnight and polling has no closing decoration', () => {
  assert.equal(new Date(closingTime(19)).toISOString(), '2026-11-04T00:00:00.000Z')
  assert.deepEqual(closingStyle('Florida',closingTime(21),'polling'), {})
  assert.deepEqual(closingStyle('Florida',closingTime(21),'closings'), { fill: closingColor('Florida', closingTime(21)) })
  assert.equal(closingStage('Georgia',closingTime(18)+1).next, true)
})

test('live results never receive closing decoration before, during or after waves', () => {
  for (const state of ['Georgia', 'Florida', 'Alaska']) {
    for (const hour of [18, 19, 20, 24, 25, 26]) {
      assert.deepEqual(closingStyle(state, closingTime(hour), 'results'), {})
    }
  }
})

test('every wave transitions on its exact timestamp and Alaska remains partial until 1 AM ET', () => {
  for (const [state, hour] of [['Georgia',19], ['Hawaii',24], ['Alaska',25]]) {
    assert.equal(closingStage(state, closingTime(hour)-1).closed, false)
    assert.equal(closingStage(state, closingTime(hour)).closed, true)
  }
  assert.deepEqual(closingStage('Alaska', closingTime(24)), {closed:false, next:true, partial:true})
  assert.equal(new Date(closingTime(24)).toISOString(), '2026-11-04T05:00:00.000Z')
  assert.equal(new Date(closingTime(25)).toISOString(), '2026-11-04T06:00:00.000Z')
})
