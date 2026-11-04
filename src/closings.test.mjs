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
  assert.equal(closingStatus('Florida', partial), 'Partially closed')
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

test('Indiana and Kentucky are partial at 6:52 PM Eastern and close exactly at 7 PM', () => {
  const now = Date.parse('2026-11-03T18:52:00-05:00')
  for (const state of ['Indiana', 'Kentucky']) {
    assert.deepEqual(stateClosingHours(state), [18, 19])
    assert.deepEqual(closingStage(state, now), { closed: false, next: true, partial: true })
    assert.equal(closingStatus(state, now), 'Partially closed')
    assert.equal(closingColor(state, now), closingColor('', now, 19))
    for (const prefix of ['senate-closing', 'governor-closing']) {
      assert.equal(closingStyle(state, now, 'closings', prefix).fill, `url(#${prefix}-${state})`)
      assert.equal(closingStyle(state, closingTime(19), 'closings', prefix).fill, closingColor('', now, 19))
    }
  }
})

test('all split-wave states remain partial until the last timestamp', () => {
  for (const state of ['Indiana', 'Kentucky', 'Florida', 'Kansas', 'Michigan', 'North Dakota', 'South Dakota', 'Texas', 'Idaho', 'Oregon', 'Alaska']) {
    const hours = stateClosingHours(state)
    assert.ok(hours.length > 1, state)
    assert.equal(closingStage(state, closingTime(hours[0]) - 1).partial, false, state)
    assert.equal(closingStage(state, closingTime(hours[0])).partial, true, state)
    assert.equal(closingStage(state, closingTime(hours.at(-1)) - 1).closed, false, state)
    assert.deepEqual(closingStage(state, closingTime(hours.at(-1))), { closed: true, next: false, partial: false }, state)
    assert.equal(closingColor(state, closingTime(26)), closingColor('', 0, hours.at(-1)), state)
  }
})

test('concise statuses follow upcoming, next, partial and final closing boundaries', () => {
  assert.equal(closingStatus('Florida', closingTime(18) - 1), 'Polls open')
  assert.equal(closingStatus('Indiana', closingTime(18) - 1), 'Closing next')
  assert.equal(closingStatus('Florida', closingTime(19)), 'Partially closed')
  assert.equal(closingStatus('Unknown', closingTime(26)), 'Closing time unavailable')
  for (const state of ['Indiana', 'Kentucky', 'Florida', 'Kansas', 'Michigan', 'North Dakota', 'South Dakota', 'Texas', 'Idaho', 'Oregon', 'Alaska']) {
    const final = closingTime(stateClosingHours(state).at(-1))
    assert.equal(closingStatus(state, final - 1), 'Partially closed', state)
    assert.equal(closingStatus(state, final), 'Polls closed', state)
    assert.equal(closingStatus(state, final + 1), 'Polls closed', state)
  }
})

test('patterns prioritize partial status and density follows elapsed regional waves', async () => {
  const { closingPattern, closingSecondary, WAVE_COLORS, CLOSINGS } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
  assert.equal(new Set(Object.values(WAVE_COLORS)).size, CLOSINGS.length)
  for (const [hour] of CLOSINGS) assert.equal(closingColor('', 0, hour), WAVE_COLORS[hour])
  for (const hour of [18, 19, 19.5]) {
    for (const offset of [-1, 0, 1]) {
      const now = closingTime(hour) + offset
      for (const state of ['Indiana', 'Kentucky', 'Florida', 'New Hampshire', 'Ohio', 'Alaska', 'Hawaii']) {
        const stage = closingStage(state, now)
        assert.equal(closingPattern(state, now).kind, stage.closed ? 'solid' : stage.partial ? 'dots' : stage.next ? 'stripes' : 'pale')
      }
    }
  }
  assert.equal(closingPattern('Florida', closingTime(17)).kind, 'pale')
  assert.equal(closingPattern('Indiana', closingTime(18)-1).kind, 'stripes')
  assert.equal(closingPattern('Indiana', closingTime(18)).kind, 'dots')
  assert.equal(closingSecondary('Indiana', closingTime(18)), 'Closing next')
  assert.equal(closingPattern('Indiana', closingTime(19)).kind, 'solid')
  assert.deepEqual(stateClosingHours('New Hampshire'), [19, 19.5, 20])
  assert.ok(closingPattern('New Hampshire', closingTime(19.5)).spacing < closingPattern('New Hampshire', closingTime(19)).spacing)
  assert.equal(closingPattern('New Hampshire', closingTime(20)).kind, 'solid')
})

test('SVG marks use the legend color, constant dot radius, and state clips', async () => {
  globalThis.React = { createElement: (type, props, ...children) => ({type, props: props ?? {}, children: children.flat(Infinity)}) }
  try {
    const { ClosingDefs } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
    const locations = [{id:'nh',name:'New Hampshire',path:'M0 0h40v40H0z'}]
    for (const prefix of ['senate-closing','governor-closing']) {
      for (const hour of [18, 19, 19.5, 20]) {
        const now = closingTime(hour)
        const tree = ClosingDefs({locations,now,prefix})
        const nodes = []
        const walk = n => { if(n && typeof n === 'object') { nodes.push(n); n.children.forEach(walk) } }
        walk(tree)
        assert.equal(nodes.find(n=>n.type==='clipPath').props.id, `${prefix}-clip-nh`)
        assert.equal(nodes.find(n=>n.type==='clipPath').children[0].props.d, locations[0].path)
        const circles = nodes.filter(n=>n.type==='circle')
        assert.equal(circles.length, hour===19 || hour===19.5 ? 1 : 0)
        for (const dot of circles) {
          assert.equal(dot.props.r, '1.3')
          assert.equal(dot.props.fill, closingColor('New Hampshire',now))
        }
        assert.equal(nodes.filter(n=>n.type==='rect').length, hour===18 ? 2 : 1)
      }
    }
  } finally { delete globalThis.React }
})
