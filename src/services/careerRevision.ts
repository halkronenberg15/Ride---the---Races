import type { CareerState } from '../types/career.ts'

export function careerSnapshotRevision(career:CareerState){
 const input=JSON.stringify(career)
 let hash=0x811c9dc5
 for(let index=0;index<input.length;index++){
  hash^=input.charCodeAt(index)
  hash=Math.imul(hash,0x01000193)
 }
 return 'rtr1-'+(hash>>>0).toString(16).padStart(8,'0')
}
