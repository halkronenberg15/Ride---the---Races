import type { CareerState } from '../types/career.ts'
import { projectCareerForRemote, remoteProjectionCounts, type RemoteCareerProjection } from './careerRemoteProjection.ts'

export type CareerSyncReceipt={
 version:1
 syncedAt:string
 localSchemaVersion:number
 counts:ReturnType<typeof remoteProjectionCounts>
}

export type RemoteCareerWriter={
 writeProjection:(userId:string,projection:RemoteCareerProjection)=>Promise<void>
}

export async function syncCareerToRemote(args:{
 userId:string
 career:CareerState
 writer:RemoteCareerWriter
 now?:string
}):Promise<CareerSyncReceipt>{
 if(!args.userId)throw new Error('Authenticated user ID is required for remote career sync.')
 const projection=projectCareerForRemote(args.career)
 await args.writer.writeProjection(args.userId,projection)
 return {
  version:1,
  syncedAt:args.now??new Date().toISOString(),
  localSchemaVersion:args.career.schemaVersion,
  counts:remoteProjectionCounts(projection),
 }
}
