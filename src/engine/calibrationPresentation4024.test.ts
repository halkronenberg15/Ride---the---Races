import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { trainingRides } from '../data/raceLibrary.ts'
import { PELOTON_BASELINE_EQUIPMENT } from './manualBike.ts'
import { noFtpPresentation, rideOpeningMessage, coachingContext } from './release4024.ts'
import { PreviewTargetValues } from '../components/PreviewTargetValues.ts'
import { resolvePreviewTarget } from './previewTargets.ts'

const calibration=trainingRides.find(ride=>ride.id==='intro-calibration')!
test('no-FTP calibration briefing renders EFFORT without provisional watts',()=>{const html=renderToStaticMarkup(createElement(PreviewTargetValues,{target:noFtpPresentation(calibration.stage.segments[0],PELOTON_BASELINE_EQUIPMENT)}));assert.match(html,/>EFFORT</);assert.match(html,/RPE 1–2/);assert.match(html,/65–80 rpm/);assert.match(html,/25–30%/);assert.doesNotMatch(html,/POWER|PROVISIONAL|0–0 W|0–3%/)})
test('established FTP briefing retains POWER',()=>{const html=renderToStaticMarkup(createElement(PreviewTargetValues,{target:resolvePreviewTarget(calibration.stage.segments[0],180,PELOTON_BASELINE_EQUIPMENT)}));assert.match(html,/>POWER</);assert.doesNotMatch(html,/>EFFORT</)})
test('one no-FTP projection supplies badge, detail, preview and exact boundary activation',()=>{const current=noFtpPresentation(calibration.stage.segments[0],PELOTON_BASELINE_EQUIPMENT),upNext=noFtpPresentation(calibration.stage.segments[1],PELOTON_BASELINE_EQUIPMENT,undefined,1),active=noFtpPresentation(calibration.stage.segments[1],PELOTON_BASELINE_EQUIPMENT,undefined,1),restored=structuredClone(active);assert.deepEqual(upNext,active);assert.deepEqual(restored,active);for(const projection of [current,upNext,active])assert.match(projection.effort,/^RPE/);assert.equal(active.cadence,'65–80 rpm');assert.equal(active.resistance,'25–30%')})
test('calibration Jean opening is concise and contains no race template fragments',()=>{const message=rideOpeningMessage(coachingContext('training','intro-calibration'),'Intro Calibration Ride');assert.equal(message,'Settle in. Smooth pedals—today we’re finding your comfortable baseline.');assert.doesNotMatch(message,/Stage 30|Intro Calibration Ride.*Intro Calibration Ride|balanced today|Team objective/i)})
test('Training Library is single-folder navigation and excludes roster while Team Bus retains it',()=>{const library=readFileSync(new URL('../screens/RaceLibraryScreen.tsx',import.meta.url),'utf8'),bus=readFileSync(new URL('../screens/TeamBusScreen.tsx',import.meta.url),'utf8');assert.match(library,/activeTrainingFolder===null/);assert.match(library,/Back to Training Library/);assert.match(library,/Choose one folder/);assert.doesNotMatch(library,/library==='training'.{0,500}Team Roster/s);assert.match(bus,/TEAM ROSTER/)})
test('mobile CSS protects safe area, three-column targets, and Jean wrapping',()=>{const app=readFileSync(new URL('../App.css',import.meta.url),'utf8'),ride=readFileSync(new URL('../screens/RideScreen.tsx',import.meta.url),'utf8');assert.match(app,/safe-area-inset-bottom[^\n]+112px/);assert.match(app,/@media\(max-width:430px\)/);assert.match(ride,/repeat\(3,minmax\(0,1fr\)\)/);assert.match(ride,/authoritative-jean[^}]*overflow:hidden/);assert.match(ride,/overflow-wrap:anywhere/)})
