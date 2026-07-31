import TeamHeader from '../components/TeamHeader'
import HeroCard from '../components/HeroCard'

type HomeScreenProps = {
  onContinue: () => void
}

function HomeScreen({ onContinue }: HomeScreenProps) {
  return (
    <>
      <TeamHeader />

      <HeroCard onContinue={onContinue} />

      <section className="progress-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TOUR PROGRESS</p>
            <h2>3 of 21 stages</h2>
          </div>

          <strong>14%</strong>
        </div>

        <div className="progress-track">
          <div className="progress-fill" />
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <p className="eyebrow">EXPLORE THE ROUTE</p>
          <h2>Tour Map</h2>
          <p>Review the stages, climbs, and roads ahead.</p>
        </article>

        <article className="dashboard-card">
          <p className="eyebrow">YOUR CAREER</p>
          <h2>Rider Passport</h2>
          <p>Track your results, achievements, and team history.</p>
        </article>

        <article className="dashboard-card">
          <p className="eyebrow">CHOOSE A CHALLENGE</p>
          <h2>Race Library</h2>
          <p>Ride Grand Tours, Classics, and legendary routes.</p>
        </article>

        <article className="dashboard-card">
          <p className="eyebrow">TEAM MEMORIES</p>
          <h2>Team Journal</h2>
          <p>Relive stage results, notes, and Jean's briefings.</p>
        </article>
      </section>

      <footer className="team-footer">
        <p>"The road decides nothing. The rider decides everything."</p>
        <span>Jean Moreau, Directeur Sportif</span>
      </footer>
    </>
  )
}

export default HomeScreen