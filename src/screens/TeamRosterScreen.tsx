import { teamLoriot } from '../game/team'
export default function TeamRosterScreen({ onBack }: { onBack: () => void }) {
  return <section className="team-bus-screen"><button type="button" onClick={onBack}>← Team Bus</button><header className="compact-page-header"><p className="eyebrow">TEAM LORIOT</p><h1>Team Roster</h1></header><section className="dashboard-card"><div className="roster-grid">{teamLoriot.riders.map(rider => <article key={rider.name}><strong>{rider.name}</strong><span>Climb {rider.climbing} • Endurance {rider.endurance} • IQ {rider.raceIQ}</span></article>)}</div></section></section>
}
