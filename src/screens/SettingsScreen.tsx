import { useState } from 'react'
import packageMetadata from '../../package.json'
import { useCareer } from '../state/CareerContext'
import { useAuth } from '../state/AuthContext.tsx'
import { useActiveRide } from '../state/ActiveRideContext.tsx'
import { buildCareerExport, commitCareerImport, parseCareerExport, readRecoveryBackup, restoreRecoveryBackup, safeExportFilename, serializeCareerExport, type ImportPreview } from '../services/previewTransfer.ts'

export default function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { career, updateSettings } = useCareer()
  const {account}=useAuth(),{ride}=useActiveRide()
  const { settings } = career
  const [preview,setPreview]=useState<ImportPreview|null>(null),[error,setError]=useState(''),[selectedFilename,setSelectedFilename]=useState(''),[confirmed,setConfirmed]=useState(false),[backup]=useState(()=>account?readRecoveryBackup(account):null)
  const activeRunning=Boolean(ride&&ride.runningSince!==null)
  const download=(name:string,text:string)=>{const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();URL.revokeObjectURL(url)}
  const exportCareer=()=>{if(!account)return;try{setError('');const payload=buildCareerExport(account,career,ride,packageMetadata.version);download(safeExportFilename(career.rider.name,payload.exportedAt.slice(0,10)),serializeCareerExport(payload))}catch(value){setError(value instanceof Error?value.message:'Export failed.')}}
  const selectFile=async(event:React.ChangeEvent<HTMLInputElement>)=>{setPreview(null);setConfirmed(false);setError('');const file=event.target.files?.[0];setSelectedFilename(file?.name??'');if(!file)return;try{setPreview(parseCareerExport(await file.text(),career))}catch(value){setError(value instanceof Error?value.message:'Import validation failed.')}}
  const importCareer=()=>{if(!account||!preview)return;try{commitCareerImport(account,career,ride,preview,confirmed);location.reload()}catch(value){setError(value instanceof Error?value.message:'Import failed.')}}
  const restore=()=>{if(!account||!window.confirm('Restore the pre-import career backup and replace the current imported career?'))return;try{restoreRecoveryBackup(account,true);location.reload()}catch(value){setError(value instanceof Error?value.message:'Restore failed.')}}

  return (
    <section className="data-screen settings-screen">
      <button type="button" className="back-button" onClick={onBack}>← Team HQ</button>
      <header>
        <p className="eyebrow">RIDER PREFERENCES</p>
        <h1>Settings</h1>
        <p>Personalize the cockpit without disturbing your career data.</p>
      </header>

      <div className="settings-grid">
        <article className="settings-card">
          <div><h2>Appearance</h2><p>Choose how Ride the Races looks.</p></div>
          <label>Theme
            <select value={settings.theme} onChange={(e) => updateSettings({ theme: e.target.value as typeof settings.theme })}>
              <option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option>
            </select>
          </label>
          <label className="toggle-row"><span><strong>Reduce motion</strong><small>Minimize pulsing and movement</small></span><input type="checkbox" checked={settings.reducedMotion} onChange={(e) => updateSettings({ reducedMotion: e.target.checked })} /></label>
        </article>

        <article className="settings-card">
          <div><h2>Jean Moreau</h2><p>Control team-radio playback.</p></div>
          <label className="toggle-row"><span><strong>Jean voice</strong><small>Enable spoken briefings</small></span><input type="checkbox" checked={settings.jeanVoiceEnabled} onChange={(e) => updateSettings({ jeanVoiceEnabled: e.target.checked })} /></label>
          <label>Voice volume <strong>{Math.round(settings.jeanVoiceVolume * 100)}%</strong>
            <input type="range" min="0" max="1" step="0.05" value={settings.jeanVoiceVolume} onChange={(e) => updateSettings({ jeanVoiceVolume: Number(e.target.value) })} />
          </label>
        </article>

        <article className="settings-card">
          <div><h2>Ride preferences</h2><p>Global display and coaching choices.</p></div>
          <label>Measurements
            <select value={settings.measurementSystem} onChange={(e) => updateSettings({ measurementSystem: e.target.value as typeof settings.measurementSystem })}>
              <option value="imperial">Imperial</option><option value="metric">Metric</option>
            </select>
          </label>
          <label>Preferred ride duration
            <select value={settings.preferredRideDurationMode} onChange={(e) => updateSettings({ preferredRideDurationMode: e.target.value as typeof settings.preferredRideDurationMode })}>
              <option value="RECOMMENDED">Recommended</option><option value="QUICK">Quick</option><option value="STANDARD">Standard</option><option value="EXTENDED">Extended</option><option value="EPIC">Epic</option>
            </select>
            <small>Used as the default for professional stages; each briefing can override it.</small>
          </label>
          <label className="toggle-row"><span><strong>Daily reminders</strong><small>Save the preference for future notifications</small></span><input type="checkbox" checked={settings.dailyReminders} onChange={(e) => updateSettings({ dailyReminders: e.target.checked })} /></label>
        </article>
      </div>
      {account?.role==='owner'&&<section className="settings-card preview-transfer" aria-labelledby="preview-transfer-title"><div><p className="eyebrow">OWNER / DEVELOPMENT</p><h2 id="preview-transfer-title">PREVIEW DATA TRANSFER — DEVELOPMENT ONLY</h2><p>Preview deployments use separate browser storage. Export your rider career from the existing RtR deployment and import it into a preview to verify migration and new features.</p></div><p><strong>This is not cloud synchronization or production account portability.</strong> Files contain personal training information, are processed locally, are never uploaded by RtR, contain no credentials, and should be stored securely. Files are not encrypted.</p>{activeRunning&&<p className="transfer-error" role="alert">Pause or end the active ride before exporting or importing career data.</p>}<div className="transfer-actions"><button type="button" disabled={activeRunning} onClick={exportCareer}>Export My RtR Career</button><label className="file-picker">Import RtR Career<input type="file" accept="application/json,.json" disabled={activeRunning} onChange={selectFile}/></label></div>{selectedFilename&&<p className="selected-file"><strong>Selected:</strong> {selectedFilename}</p>}{error&&<p className="transfer-error" role="alert">{error}</p>}{preview&&<article className="import-preview"><h3>Import preview</h3><dl>{Object.entries({'Rider':`${preview.summary.riderName} · Rider #${preview.summary.riderNumber}`,'Source app':preview.summary.sourceApplicationVersion,'Source schema':preview.summary.sourceSchemaVersion,'Export date':new Date(preview.summary.exportedAt).toLocaleString(),'Current season':preview.summary.currentSeason,'Completed stages':preview.summary.completedStages,'Ride history':preview.summary.rideHistory,'Archived seasons':preview.summary.archivedSeasons,'FTP':preview.summary.ftp===null?'Unavailable':`${preview.summary.ftp} W`,'Series / programs':`${preview.summary.series} · ${preview.summary.programs}`,'Active ride':preview.summary.activeRideIncluded?'Compatible paused ride included':'Not included','Destination':'Current authenticated preview career will be replaced'}).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>{preview.summary.identityDiffers&&<p className="identity-warning"><strong>Different rider:</strong> this replaces {career.rider.name} · Rider #{career.rider.number} with {preview.summary.riderName} · Rider #{preview.summary.riderNumber}. Histories will not be merged.</p>}<p>This will replace the career data associated with the currently authenticated preview account. Authentication credentials will not be imported.</p><label className="confirm-transfer"><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/> I understand this replaces this account’s career and preserves its sign-in credentials.</label><button type="button" disabled={!confirmed||activeRunning} onClick={importCareer}>Confirm and replace career</button></article>}{backup&&<article className="backup-summary"><h3>Restore Pre-Import Backup</h3><p>{new Date(backup.createdAt).toLocaleString()} · {backup.rider.name} · Rider #{backup.rider.number} · Schema {backup.schemaVersion}</p><button type="button" disabled={activeRunning} onClick={restore}>Restore Pre-Import Backup</button></article>}</section>}
    </section>
  )
}
