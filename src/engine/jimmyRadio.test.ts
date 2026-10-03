import test from 'node:test'
import assert from 'node:assert/strict'
import { jimmyAmbientDelay, jimmyMayInterrupt, jimmySpeechAllowed, jimmyTransitionCue } from './jimmyRadio.ts'

test('steady training gets one transition warning while hard work gets a brace call',()=>{
 assert.equal(jimmyTransitionCue(60,'Endurance','Endurance'),null)
 assert.equal(jimmyTransitionCue(30,'Endurance','Endurance'),'Thirty seconds. Endurance next.')
 assert.equal(jimmyTransitionCue(10,'Endurance','Endurance'),null)
 assert.equal(jimmyTransitionCue(10,'Threshold','Threshold'),'Ten seconds. Get ready for Threshold.')
})

test('ambient cadence stays sparse',()=>{
 assert.ok(jimmyAmbientDelay(1,'TRAINING')>=210)
 assert.ok(jimmyAmbientDelay(1,'RACE')>=120)
})

test('higher priority radio may interrupt lower priority chatter',()=>{
 assert.equal(jimmyMayInterrupt('ambient','course'),true)
 assert.equal(jimmyMayInterrupt('course','ambient'),false)
 assert.equal(jimmySpeechAllowed({lastSpokenAt:100,now:103,currentPriority:'ambient',nextPriority:'tactical'}),true)
 assert.equal(jimmySpeechAllowed({lastSpokenAt:100,now:103,currentPriority:'course',nextPriority:'course'}),false)
 assert.equal(jimmySpeechAllowed({lastSpokenAt:100,now:109,currentPriority:'course',nextPriority:'course'}),true)
})
