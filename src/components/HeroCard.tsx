type HeroCardProps = {
  onContinue: () => void
}

function HeroCard({ onContinue }: HeroCardProps) {
  return (
    <section className="hero-card">
      <div>
        <p className="eyebrow">TODAY&apos;S ASSIGNMENT</p>
        <h2>Stage 3</h2>
        <p>Granollers → Les Angles</p>
        <span className="stage-type">Mountain Stage</span>
      </div>

      <button type="button" onClick={onContinue}>
        Continue Tour
      </button>
    </section>
  )
}

export default HeroCard