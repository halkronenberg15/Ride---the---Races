import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read=(path:string)=>readFileSync(new URL(path,import.meta.url),'utf8')

test('active ride timer interval depends only on clock running state',()=>{
 const source=read('../state/ActiveRideContext.tsx')
 assert.match(source,/const clockRunning=Boolean\(ride&&ride\.runningSince!==null\)/)
 assert.match(source,/\}, \[clockRunning\]\)/)
 assert.doesNotMatch(source,/setInterval\(\(\) => setNow\(Date\.now\(\)\), 250\)[\s\S]{0,120}\}, \[ride\]\)/)
})

test('rider marker uses a road-bike frame and no halo',()=>{
 const source=read('../components/RiderMarker4023.ts')
 assert.match(source,/M11 24 L22 13 L30 24 L11 24/)
 assert.doesNotMatch(source,/rider-marker-halo/)
})

test('persistent race status is compact in the cockpit',()=>{
 const css=read('../App.css')
 assert.match(css,/4\.0\.26\.1 cockpit hotfix/)
 assert.match(css,/\.ride-cockpit \.race-status-persistent/)
})


test('peloton and breakaway visuals stay dormant until connected power positioning is enabled',()=>{
 const ride=read('../screens/RideScreen.tsx')
 assert.match(ride,/const livePowerRacePositionEnabled=false/)
 assert.match(ride,/const raceSituation=livePowerRacePositionEnabled\?raceSituationModel:undefined/)
})
