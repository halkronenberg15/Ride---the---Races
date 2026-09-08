import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CalibrationHelper, formatChampionshipDate, mobileProfileRegions, ProfileStatusHeader } from '../components/WorldsRaceLayer.ts'
import { worldsStage } from '../data/uciWorlds2026.ts'

test('narrow iPhone profile regions keep completion, distance and FINISH separate',()=>{for(const width of [320,375,390,430]){const regions=mobileProfileRegions(width);assert(regions.completion.right<regions.remaining.left);assert(regions.remaining.bottom<regions.finish.top);assert(regions.remaining.right<=width);assert(regions.finish.left>=0)}})
test('rendered profile status gives remaining distance a protected region',()=>{const html=renderToStaticMarkup(createElement(ProfileStatusHeader,{worlds:true,completion:94,remaining:'10.2 mi'}));assert.match(html,/profile-completion/);assert.match(html,/profile-remaining/);assert.match(html,/10.2 mi left/);assert.match(html,/LIVE RACE TRACKER/)})
test('Brossard Rollout uses a bicycle and reserves the flag for the finish',()=>{const segments=worldsStage('road').segments;assert.equal(segments[0].name,'Brossard Rollout');assert.equal(segments[0].icon,'🚴');assert.equal(segments.find(segment=>segment.name==='Avenue du Parc Finish')?.icon,'🏁');assert.notEqual(segments.find(segment=>/climb/i.test(segment.type))?.icon,'🏁')})
test('rendered calibration helper contains one dynamic starting pairing',()=>{const html=renderToStaticMarkup(createElement(CalibrationHelper,{resistance:38,cadence:91,guidance:'LOW: +1 · HIGH: −1'}));assert.equal(html.match(/START 38% @ 91 RPM/g)?.length,1);assert.doesNotMatch(html,/LOW:|HIGH:/)})
test('championship dates are human-readable and never expose ISO dates',()=>{const dates=['2026-09-20','2026-09-27'].map(formatChampionshipDate);assert.deepEqual(dates,['SEPTEMBER 20, 2026','SEPTEMBER 27, 2026']);assert.doesNotMatch(dates.join(' '),/2026-09-/)})
test('supported widths retain bounded content without horizontal overflow',()=>{for(const width of [320,375,390,430]){const regions=mobileProfileRegions(width);for(const region of Object.values(regions)){assert(region.left>=0);assert(region.right<=width);assert(region.right>=region.left)}}})
