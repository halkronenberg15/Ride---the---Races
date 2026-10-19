import { useState } from 'react'
import type { CareerState } from '../types/career.ts'
import { careerStorageKey, type RiderAccount } from '../services/accountStore.ts'
import { clearSupabaseSession, ensureFreshSupabaseSession, readSupabaseSession, signInSupabase, signOutSupabase, signUpSupabase } from '../services/supabaseAuth.ts'
import { readSupabasePublicConfig } from '../services/supabaseConfig.ts'
import { syncAndVerifyCareerSnapshot, type VerifiedCareerSyncReceipt } from '../services/supabaseCareerSyncCoordinator.ts'
import { readVerifiedCloudCareer, type CloudCareerSnapshot } from '../services/supabaseCloudCareerReader.ts'
import { buildCloudRestorePreview, commitCloudCareerRestore, type CloudRestorePreview } from '../services/cloudCareerRestore.ts'
import { readCareerLocalMetadata } from '../services/careerRevision.ts'
import { reconcileCareerVersions, type CareerReconciliation } from '../services/careerReconciliation.ts'
import { readCloudStartupStatus } from '../services/cloudStartupReconciliation.ts'

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
 const [cloudSnapshot,setCloudSnapshot]=useState<CloudCareerSnapshot|null>(null)
 const [restorePreview,setRestorePreview]=useState<CloudRestorePreview|null>(null)
 const [restoreConfirmed,setRestoreConfirmed]=useState(false)
 const [reconciliation,setReconciliation]=useState<CareerReconciliation|null>(null)
 const [startupStatus]=useState(()=>readCloudStartupStatus())

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

 const checkCloud=()=>run(async()=>{
  if(!session)throw new Error('Connect a cloud account first.')
  const fresh=await ensureFreshSupabaseSession(config,session)
  setSession(fresh)
  const snapshot=await readVerifiedCloudCareer({config,session:fresh})
  if(!snapshot){setCloudSnapshot(null);setRestorePreview(null);setStatus('No cloud career snapshot exists yet. Sync this career first.');return}
  setCloudSnapshot(snapshot)
  setRestorePreview(buildCloudRestorePreview(career,snapshot))
  setReconciliation(reconcileCareerVersions(career,readCareerLocalMetadata(window.localStorage,careerStorageKey(account.id)),snapshot))
  setRestoreConfirmed(false)
  setStatus('Cloud backup loaded for comparison. Nothing has been replaced.')
 })

 const restoreCloud=()=>run(async()=>{
  if(!cloudSnapshot||!restoreConfirmed)throw new Error('Review and confirm the cloud restore first.')
  commitCloudCareerRestore({storage:window.localStorage,storageKey:careerStorageKey(account.id),localCareer:career,cloud:cloudSnapshot,confirmed:true})
  setStatus('Cloud career restored. Reloading RtR…')
  window.location.reload()
 })

 const disconnect=()=>run(async()=>{
  await signOutSupabase(config,session)
  clearSupabaseSession()
  setSession(null);setReceipt(null);setCloudSnapshot(null);setRestorePreview(null);setRestoreConfirmed(false);setReconciliation(null);setStatus('Cloud account disconnected from this browser.')
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
    <button type="button" disabled={busy} onClick={checkCloud}>Check cloud backup</button>
    <button type="button" disabled={busy} onClick={disconnect}>Disconnect cloud account</button>
   </div>
   {receipt?<dl>
    <div><dt>Last verified</dt><dd>{new Date(receipt.syncedAt).toLocaleString()}</dd></div>
    <div><dt>Rides</dt><dd>{receipt.counts.rides}</dd></div>
    <div><dt>Nutrition entries</dt><dd>{receipt.counts.nutritionEntries}</dd></div>
    <div><dt>Remembered meals</dt><dd>{receipt.counts.nutritionTemplates}</dd></div>
    <div><dt>Training journal</dt><dd>{receipt.counts.trainingJournalEntries}</dd></div>
   </dl>:null}
   {reconciliation?<p className={reconciliation.state==='MATCHED'?'selected-file':'identity-warning'} role="status"><strong>{reconciliation.state.replace('_',' ')}:</strong> {reconciliation.message}</p>:null}
   {restorePreview?<article className="import-preview cloud-restore-preview">
    <h3>Cloud restore preview</h3>
    <p><strong>Cloud copy:</strong> {new Date(restorePreview.cloudUpdatedAt).toLocaleString()}</p>
    <dl>
     <div><dt>Local rider</dt><dd>{restorePreview.local.riderName} · #{restorePreview.local.riderNumber}</dd></div>
     <div><dt>Cloud rider</dt><dd>{restorePreview.cloud.riderName} · #{restorePreview.cloud.riderNumber}</dd></div>
     <div><dt>Local rides</dt><dd>{restorePreview.local.rides}</dd></div>
     <div><dt>Cloud rides</dt><dd>{restorePreview.cloud.rides}</dd></div>
     <div><dt>Local nutrition</dt><dd>{restorePreview.local.nutrition}</dd></div>
     <div><dt>Cloud nutrition</dt><dd>{restorePreview.cloud.nutrition}</dd></div>
    </dl>
    {restorePreview.identityDiffers?<p className="identity-warning"><strong>Different rider identity.</strong> Restoring this cloud backup replaces the current local rider profile.</p>:null}
    <p>RtR will automatically preserve the current local career as a pre-restore backup before replacing it.</p>
    <label className="confirm-transfer"><input type="checkbox" checked={restoreConfirmed} onChange={event=>setRestoreConfirmed(event.target.checked)}/> I reviewed the comparison and understand that restore replaces the current local career.</label>
    <button type="button" disabled={busy||!restoreConfirmed} onClick={restoreCloud}>Restore this cloud career</button>
   </article>:null}
  </div>}

  {startupStatus?<p className={startupStatus.allowAutomaticMirror?'selected-file':'identity-warning'} role="status"><strong>Startup cloud check:</strong> {startupStatus.message}{startupStatus.allowAutomaticMirror?'':' Automatic mirroring is paused until the local/cloud difference is resolved.'}</p>:null}
  {status?<p className="selected-file" role="status">{status}</p>:null}
  {error?<p className="transfer-error" role="alert">{error}</p>:null}
  <small>During the 4.1 migration phase, local browser storage remains authoritative. Cloud restore only runs after a comparison, explicit confirmation, and an automatic pre-restore local backup.</small>
 </section>
}
