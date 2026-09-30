export type DeviceProvider =
  | 'RTR'
  | 'POWER_METER'
  | 'WHOOP'
  | 'PELOTON'
  | 'GARMIN'
  | 'WAHOO'
  | 'STRAVA'
  | 'APPLE_HEALTH'
  | 'HEALTH_CONNECT'
  | 'ZWIFT'
  | 'MANUAL'

export type ConnectorTransport='BLUETOOTH'|'CLOUD_OAUTH'|'HEALTH_PLATFORM'|'APP_SYNC'|'MANUAL'

export type DataCapability=
  | 'RIDE'
  | 'POWER'
  | 'HEART_RATE'
  | 'CADENCE'
  | 'SPEED'
  | 'DISTANCE'
  | 'ELEVATION'
  | 'RECOVERY'
  | 'SLEEP'
  | 'STRAIN'
  | 'WEIGHT'
  | 'BODY_COMPOSITION'
  | 'WORKOUT'
  | 'HRV'
  | 'RESTING_HEART_RATE'

export type ConnectorDefinition={
  provider:DeviceProvider
  displayName:string
  transport:ConnectorTransport
  capabilities:DataCapability[]
  realtime:boolean
  requiresProviderAuthorization:boolean
  notes:string
}

export const CONNECTOR_REGISTRY:ConnectorDefinition[]=[
  {provider:'RTR',displayName:'Ride the Races',transport:'APP_SYNC',capabilities:['RIDE','POWER','HEART_RATE','CADENCE','SPEED','DISTANCE','ELEVATION','WORKOUT'],realtime:true,requiresProviderAuthorization:false,notes:'Authoritative source for RtR workout execution and completed RtR rides.'},
  {provider:'POWER_METER',displayName:'Bluetooth Power Meter',transport:'BLUETOOTH',capabilities:['POWER','CADENCE'],realtime:true,requiresProviderAuthorization:false,notes:'Native BLE cycling power connection for compatible pedals, cranks and hubs.'},
  {provider:'WHOOP',displayName:'WHOOP',transport:'CLOUD_OAUTH',capabilities:['HEART_RATE','RECOVERY','SLEEP','STRAIN','HRV','RESTING_HEART_RATE','WORKOUT'],realtime:false,requiresProviderAuthorization:true,notes:'Cloud connector when provider authorization is available; Health-platform ingestion may supplement supported metrics.'},
  {provider:'PELOTON',displayName:'Peloton',transport:'APP_SYNC',capabilities:['RIDE','POWER','HEART_RATE','CADENCE','WORKOUT'],realtime:false,requiresProviderAuthorization:true,notes:'Import workout results when a supported account/API path is available. Do not depend on undocumented endpoints.'},
  {provider:'GARMIN',displayName:'Garmin',transport:'CLOUD_OAUTH',capabilities:['RIDE','POWER','HEART_RATE','CADENCE','SPEED','DISTANCE','ELEVATION','RECOVERY','SLEEP','HRV','RESTING_HEART_RATE','WORKOUT'],realtime:false,requiresProviderAuthorization:true,notes:'Cloud activity and wellness import through supported Garmin integration paths.'},
  {provider:'WAHOO',displayName:'Wahoo',transport:'CLOUD_OAUTH',capabilities:['RIDE','POWER','HEART_RATE','CADENCE','SPEED','DISTANCE','ELEVATION','WORKOUT'],realtime:false,requiresProviderAuthorization:true,notes:'Cloud import when supported; BLE sensors may also connect directly during RtR execution.'},
  {provider:'STRAVA',displayName:'Strava',transport:'CLOUD_OAUTH',capabilities:['RIDE','POWER','HEART_RATE','CADENCE','SPEED','DISTANCE','ELEVATION','WORKOUT'],realtime:false,requiresProviderAuthorization:true,notes:'Activity import source. Prefer original device source when both are available to avoid duplicate evidence.'},
  {provider:'APPLE_HEALTH',displayName:'Apple Health',transport:'HEALTH_PLATFORM',capabilities:['RIDE','HEART_RATE','DISTANCE','WORKOUT','SLEEP','WEIGHT','BODY_COMPOSITION','HRV','RESTING_HEART_RATE'],realtime:false,requiresProviderAuthorization:true,notes:'On-device HealthKit bridge for user-authorized health and workout data.'},
  {provider:'HEALTH_CONNECT',displayName:'Health Connect',transport:'HEALTH_PLATFORM',capabilities:['RIDE','HEART_RATE','DISTANCE','WORKOUT','SLEEP','WEIGHT','BODY_COMPOSITION','RESTING_HEART_RATE'],realtime:false,requiresProviderAuthorization:true,notes:'Android health-platform bridge for user-authorized records.'},
  {provider:'ZWIFT',displayName:'Zwift',transport:'APP_SYNC',capabilities:['RIDE','POWER','HEART_RATE','CADENCE','SPEED','DISTANCE','ELEVATION','WORKOUT'],realtime:false,requiresProviderAuthorization:true,notes:'Import through supported account/export paths when available.'},
  {provider:'MANUAL',displayName:'Manual Entry',transport:'MANUAL',capabilities:['RIDE','POWER','HEART_RATE','RECOVERY','SLEEP','STRAIN','WEIGHT','BODY_COMPOSITION','WORKOUT','HRV','RESTING_HEART_RATE'],realtime:false,requiresProviderAuthorization:false,notes:'Fallback for evidence the rider enters directly.'}
]

