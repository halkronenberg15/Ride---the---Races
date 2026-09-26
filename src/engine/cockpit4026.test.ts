import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read=(path:string)=>readFileSync(new URL(path,import.meta.url),'utf8')

test('4.0.26 cockpit adds race, Worlds, and training presentation contexts',()=>{
 const ride=read('../screens/RideScreen.tsx')
 assert.match(ride,/cockpit-training/)
 assert.match(ride,/cockpit-worlds/)
 assert.match(ride,/cockpit-race/)
 assert.match(ride,/cockpit-road-state/)
})

test('rider position uses a vector marker rather than an emoji glyph',()=>{
 const marker=read('../components/RiderMarker4023.ts')
 assert.match(marker,/<svg|viewBox/)
 assert.doesNotMatch(marker,/🚴/)
 assert.match(marker,/rider-marker-halo/)
})

test('profile controls inherit the cockpit visual system instead of inline colors',()=>{
 const controls=read('../components/ProfileControls4023.ts')
 assert.doesNotMatch(controls,/controlStyle|#512000/)
 const css=read('../App.css')
 assert.match(css,/4\.0\.26 cockpit graphics foundation/)
 assert.match(css,/profile-control-footer button\[aria-pressed="true"\]/)
})
