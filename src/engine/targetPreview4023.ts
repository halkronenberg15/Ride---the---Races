import type { LivePrescription } from './terrainModifier.ts'
/** Preview and activation consume the exact same resolver output object. */
export function targetPreview4023(name:string,duration:number,prescription:LivePrescription){return {name,remaining:duration,power:prescription.power,cadence:prescription.cadence,openingResistance:prescription.manualTarget.recommendedResistance}}
