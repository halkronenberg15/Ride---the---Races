import { raceStages } from '../data/raceStages'
import { teamLoriot } from '../game/team'
import { useCareer } from '../state/CareerContext'
import { formatDistance, formatElevation } from '../utils/units'

type TeamBusScreenProps = {
  selectedStageNumber: number
  onSelectStage: (stageNumber: number) => void
  onBack: () => void
  onContinue: () => void
  onOpenRestDay: () => void
}

function TeamBusScreen({
  selectedStageNumber,
  onSelectStage,
  onBack,
  onContinue,
  onOpenRestDay,
}: TeamBusScreenProps) {
  const { career } = useCareer()
  const system = career.settings.measurementSystem
  const selectedStage =
    raceStages.find((stage) => stage.number === selectedStageNumber) ?? raceStages[0]

  return (
    <section className="team-bus-screen" style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 48px' }}>
      <button type="button" onClick={onBack}>← Back Home</button>

      <header style={{ textAlign: 'center', marginBottom: '32px' }}>
        <p className="eyebrow" style={{ marginBottom: '6px' }}>{teamLoriot.name.toUpperCase()}</p>
        <h1 style={{ margin: 0, fontSize: 'clamp(3rem, 8vw, 5rem)', lineHeight: 1 }}>Team Bus</h1>
        <p style={{ marginTop: '18px', marginBottom: 0, fontSize: '1.1rem', opacity: 0.8 }}>
          Tour Roadbook • Complete 21-Stage Career
        </p>
      </header>

      <div className="dashboard-card" style={{ padding: '24px' }}>
        <p className="eyebrow">SELECT A STAGE</p>
        <h2 style={{ marginTop: 0 }}>Stages 1–21 Roadbook</h2>
        <div style={{ display: 'grid', gap: '10px' }}>
          {raceStages.map((stage) => {
            const minutes = Math.round(stage.segments.reduce((sum, segment) => sum + segment.sec, 0) / 60)
            const selected = stage.number === selectedStageNumber

            return (
              <div key={stage.number} style={{ display: 'grid', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => onSelectStage(stage.number)}
                  aria-pressed={selected}
                  style={{
                    textAlign: 'left',
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    gap: '14px',
                    alignItems: 'center',
                    outline: selected ? '2px solid rgba(255,170,90,.9)' : undefined,
                  }}
                >
                  <strong>{stage.number}</strong>
                  <span>
                    <strong style={{ display: 'block' }}>{stage.route}</strong>
                    <small style={{ opacity: 0.72 }}>{stage.theme}</small>
                  </span>
                  <span>{minutes} min</span>
                </button>

                {stage.number === 9 && (
                  <button type="button" onClick={onOpenRestDay} style={{ textAlign: 'left' }}>
                    🛌 Rest Day 1 • Recovery after Stage 9
                  </button>
                )}

                {stage.number === 15 && (
                  <button type="button" onClick={onOpenRestDay} style={{ textAlign: 'left' }}>
                    🛌 Rest Day 2 • Recovery after Stage 15
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="dashboard-card" style={{ padding: '24px' }}>
        <p className="eyebrow">TODAY'S SELECTION</p>
        <h2 style={{ marginTop: 0 }}>Stage {selectedStage.number}: {selectedStage.route}</h2>
        <p>{selectedStage.objective}</p>
        <p style={{ opacity: 0.75 }}>
          {formatDistance(selectedStage.distanceKm, system)} • {formatElevation(selectedStage.elevationM, system)} D+ • Difficulty {selectedStage.difficulty}
        </p>
      </div>

      <div className="dashboard-card" style={{ padding: '24px' }}>
        <h2 style={{ marginTop: 0, marginBottom: '24px', textAlign: 'center' }}>Stage Roster</h2>
        <div>
          {teamLoriot.riders.map((rider, index) => (
            <article
              key={rider.name}
              style={{
                padding: '18px 20px',
                marginBottom: index === teamLoriot.riders.length - 1 ? 0 : '14px',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.035)',
              }}
            >
              <h3 style={{ margin: 0, marginBottom: '7px', fontSize: '1.2rem' }}>{rider.name}</h3>
              <p style={{ margin: 0, lineHeight: 1.6, opacity: 0.88 }}>
                Age {rider.age} • Endurance {rider.endurance} • Sprint {rider.sprint} • Climbing {rider.climbing} • Time Trial {rider.timeTrial} • Race IQ {rider.raceIQ}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '28px' }}>
        <button type="button" onClick={onContinue}>Open Stage {selectedStage.number} Tactics</button>
      </div>
    </section>
  )
}

export default TeamBusScreen
