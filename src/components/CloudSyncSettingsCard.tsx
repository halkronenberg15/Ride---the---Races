import { useState } from 'react'
import type { CareerState } from '../types/career.ts'
import type { RiderAccount } from '../services/accountStore.ts'
import { clearSupabaseSession, ensureFreshSupabaseSession, readSupabaseSession, signInSupabase, signOutSupabase, signUpSupabase } from '../services/supabaseAuth.ts'
import { readSupabasePublicConfig } from '../services/supabaseConfig.ts'
import { syncAndVerifyCareerSnapshot, type VerifiedCareerSyncReceipt } from '../services/supabaseCareerSyncCoordinator.ts'

export default function CloudSyncSettingsCard({career,account}:{career:CareerState;account:RiderAccount}){
 const config=readSupabasePublicConfig()
 const defaultEmail=account.email.endsWith('.invalid')?'':account.email
 const [email,setEmail]=useState(defaultEmail)
 const [password,setPassword]=useState('')
 const [session,setSession]=useState(()=>readSupabaseSession())
 const [status,setStatus]=useState('')
 const [error,setError]=useState('')
 const [busy,setBusy]=useState(false)
 const [receipt,setReceipt]=useState<VerifiedCareerSyncReceipt|null>(null)

 const run=async(task:()=>Promise<void>)=>{
  setBusy(true);setError('')
  try{await task()}catch(value){setError(value instanceof Error?value.message:'Cloud operation failed.')}
  finally{setBusy(false)}
 }

 const createAccount=()=>run(async()=>{
  if(password.length<8)throw new Error('Use a password of at least 8 characters for the cloud account.')
  const result=await signUpSupabase(config,{email,password,displayName:career.rider.name||account.displayName})
  if(result.session){setSession(result.session);setStatus('Cloud account created and connected.')}
  else if(result.needsEmailConfirmation)setStatus('Cloud account created. Check your email to confirm it, then sign in here.')
  setPassword('')
 })

 const signIn=()=>run(async()=>{
  const next=await signInSupabase(config,email,password)
  setSession(next);setPassword('');setStatus('Cloud account connected.')
 })

 const sync=()=>run(async()=>{
  if(!session)throw new Error('Connect a cloud account first.')
  const fresh=await ensureFreshSupabaseSession(config,session)
  setSession(fresh)
  const next=await syncAndVerifyCareerSnapshot({config,session:fresh,career})
  setReceipt(next)
  setStatus('Cloud backup verified. Local browser data is still the primary copy.')
 })

 const disconnect=()=>run(async()=>{
  await signOutSupabase(config,session)
  clearSupabaseSession()
  setSession(null);setReceipt(null);setStatus('Cloud account disconnected from this browser.')
 })

 return <section className="settings-card cloud-sync-card" aria-labelledby="cloud-sync-title">
  <div>
   <p className="eyebrow">CLOUD DATA · 4.1 FOUNDATION</p>
   <h2 id="cloud-sync-title">Cloud Sync</h2>
   <p>Connect a Supabase rider account and create a verified cloud copy of this career. RtR reads the snapshot back and checks the tracked collection counts before marking the sync successful.</p>
  </div>

  {!session?<div className="cloud-sync-connect">
   <label>Email
    <input type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="you@example.com"/>
   </label>
   <label>Cloud password
    <input type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} placeholder="At least 8 characters"/>
   </label>
   <div className="transfer-actions">
    <button type="button" disabled={busy||!email||password.length<8} onClick={signIn}>Sign in to cloud</button>
    <button type="button" disabled={busy||!email||password.length<8} onClick={createAccount}>Create cloud account</button>
   </div>
   <small>This password is sent directly to Supabase Auth and is not saved in the RtR career file.</small>
  </div>:<div className="cloud-sync-connected">
   <p><strong>Cloud account connected.</strong> Supabase user {session.userId.slice(0,8)}…</p>
   <div className="transfer-actions">
    <button type="button" disabled={busy} onClick={sync}>{busy?'Working…':'Sync & verify now'}</button>
    <button type="button" disabled={busy} onClick={disconnect}>Disconnect cloud account</button>
   </div>
   {receipt?<dl>
    <div><dt>Last verified</dt><dd>{new Date(receipt.syncedAt).toLocaleString()}</dd></div>
    <div><dt>Rides</dt><dd>{receipt.counts.rides}</dd></div>
    <div><dt>Nutrition entries</dt><dd>{receipt.counts.nutritionEntries}</dd></div>
    <div><dt>Remembered meals</dt><dd>{receipt.counts.nutritionTemplates}</dd></div>
    <div><dt>Training journal</dt><dd>{receipt.counts.trainingJournalEntries}</dd></div>
   </dl>:null}
  </div>}

  {status?<p className="selected-file" role="status">{status}</p>:null}
  {error?<p className="transfer-error" role="alert">{error}</p>:null}
  <small>During the 4.1 migration phase, local browser storage remains authoritative. Cloud data will not replace the local career until restore and conflict handling are validated.</small>
 </section>
}
