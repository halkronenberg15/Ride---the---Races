type RestDayScreenProps = {
  onBackHome: () => void
  onReviewStages: () => void
}

function RestDayScreen({ onBackHome, onReviewStages }: RestDayScreenProps) {
  return (
    <section style={{ maxWidth: '900px', margin: '0 auto', padding: '42px 24px' }}>
      <p className="eyebrow">TOUR DE FRANCE 2026 • REST DAY 1</p>
      <h1 style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', margin: '8px 0 16px' }}>
        Week One Complete
      </h1>
      <p style={{ fontSize: '1.2rem', opacity: 0.82, maxWidth: '700px' }}>
        Nine stages are in the legs. Today is for easy movement, hydration, food,
        sleep, and absolutely no heroic nonsense.
      </p>

      <div className="dashboard-grid" style={{ marginTop: '30px' }}>
        <article className="dashboard-card">
          <p className="eyebrow">JEAN'S ORDER</p>
          <h2>Recover on purpose</h2>
          <p>Optional 20-minute recovery spin in Z1, or complete rest if fatigue is high.</p>
        </article>
        <article className="dashboard-card">
          <p className="eyebrow">TEAM CHECK</p>
          <h2>Refuel and reset</h2>
          <p>Hydrate, eat normally, and prepare the equipment for Stage 10.</p>
        </article>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '28px' }}>
        <button type="button" onClick={onReviewStages}>Review Week One</button>
        <button type="button" onClick={onBackHome}>Back Home</button>
      </div>
    </section>
  )
}

export default RestDayScreen
