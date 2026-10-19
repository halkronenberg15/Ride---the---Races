import { SupabaseRestClient } from './supabaseRestClient.ts'

const DEVICE_ID_KEY='ride-the-races-device-id-v1'
const CONSUMER='career-v1'

export type DeviceSyncCursor={
 deviceId:string
 revision:string|null
 updatedAt:string
}

export function getOrCreateDeviceId(storage:Pick<Storage,'getItem'|'setItem'>=localStorage){
 const existing=storage.getItem(DEVICE_ID_KEY)
 if(existing)return existing
 const created=crypto.randomUUID()
 storage.setItem(DEVICE_ID_KEY,created)
 return created
}

export async function writeDeviceSyncCursor(args:{
 client:SupabaseRestClient
 athleteId:string
 deviceId:string
 revision:string
 updatedAt?:string
}){
 const updatedAt=args.updatedAt??new Date().toISOString()
 await args.client.request<void>({
  method:'POST',
  path:'sync_cursors',
  query:{on_conflict:'athlete_id,device_id,consumer'},
  prefer:'resolution=merge-duplicates,return=minimal',
  body:[{
   athlete_id:args.athleteId,
   device_id:args.deviceId,
   consumer:CONSUMER,
   cursor:args.revision,
   updated_at:updatedAt,
  }],
 })
 return {deviceId:args.deviceId,revision:args.revision,updatedAt} satisfies DeviceSyncCursor
}

export async function readDeviceSyncCursor(args:{
 client:SupabaseRestClient
 athleteId:string
 deviceId:string
}):Promise<DeviceSyncCursor|null>{
 const rows=await args.client.request<Array<{device_id:string;cursor:string|null;updated_at:string}>>({
  path:'sync_cursors',
  query:{
   select:'device_id,cursor,updated_at',
   athlete_id:'eq.'+args.athleteId,
   device_id:'eq.'+args.deviceId,
   consumer:'eq.'+CONSUMER,
   limit:'1',
  },
 })
 const row=rows[0]
 return row?{deviceId:row.device_id,revision:row.cursor,updatedAt:row.updated_at}:null
}
