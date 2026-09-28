import type { AthleteProfile, RideCompletedEvent, SharedRideRecord } from '../../athlete-contracts/src/index.ts'
import type { AthleteCloudRepository, AthleteEventPage, CloudSession } from './index.ts'

type SessionProvider=()=>Promise<CloudSession|null>

export class HttpAthleteCloudRepository implements AthleteCloudRepository{
  constructor(
    private readonly baseUrl:string,
    private readonly sessionProvider:SessionProvider,
    private readonly clearSession:()=>Promise<void>,
  ){}

  getSession(){return this.sessionProvider()}
  signOut(){return this.clearSession()}

  private async request<T>(path:string,init:RequestInit={}):Promise<T>{
    const session=await this.sessionProvider()
    if(!session)throw new Error('No authenticated athlete session.')
    const response=await fetch(this.baseUrl.replace(/\/$/,'')+path,{
      ...init,
      headers:{'content-type':'application/json','authorization':'Bearer '+session.accessToken,...init.headers},
    })
    if(!response.ok)throw new Error('Athlete cloud request failed ('+response.status+').')
    if(response.status===204)return undefined as T
    return response.json() as Promise<T>
  }

  getProfile(){return this.request<AthleteProfile|null>('/v1/athlete/profile')}
  saveProfile(profile:AthleteProfile){return this.request<void>('/v1/athlete/profile',{method:'PUT',body:JSON.stringify(profile)})}
  appendRideEvent(event:RideCompletedEvent){return this.request<void>('/v1/athlete/events',{method:'POST',body:JSON.stringify(event)})}
  listRideEvents(after?:string){
    const query=after?'?after='+encodeURIComponent(after):''
    return this.request<AthleteEventPage>('/v1/athlete/events'+query)
  }
  getRide(rideId:string){return this.request<SharedRideRecord|null>('/v1/athlete/rides/'+encodeURIComponent(rideId))}
  listRides(){return this.request<SharedRideRecord[]>('/v1/athlete/rides')}
}
