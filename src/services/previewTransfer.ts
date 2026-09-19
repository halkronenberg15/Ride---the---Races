import type { CareerState } from '../types/career.ts'
import type { ActiveRide } from '../state/ActiveRideContext.tsx'
import type { RiderAccount } from './accountStore.ts'
import { activeRideStorageKey, careerStorageKey, replaceProgramEntitlements } from './accountStore.ts'
import { migrateCareer } from '../state/careerPersistence.ts'

export const RTR_EXPORT_FORMAT='ride-the-races-career-export'
export const RTR_EXPORT_VERSION=1
export const BACKUP_PREFIX='ride-the-races-preview-import-backup-v1:'
export type CareerExport={format:typeof RTR_EXPORT_FORMAT;formatVersion:1;exportedAt:string;sourceApplicationVersion:string;sourceSchemaVersion:number;riderSummary:{name:string;number:number;ftp:number|null;series:string|null;programs:string[]};programEntitlements:string[];career:CareerState;activeRide:ActiveRide|null;activeRideStatus:'NOT_INCLUDED'|'SAFE_PAUSED_RIDE_INCLUDED'}
export type ImportPreview={payload:CareerExport;migrated:CareerState;summary:{riderName:string;riderNumber:number;sourceApplicationVersion:string;sourceSchemaVersion:number;exportedAt:string;currentSeason:string;completedStages:number;rideHistory:number;archivedSeasons:number;ftp:number|null;series:string;programs:string;activeRideIncluded:boolean;destinationWillBeReplaced:true;identityDiffers:boolean}}
export type RecoveryBackup={format:'ride-the-races-pre-import-backup';version:1;createdAt:string;schemaVersion:number;rider:{name:string;number:number};programEntitlements:string[];career:CareerState;activeRide:ActiveRide|null}

