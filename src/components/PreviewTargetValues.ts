import {createElement} from 'react'
import type {LivePrescription} from '../engine/terrainModifier.ts'
const stat=(label:string,value:string)=>createElement('span',{className:'preview-stat',key:label},createElement('small',null,label),createElement('strong',null,value))
export function PreviewTargetValues({target}:{target:LivePrescription}){const manual=target.manualTarget;const start=manual.recommendedResistance===null?'Unavailable':`${manual.recommendedResistance}% @ ${manual.recommendedCadence} rpm`;return createElement('div',{className:'preview-target-values'},stat('ZONE',target.zone),stat('POWER',target.power),stat('CADENCE',target.cadence),stat('RESISTANCE',target.resistance),stat('START',start),stat('ADJUSTMENT',manual.adjustmentGuidance))}