export type NormalizedObservation={
  observationId:string
  athleteId:string
  provider:DeviceProvider
  capability:DataCapability
  occurredAt:string
  receivedAt:string
  value:number|string|boolean
  unit?:string
  sourceRecordId?:string
  confidence:'LOW'|'MEDIUM'|'HIGH'
  provenance:string
}

export type ConnectorStatus='DISCONNECTED'|'AUTHORIZING'|'CONNECTED'|'SYNCING'|'ERROR'

export type ConnectedSource={
  provider:DeviceProvider
  status:ConnectorStatus
  connectedAt?:string
  lastSyncAt?:string
  lastError?:string
  grantedCapabilities:DataCapability[]
}

export type ConnectorAdapter={
  definition:ConnectorDefinition
  connect():Promise<ConnectedSource>
  disconnect():Promise<void>
  sync(since?:string):Promise<NormalizedObservation[]>
}

const sourcePriority:Record<DeviceProvider,number>={
  RTR:100,
  POWER_METER:95,
  GARMIN:90,
  WAHOO:88,
  PELOTON:86,
  WHOOP:85,
  APPLE_HEALTH:75,
  HEALTH_CONNECT:75,
  ZWIFT:72,
  STRAVA:60,
  MANUAL:50,
}

export function connectorDefinition(provider:DeviceProvider){
  return CONNECTOR_REGISTRY.find(item=>item.provider===provider)??null
}

export function providersFor(capability:DataCapability){
  return CONNECTOR_REGISTRY.filter(item=>item.capabilities.includes(capability))
}

export function preferObservation(a:NormalizedObservation,b:NormalizedObservation){
  if(a.capability!==b.capability)return a
  if(a.sourceRecordId&&b.sourceRecordId&&a.sourceRecordId===b.sourceRecordId){
    return sourcePriority[b.provider]>sourcePriority[a.provider]?b:a
  }
  if(a.occurredAt===b.occurredAt&&String(a.value)===String(b.value)){
    return sourcePriority[b.provider]>sourcePriority[a.provider]?b:a
  }
  return Date.parse(b.receivedAt)>Date.parse(a.receivedAt)?b:a
}

export function dedupeObservations(observations:NormalizedObservation[]){
  const result:NormalizedObservation[]=[]
  for(const item of observations){
    const match=result.find(existing=>
      existing.capability===item.capability&&(
        Boolean(existing.sourceRecordId&&item.sourceRecordId&&existing.sourceRecordId===item.sourceRecordId)||
        (existing.occurredAt===item.occurredAt&&String(existing.value)===String(item.value))
      )
    )
    if(!match){result.push(item);continue}
    const preferred=preferObservation(match,item)
    if(preferred!==match){
      const index=result.indexOf(match)
      result[index]=preferred
    }
  }
  return result.sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt))
}

export function evidenceProvenanceLabel(observation:NormalizedObservation){
  const definition=connectorDefinition(observation.provider)
  return `${definition?.displayName??observation.provider} · ${observation.provenance}`
}
