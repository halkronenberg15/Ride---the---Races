import type { RideSegment } from '../data/raceStages.ts'
import { bikeProfileForEquipment, PELOTON_MANUAL_PROFILE, type CadencePreferences, type EquipmentInstance } from './manualBike.ts'
import { createPrescription, ftpIntensity } from './prescription.ts'
import { applyTerrainModifier, type LivePrescription } from './terrainModifier.ts'

/** Briefing targets use the same finite, equipment-feasible path as live targets. */
export function resolvePreviewTarget(segment:RideSegment,ftp:number,equipment:EquipmentInstance,preferences?:CadencePreferences,gradient=0):LivePrescription{
 const authored=ftpIntensity(segment)??{min:45,max:75}
 const durationCeiling=segment.sec<=30?150:segment.sec<=60?140:segment.sec<=180?130:120
 const intensity={min:Math.min(authored.min,durationCeiling),max:Math.min(Math.max(authored.min,authored.max),durationCeiling)}
 const prescription={...createPrescription(segment,ftp,intensity),prescriptionId:`preview-${segment.name}`,segmentId:segment.name,intervalId:segment.name,strategy:'Briefing',resistanceRange:{min:0,max:0}}
 const profile=bikeProfileForEquipment(equipment)??PELOTON_MANUAL_PROFILE
 return applyTerrainModifier(prescription,gradient,gradient>2?'climb':gradient<0?'descent':'flat',ftp,profile,undefined,equipment,preferences)
}
