import { useCareer } from '../state/CareerContext'

type FinaleScreenProps = { onReturnHome: () => void; onReviewTour: () => void }

function FinaleScreen({ onReturnHome, onReviewTour }: FinaleScreenProps) {
  const { career } = useCareer()
  return (
    <section className="team-bus-screen" style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
      <p className="eyebrow">PARIS • TOUR COMPLETE</p>
      <h1 style={{ fontSize: 'clamp(3.4rem, 10vw, 7rem)', margin: '8px 0 18px', lineHeight: .95 }}>Bienvenue à Paris</h1>
      <div className="dashboard-card" style={{ padding: '32px', textAlign: 'left' }}>
        <h2 style={{ marginTop: 0 }}>Jean Moreau • Final Team Radio</h2>
        <p style={{ fontSize: '1.2rem', lineHeight: 1.7 }}>
          “{career.rider.name}, twenty-one stages. Mountains, crosswinds, time trials, and every hard kilometer between Barcelona and Paris. You did not merely finish the Tour. You became the rider Team Loriot believed you could be.”
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginTop: '24px' }}>
          <div className="dashboard-card" style={{ padding: '18px' }}><strong>21</strong><br /><span style={{ opacity: .72 }}>Stages completed</span></div>
          <div className="dashboard-card" style={{ padding: '18px' }}><strong>2</strong><br /><span style={{ opacity: .72 }}>Rest days earned</span></div>
          <div className="dashboard-card" style={{ padding: '18px' }}><strong>Paris</strong><br /><span style={{ opacity: .72 }}>Final destination</span></div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '26px' }}>
        <button type="button" onClick={onReviewTour}>Review the Roadbook</button>
        <button type="button" onClick={onReturnHome}>Return to Team HQ</button>
      </div>
    </section>
  )
}

export default FinaleScreen
