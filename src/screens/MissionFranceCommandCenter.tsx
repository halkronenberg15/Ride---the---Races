import { missionFranceSnapshot } from '../engine/missionFrance2028.ts'
import { useCareer } from '../state/CareerContext.tsx'

type Props={
 onBack:()=>void
 onOpenHealth:()=>void
 onOpenRideData:()=>void
 onOpenOffSeason:()=>void
}

const miles=(km:number)=>km*0.621371

export default function MissionFranceCommandCenter({onBack,onOpenHealth,onOpenRideData,onOpenOffSeason}:Props){
 const {career}=useCareer()
 const snapshot=missionFranceSnapshot(career)
 const powerToWeight=snapshot.ftp!==null&&snapshot.weightKg?snapshot.ftp/snapshot.weightKg:null
 return <section className="mission-france-screen">
  <button type="button" className="back-button" onClick={onBack}>← Team HQ</button>
  <header className="mission-france-hero">
   <p className="eyebrow">MISSION FRANCE 2028</p>
   <h1>Build the rider for the mountains.</h1>
   <p>One place to connect training, recovery, body composition, fueling and mountain-readiness evidence. No invented readiness score. Every conclusion below comes from data already recorded in RtR.</p>
  </header>

  <section className="mission-today-grid" aria-label="Current Mission France evidence">
   <article className="dashboard-card mission-primary-card"><small>FTP</small><strong>{snapshot.ftp===null?'Not set':snapshot.ftp+' W'}</strong><span>{powerToWeight!==null?powerToWeight.toFixed(2)+' W/kg from current rider weight':'Add current weight to show power-to-weight'}</span></article>
   <article className="dashboard-card"><small>LAST 7 DAYS</small><strong>{snapshot.rides7} rides · {snapshot.minutes7} min</strong><span>{miles(snapshot.distance7Km).toFixed(1)} mi recorded</span></article>
   <article className="dashboard-card"><small>LONGEST RIDE</small><strong>{snapshot.longestMinutes?snapshot.longestMinutes+' min':'—'}</strong><span>Recorded RtR ride history</span></article>
   <article className="dashboard-card"><small>BEST RIDING STREAK</small><strong>{snapshot.backToBack?snapshot.backToBack+' days':'—'}</strong><span>Consecutive days with recorded rides</span></article>
  </section>

  <section className="dashboard-card mission-daily-command">
   <div><p className="eyebrow">TODAY</p><h2>What should the Command Center know?</h2><p>Keep the inputs authoritative. Add what actually happened, then let RtR connect the dots.</p></div>
   <div className="mission-actions">
    <button type="button" onClick={onOpenHealth}>Update recovery</button>
    <button type="button" onClick={onOpenRideData}>Log / review ride data</button>
    <button type="button" onClick={onOpenOffSeason}>Open training plan</button>
   </div>
  </section>

  <section className="mission-pillars">
   <header><p className="eyebrow">FRANCE READINESS PILLARS</p><h2>Evidence, not a percentage</h2></header>
   <div className="mission-pillar-grid">{snapshot.pillars.map(pillar=><article className="dashboard-card mission-pillar" key={pillar.id}><small>{pillar.label}</small><strong>{pillar.state}</strong><p>{pillar.evidence}</p></article>)}</div>
  </section>

  <section className="dashboard-card mission-next-layer">
   <p className="eyebrow">NEXT DATA LAYER</p>
   <h2>Fueling + daily nutrition</h2>
   <p>The next Command Center build will add daily meals, protein, carbohydrate, hydration and ride-fueling inputs so RtR can answer whether the day’s nutrition supported the day’s training and recovery.</p>
  </section>
 </section>
}
