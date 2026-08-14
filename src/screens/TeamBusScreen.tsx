import { teamLoriot } from '../game/team'
import type { Season } from '../data/seasonCalendar'

type Props = {
  onBack: () => void
  seasons: Season[]
  onOpenSeason: (year: number) => void
  onOpenTraining: () => void
  onOpenRoster: () => void
}

export default function TeamBusScreen({ onBack, seasons, onOpenSeason, onOpenTraining, onOpenRoster }: Props) {
  return <section className="team-bus-screen alpha38-team-bus">
    <button type="button" onClick={onBack}>← Back Home</button>
    <header className="compact-page-header"><p className="eyebrow">{teamLoriot.name.toUpperCase()}</p><h1>Team Bus</h1><p>Plan the season, prepare the team, and choose where we race.</p></header>
    <nav className="team-bus-destinations" aria-label="Team Bus destinations">
      <p className="eyebrow destination-heading">SEASONS</p>
      {seasons.map((season) => <button type="button" key={season.year} onClick={() => onOpenSeason(season.year)}><strong>{season.year} →</strong><small>{season.races.length} professional races</small></button>)}
      <button type="button" onClick={onOpenTraining}><strong>TRAINING RIDES</strong><small>Recovery and leg openers</small></button>
      <button type="button" onClick={onOpenRoster}><strong>TEAM ROSTER</strong><small>{teamLoriot.riders.length} Team Loriot riders</small></button>
    </nav>
  </section>
}