const object=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value)
export function safeExportFilename(name:string,date:string){const slug=name.normalize('NFKD').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,60)||'rider';return `rtr-career-${slug}-${date}.json`}
export function buildCareerExport(account:RiderAccount,career:CareerState,activeRide:ActiveRide|null,sourceApplicationVersion:string,now=new Date().toISOString()):CareerExport{
 if(account.role!=='owner')throw new Error('Owner access is required for Preview Data Transfer.')
 if(activeRide?.runningSince!==null&&activeRide)throw new Error('Pause or end the active ride before exporting career data.')
 const safeActive=activeRide?.paused&&activeRide.runningSince===null?structuredClone(activeRide):null
 return {format:RTR_EXPORT_FORMAT,formatVersion:RTR_EXPORT_VERSION,exportedAt:now,sourceApplicationVersion,sourceSchemaVersion:career.schemaVersion,riderSummary:{name:career.rider.name,number:career.rider.number,ftp:career.rider.ftp,series:career.alpha4025.seriesPreference,programs:[...account.entitlements]},programEntitlements:[...account.entitlements],career:structuredClone(career),activeRide:safeActive,activeRideStatus:safeActive?'SAFE_PAUSED_RIDE_INCLUDED':'NOT_INCLUDED'}
}
export function serializeCareerExport(payload:CareerExport){return JSON.stringify(payload,null,2)}
export function parseCareerExport(text:string,destination:CareerState):ImportPreview{
 let raw:unknown;try{raw=JSON.parse(text)}catch{throw new Error('The selected file is not valid JSON.')}
 if(!object(raw)||raw.format!==RTR_EXPORT_FORMAT)throw new Error('This is not a Ride the Races career export.')
 if(raw.formatVersion!==RTR_EXPORT_VERSION)throw new Error('The export format version is not supported.')
 if(typeof raw.sourceSchemaVersion!=='number'||raw.sourceSchemaVersion<1)throw new Error('The source schema version is missing or invalid.')
 if(raw.sourceSchemaVersion>6)throw new Error(`Schema ${raw.sourceSchemaVersion} is newer than this preview supports.`)
 if(!object(raw.career)||!object(raw.career.rider)||!object(raw.career.season)||!Array.isArray(raw.career.rideHistory)||!Array.isArray(raw.career.pastSeasons))throw new Error('The export is missing required career structures.')
 if(typeof raw.career.rider.name!=='string'||!Number.isFinite(raw.career.rider.number))throw new Error('The exported rider identity is malformed.')
 if(typeof raw.exportedAt!=='string'||Number.isNaN(Date.parse(raw.exportedAt))||typeof raw.sourceApplicationVersion!=='string')throw new Error('The export metadata is malformed.')
 const payload=raw as unknown as CareerExport,migrated=migrateCareer(payload.career),activeRideIncluded=Boolean(payload.activeRide&&payload.activeRide.paused&&payload.activeRide.runningSince===null)
 return {payload:{...payload,activeRide:activeRideIncluded?payload.activeRide:null,activeRideStatus:activeRideIncluded?'SAFE_PAUSED_RIDE_INCLUDED':'NOT_INCLUDED'},migrated,summary:{riderName:migrated.rider.name,riderNumber:migrated.rider.number,sourceApplicationVersion:payload.sourceApplicationVersion,sourceSchemaVersion:payload.sourceSchemaVersion,exportedAt:payload.exportedAt,currentSeason:migrated.season.currentRace,completedStages:migrated.season.completedStages.length,rideHistory:migrated.rideHistory.length,archivedSeasons:migrated.pastSeasons.length,ftp:migrated.rider.ftp,series:migrated.alpha4025.seriesPreference??'Not selected',programs:payload.programEntitlements?.join(', ')||'Not included',activeRideIncluded,destinationWillBeReplaced:true,identityDiffers:migrated.rider.name!==destination.rider.name||migrated.rider.number!==destination.rider.number}}
}
export function backupKey(accountId:string){return `${BACKUP_PREFIX}${accountId}`}
export function readRecoveryBackup(account:RiderAccount):RecoveryBackup|null{if(account.role!=='owner')return null;try{const raw=localStorage.getItem(backupKey(account.id));return raw?JSON.parse(raw) as RecoveryBackup:null}catch{return null}}
function makeBackup(account:RiderAccount,career:CareerState,activeRide:ActiveRide|null,now:string):RecoveryBackup{return {format:'ride-the-races-pre-import-backup',version:1,createdAt:now,schemaVersion:career.schemaVersion,rider:{name:career.rider.name,number:career.rider.number},programEntitlements:[...account.entitlements],career:structuredClone(career),activeRide:activeRide?structuredClone(activeRide):null}}
export function commitCareerImport(account:RiderAccount,current:CareerState,currentActive:ActiveRide|null,preview:ImportPreview,confirmed:boolean,now=new Date().toISOString()){
 if(account.role!=='owner')throw new Error('Owner access is required for Preview Data Transfer.')
 if(!confirmed)throw new Error('Explicit confirmation is required before replacing the career.')
 if(currentActive?.runningSince!==null&&currentActive)throw new Error('Pause or end the active ride before importing career data.')
 const careerKey=careerStorageKey(account.id),rideKey=activeRideStorageKey(account.id),backup=makeBackup(account,current,currentActive,now),priorBackup=localStorage.getItem(backupKey(account.id)),priorCareer=localStorage.getItem(careerKey),priorRide=localStorage.getItem(rideKey)
 try{localStorage.setItem(backupKey(account.id),JSON.stringify(backup));localStorage.setItem(careerKey,JSON.stringify(preview.migrated));localStorage.setItem(rideKey,JSON.stringify(preview.payload.activeRide));replaceProgramEntitlements(account,preview.payload.programEntitlements??[]);return {career:preview.migrated,activeRide:preview.payload.activeRide,backup}}
 catch(error){if(priorCareer===null)localStorage.removeItem(careerKey);else localStorage.setItem(careerKey,priorCareer);if(priorRide===null)localStorage.removeItem(rideKey);else localStorage.setItem(rideKey,priorRide);if(priorBackup===null)localStorage.removeItem(backupKey(account.id));else localStorage.setItem(backupKey(account.id),priorBackup);replaceProgramEntitlements(account,account.entitlements);throw new Error(error instanceof Error?`Import failed: ${error.message}`:'Import failed; the existing career was preserved.',{cause:error})}
}
export function restoreRecoveryBackup(account:RiderAccount,confirmed:boolean){if(account.role!=='owner')throw new Error('Owner access is required.');if(!confirmed)throw new Error('Explicit confirmation is required.');const backup=readRecoveryBackup(account);if(!backup)throw new Error('No pre-import backup is available.');localStorage.setItem(careerStorageKey(account.id),JSON.stringify(migrateCareer(backup.career)));localStorage.setItem(activeRideStorageKey(account.id),JSON.stringify(backup.activeRide));replaceProgramEntitlements(account,backup.programEntitlements??account.entitlements);return backup}
