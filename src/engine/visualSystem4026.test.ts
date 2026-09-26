import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read=(path:string)=>readFileSync(new URL(path,import.meta.url),'utf8')

test('4.0.26 cockpit has distinct presentation contexts and road-state hierarchy',()=>{
 const ride=read('../screens/RideScreen.tsx')
 assert.match(ride,/cockpit-training/)
 assert.match(ride,/cockpit-worlds/)
 assert.match(ride,/cockpit-race/)
 assert.match(ride,/cockpit-road-state/)
})

test('training climb sections automatically use climb visualization without claiming geography',()=>{
 const ride=read('../screens/RideScreen.tsx')
 assert.match(ride,/trainingClimbVisual/)
 assert.match(ride,/stage\.isTraining&&currentSegmentIsClimb/)
 assert.match(ride,/showClimbView=trainingClimbVisual/)
})

test('rider marker is vector based and metric ranges use enlarged cockpit typography',()=>{
 const marker=read('../components/RiderMarker4023.ts')
 const css=read('../App.css')
 assert.match(marker,/viewBox:'0 0 48 32'/)
 assert.doesNotMatch(marker,/🚴/)
 assert.match(css,/font-size:clamp\(1rem,4\.15vw,1\.38rem\)/)
 assert.match(css,/4\.0\.26 RtR visual system/)
})
