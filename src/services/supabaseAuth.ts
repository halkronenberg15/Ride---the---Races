import type { SupabasePublicConfig } from './supabaseConfig.ts'
import type { SupabaseSession } from './supabaseRestClient.ts'

type AuthTokenPayload={
 access_token:string
 refresh_token?:string
 expires_at?:number
 expires_in?:number
 user:{id:string}
}

type SignUpPayload={
 access_token?:string
 refresh_token?:string
 expires_at?:number
 expires_in?:number
 user:{id:string}|null
}

const SESSION_KEY='ride-the-races-supabase-session-v1'

const parseSession=(payload:AuthTokenPayload|SignUpPayload):SupabaseSession|null=>{
 if(!payload.access_token||!payload.user?.id)return null
 return {
  accessToken:payload.access_token,
  refreshToken:payload.refresh_token,
  userId:payload.user.id,
  expiresAt:payload.expires_at??(payload.expires_in?Math.floor(Date.now()/1000)+payload.expires_in:undefined),
 }
}

async function authRequest<T>(config:SupabasePublicConfig,path:string,body:unknown,accessToken?:string):Promise<T>{
 const response=await fetch(config.url+'/auth/v1/'+path,{
  method:'POST',
  headers:{
   apikey:config.publishableKey,
   'Content-Type':'application/json',
   ...(accessToken?{Authorization:'Bearer '+accessToken}:{}),
  },
  body:JSON.stringify(body),
 })
 const text=await response.text()
 if(!response.ok)throw new Error(text||'Supabase authentication request failed.')
 return (text?JSON.parse(text):{}) as T
}

export async function signInSupabase(config:SupabasePublicConfig,email:string,password:string):Promise<SupabaseSession>{
 const payload=await authRequest<AuthTokenPayload>(config,'token?grant_type=password',{email:email.trim().toLowerCase(),password})
 const session=parseSession(payload)
 if(!session)throw new Error('Supabase sign-in did not return a usable session.')
 saveSupabaseSession(session)
 return session
}

export async function signUpSupabase(config:SupabasePublicConfig,input:{email:string;password:string;displayName:string}):Promise<{session:SupabaseSession|null;needsEmailConfirmation:boolean}>{
 const payload=await authRequest<SignUpPayload>(config,'signup',{email:input.email.trim().toLowerCase(),password:input.password,data:{display_name:input.displayName.trim()}})
 const session=parseSession(payload)
 if(session)saveSupabaseSession(session)
 return {session,needsEmailConfirmation:Boolean(payload.user&&!session)}
}

export async function refreshSupabaseSession(config:SupabasePublicConfig,session:SupabaseSession):Promise<SupabaseSession>{
 if(!session.refreshToken)throw new Error('Cloud session cannot refresh because no refresh token is available.')
 const payload=await authRequest<AuthTokenPayload>(config,'token?grant_type=refresh_token',{refresh_token:session.refreshToken})
 const refreshed=parseSession(payload)
 if(!refreshed)throw new Error('Supabase session refresh did not return a usable session.')
 saveSupabaseSession(refreshed)
 return refreshed
}

export async function ensureFreshSupabaseSession(config:SupabasePublicConfig,session:SupabaseSession):Promise<SupabaseSession>{
 const now=Math.floor(Date.now()/1000)
 if(!session.expiresAt||session.expiresAt-now>90)return session
 return refreshSupabaseSession(config,session)
}

export async function signOutSupabase(config:SupabasePublicConfig,session:SupabaseSession|null){
 try{if(session)await authRequest<Record<string,never>>(config,'logout',{},session.accessToken)}finally{clearSupabaseSession()}
}

export function readSupabaseSession(storage:Pick<Storage,'getItem'>=localStorage):SupabaseSession|null{
 try{
  const raw=storage.getItem(SESSION_KEY)
  if(!raw)return null
  const parsed=JSON.parse(raw) as SupabaseSession
  return parsed.accessToken&&parsed.userId?parsed:null
 }catch{return null}
}

export function saveSupabaseSession(session:SupabaseSession,storage:Pick<Storage,'setItem'>=localStorage){
 storage.setItem(SESSION_KEY,JSON.stringify(session))
}

export function clearSupabaseSession(storage:Pick<Storage,'removeItem'>=localStorage){
 storage.removeItem(SESSION_KEY)
}
