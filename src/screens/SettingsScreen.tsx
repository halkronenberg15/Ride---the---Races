import { useCareer } from '../state/CareerContext'

export default function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { career, updateSettings } = useCareer()
  const { settings } = career

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
    </section>
  )
}
