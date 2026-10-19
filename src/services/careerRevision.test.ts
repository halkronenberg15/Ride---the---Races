import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialCareer } from '../state/careerPersistence.ts'
import { careerSnapshotRevision } from './careerRevision.ts'

test('career revision is deterministic and changes with career data',()=>{
 const career=createInitialCareer()
 const first=careerSnapshotRevision(career)
 const second=careerSnapshotRevision(career)
 assert.equal(first,second)
 career.rider.name='Changed rider'
 assert.notEqual(careerSnapshotRevision(career),first)
 assert.match(first,/^rtr1-[0-9a-f]{8}$/)
})
