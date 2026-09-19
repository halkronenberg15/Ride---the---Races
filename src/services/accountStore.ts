export type AccountRole='rider'|'owner'
export type ProgramId='intro-cycling'|'outdoor-readiness'|'rtr-femmes'|'rtr-standard'
export const ACCOUNT_BACKEND_MODE='LOCAL_DEVELOPMENT' as const
export const MULTI_DEVICE_ENROLLMENT_AVAILABLE=false
export type RiderAccount={id:string;email:string;displayName:string;role:AccountRole;passwordHash:string;salt:string;entitlements:ProgramId[];requestedPrograms:ProgramId[];createdAt:string}

const ACCOUNTS_KEY='ride-the-races-accounts-v1'
const SESSION_KEY='ride-the-races-session-v1'
export const careerStorageKey=(accountId:string)=>accountId==='legacy-owner'?'ride-the-races-v2-career':`ride-the-races-v2-career:${accountId}`
export const activeRideStorageKey=(accountId:string)=>`ride-the-races-active-ride-v4.0.1:${accountId}`
const encoder=new TextEncoder()
const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes),value=>value.toString(16).padStart(2,'0')).join('')
const accounts=()=>{try{return (JSON.parse(localStorage.getItem(ACCOUNTS_KEY)??'[]') as RiderAccount[]).map(account=>({...account,entitlements:account.entitlements??[],requestedPrograms:account.requestedPrograms??[]}))}catch{return []}}
const save=(items:RiderAccount[])=>localStorage.setItem(ACCOUNTS_KEY,JSON.stringify(items))

async function passwordHash(password:string,salt:string){
 const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits'])
 return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:120_000,hash:'SHA-256'},key,256))
}

export function currentAccountId(){return localStorage.getItem(SESSION_KEY)}
export function accountById(id:string|null){return id?accounts().find(account=>account.id===id)??null:null}
export function signOutAccount(){localStorage.removeItem(SESSION_KEY)}
export function resumeLegacyOwner(){const owner=accountById('legacy-owner');if(!owner)return null;localStorage.setItem(SESSION_KEY,owner.id);return owner}
export async function registerAccount(input:{email:string;displayName:string;password:string}){
 const email=input.email.trim().toLowerCase(),displayName=input.displayName.trim()
 if(!email||!displayName||input.password.length<8)throw new Error('Enter a display name, valid email, and password of at least 8 characters.')
 if(accounts().some(account=>account.email===email))throw new Error('An account already exists for this email.')
 const salt=crypto.randomUUID(),account:RiderAccount={id:crypto.randomUUID(),email,displayName,role:'rider',salt,passwordHash:await passwordHash(input.password,salt),entitlements:['intro-cycling'],requestedPrograms:[],createdAt:new Date().toISOString()}
 save([...accounts(),account]);localStorage.setItem(SESSION_KEY,account.id);return account
}
export async function signInAccount(emailInput:string,password:string){
 const account=accounts().find(item=>item.email===emailInput.trim().toLowerCase())
 if(!account||account.passwordHash!==await passwordHash(password,account.salt))throw new Error('Email or password is incorrect.')
 localStorage.setItem(SESSION_KEY,account.id);return account
}
export function hasProgramAccess(account:RiderAccount,program:ProgramId){return account.role==='owner'||account.entitlements.includes(program)}
export function assignEnrollmentProgram(accountId:string,program:'intro-cycling'|'rtr-standard'|'rtr-femmes'){const updated=accounts().map(account=>account.id===accountId&&!account.entitlements.includes(program)?{...account,entitlements:[...account.entitlements,program]}:account);save(updated);return accountById(accountId)!}
export function requestProgram(accountId:string,program:ProgramId){const updated=accounts().map(account=>account.id===accountId&&!account.requestedPrograms.includes(program)?{...account,requestedPrograms:[...account.requestedPrograms,program]}:account);save(updated);return accountById(accountId)!}
export function grantProgram(actor:RiderAccount,targetAccountId:string,program:ProgramId){if(actor.role!=='owner')throw new Error('Owner access is required to grant a program.');const updated=accounts().map(account=>account.id===targetAccountId?{...account,entitlements:Array.from(new Set([...account.entitlements,program])),requestedPrograms:account.requestedPrograms.filter(item=>item!==program)}:account);save(updated);return accountById(targetAccountId)!}
export function listAccounts(actor:RiderAccount){if(actor.role!=='owner')throw new Error('Owner access is required to list accounts.');return accounts()}

/** Preserves an existing single-device career without converting it into a shared rider account. */
export function migrateLegacyOwner(displayName:string){
 const existing=accounts(),owner=existing.find(account=>account.id==='legacy-owner');if(owner)return owner
 if(!localStorage.getItem('ride-the-races-v2-career'))return null
 const priorSession=currentAccountId()
 const account:RiderAccount={id:'legacy-owner',email:'local-owner@ride-the-races.invalid',displayName:displayName||'Rider',role:'owner',passwordHash:'',salt:'',entitlements:['intro-cycling','outdoor-readiness','rtr-femmes','rtr-standard'],requestedPrograms:[],createdAt:new Date().toISOString()}
 save([...existing,account]);if(!priorSession)localStorage.setItem(SESSION_KEY,account.id);return account
}
