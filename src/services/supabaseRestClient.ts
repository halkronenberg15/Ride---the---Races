import type { SupabasePublicConfig } from './supabaseConfig.ts'

export type SupabaseSession={
 accessToken:string
 userId:string
 expiresAt?:number
}

export type SupabaseRequestOptions={
 method?:'GET'|'POST'|'PATCH'|'DELETE'
 path:string
 query?:Record<string,string>
 body?:unknown
 prefer?:string
}

export class SupabaseRestClient{
 constructor(private readonly config:SupabasePublicConfig,private readonly session:SupabaseSession){}

 async request<T>(options:SupabaseRequestOptions):Promise<T>{
  const url=new URL(this.config.url+'/rest/v1/'+options.path)
  Object.entries(options.query??{}).forEach(([key,value])=>url.searchParams.set(key,value))
  const response=await fetch(url,{
   method:options.method??'GET',
   headers:{
    apikey:this.config.publishableKey,
    Authorization:`Bearer ${this.session.accessToken}`,
    'Content-Type':'application/json',
    ...(options.prefer?{Prefer:options.prefer}:{}),
   },
   ...(options.body===undefined?{}:{body:JSON.stringify(options.body)}),
  })
  const text=await response.text()
  if(!response.ok)throw new Error(`Supabase request failed (${response.status}): ${text||response.statusText}`)
  if(!text)return undefined as T
  return JSON.parse(text) as T
 }
}
