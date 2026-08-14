import { teamLoriot } from '../game/team'

type Props = {
  onBack: () => void
  onOpenTour: () => void
  onOpenVuelta: () => void
  onOpenTraining: () => void
  onOpenRoster: () => void
}

export default function TeamBusScreen({ onBack, onOpenTour, onOpenVuelta, onOpenTraining, onOpenRoster }: Props) {
  return <section className="team-bus-screen alpha38-team-bus">
    <button type="button" onClick={onBack}>← Back Home</button>
    <header className="compact-page-header"><p className="eyebrow">{teamLoriot.name.toUpperCase()}</p><h1>Team Bus</h1><p>Choose a race, training ride, or team destination.</p></header>
    <nav className="team-bus-destinations" aria-label="Team Bus destinations">
      <button type="button" onClick={onOpenTour}><strong>TOUR DE FRANCE</strong><small>21-stage race roadbook</small></button>
      <button type="button" onClick={onOpenVuelta}><strong>LA VUELTA</strong><small>Dedicated race calendar</small></button>
      <button type="button" onClick={onOpenTraining}><strong>TRAINING RIDES</strong><small>Recovery and leg openers</small></button>
      <button type="button" onClick={onOpenRoster}><strong>TEAM ROSTER</strong><small>{teamLoriot.riders.length} Team Loriot riders</small></button>
    </nav>
  </section>
}
