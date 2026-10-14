import test from 'node:test'
import assert from 'node:assert/strict'
import { jimmyAmbientDelay, jimmyMayInterrupt, jimmySpeechAllowed, jimmyTrainingTransitionCue, jimmyTransitionCue } from './jimmyRadio.ts'

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


test('training transition cues put recovery instructions at recovery entry and preparation at the end',()=>{
 assert.equal(jimmyTrainingTransitionCue({secondsRemaining:30,currentTitle:'Recovery',currentType:'Recovery',nextTitle:'Climb 2',nextType:'Climb',nextZone:'Sustained climbing'}),'Thirty seconds. Start bringing cadence back. Climb 2 next.')
 assert.equal(jimmyTrainingTransitionCue({secondsRemaining:10,currentTitle:'Recovery',currentType:'Recovery',nextTitle:'Climb 2',nextType:'Climb',nextZone:'Sustained climbing'}),'Ten seconds. Find your gear and get ready.')
 assert.equal(jimmyTrainingTransitionCue({secondsRemaining:3,currentTitle:'Recovery',currentType:'Recovery',nextTitle:'Climb 2',nextType:'Climb',nextZone:'Sustained climbing'}),'Three, two, one. Climb 2.')
 assert.equal(jimmyTrainingTransitionCue({secondsRemaining:30,currentTitle:'Final recovery',currentType:'Recovery',nextTitle:'Cooldown',nextType:'Cooldown',nextZone:'Z1'}),'Thirty seconds. Finish this section clean. Cooldown is next.')
})
