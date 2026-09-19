import { useEffect, useRef } from 'react'
import { getCalendarMonth, getInitialMonth, type RaceCalendarEntry, type Season } from '../data/seasonCalendar'
import { CalendarTeamBusButton } from '../components/CalendarTeamBusButton'
import { useCareer } from '../state/CareerContext.tsx'
import { useAuth } from '../state/AuthContext.tsx'
import { useActiveRide } from '../state/ActiveRideContext.tsx'

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MonthCalendar({ year, month, races, currentRace, onOpenRace }: { year: number; month: number; races: RaceCalendarEntry[]; currentRace?: string; onOpenRace: (raceId: string) => void }) {
  const { leadingDays, dayCount } = getCalendarMonth(year, month)
  const cells = [...Array(leadingDays).fill(null), ...Array.from({ length: dayCount }, (_, index) => index + 1)]
  return <article className="month-calendar" data-month={month}>
    <header><h2>{monthNames[month]}</h2><strong>{year}</strong></header>
    <div className="calendar-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
    <div className="calendar-grid">{cells.map((day, index) => {
      if (!day) return <span className="calendar-blank" aria-hidden="true" key={`blank-${index}`} />
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayRaces = races.filter((race) => race.startDate === date)
      return <div className={`calendar-date${dayRaces.length ? ' has-race' : ''}`} key={date}><span>{day}</span>{dayRaces.map((race) => <button type="button" key={race.id} className={race.id === currentRace || race.name === currentRace ? 'current-race' : ''} style={{ '--race-color': race.leaderColor } as React.CSSProperties} onClick={() => onOpenRace(race.raceLibraryId)} aria-label={`${monthNames[month]} ${day}, ${year} – ${race.name} – Open race`}>{race.shortName}</button>)}</div>
    })}</div>
  </article>
}
export function CalendarMonthSection({year,month,races,currentRace,onOpenRace,onBack,setRef}:{year:number;month:number;races:RaceCalendarEntry[];currentRace?:string;onOpenRace:(raceId:string,month:number)=>void;onBack:()=>void;setRef:(node:HTMLDivElement|null)=>void}){return <div className="calendar-month-section" data-month-section={month} ref={setRef}><MonthCalendar year={year} month={month} races={races} currentRace={currentRace} onOpenRace={(id)=>onOpenRace(id,month)}/><CalendarTeamBusButton onBack={onBack}/></div>}

export default function SeasonCalendarScreen({ season, currentRace, onBack, onOpenRace }: { season: Season; currentRace?: string; onBack: () => void; onOpenRace: (raceId: string) => void }) {
  const monthRefs = useRef<(HTMLElement | null)[]>([])
  const {career,endSeason}=useCareer(),{account}=useAuth(),{ride}=useActiveRide()
  useEffect(() => { const saved=Number(sessionStorage.getItem('rtr-calendar-month')),savedScroll=Number(sessionStorage.getItem('rtr-calendar-scroll'));monthRefs.current[Number.isInteger(saved)?saved:getInitialMonth(season, currentRace)]?.scrollIntoView({ block: 'start' });if(Number.isFinite(savedScroll)&&savedScroll>0)requestAnimationFrame(()=>scrollTo({top:savedScroll,behavior:'auto'}));const remember=()=>{const month=monthRefs.current.reduce((best,node,index)=>node&&node.getBoundingClientRect().top<innerHeight/2?index:best,0);sessionStorage.setItem('rtr-calendar-month',String(month));sessionStorage.setItem('rtr-calendar-scroll',String(scrollY))};addEventListener('scroll',remember,{passive:true});return()=>removeEventListener('scroll',remember) }, [season, currentRace])
  const openRace=(raceId:string,month:number)=>{sessionStorage.setItem('rtr-calendar-month',String(month));sessionStorage.setItem('rtr-calendar-scroll',String(scrollY));onOpenRace(raceId)}
  return <section className="season-calendar-screen">
    <button type="button" onClick={onBack}>← Team Bus</button>
    <header className="compact-page-header"><p className="eyebrow">TEAM LORIOT • SEASON</p><h1>{season.year}</h1><p>Professional race calendar. Select a race start to open its roadbook.</p></header>
    {career.season.closure.status==='ENDED'?<section className="dashboard-card"><h2>Season archived</h2><p>Season ended {new Date(career.season.closure.endedAt!).toLocaleDateString()}. Official results are frozen; unlocked stages remain replayable and Off-Season Training is available.</p></section>:career.season.active?<section className="dashboard-card end-season-card"><h2>Season lifecycle</h2><p>Completed stages: {career.season.completedStages.length} · Incomplete stages: {21-career.season.completedStages.length}. Ending freezes results, archives the season, preserves rides for replay, and never rewrites classifications.</p>{ride?<p role="status">End Season is unavailable during an active ride. Pause and finish or end the ride first.</p>:<button type="button" disabled={career.season.completedStages.length<21&&account?.role!=='owner'} onClick={()=>window.confirm(`END SEASON? ${21-career.season.completedStages.length} stages are incomplete. Official results will be frozen and archived exactly once. Unlocked stages remain replayable.`)&&endSeason(career.season.completedStages.length<21)}>END SEASON{career.season.completedStages.length<21?' (OWNER EARLY OVERRIDE)':''}</button>}</section>:null}
    <div className="season-months">{monthNames.map((_, month) => <CalendarMonthSection key={month} year={season.year} month={month} races={season.races} currentRace={currentRace} onOpenRace={openRace} onBack={onBack} setRef={(node)=>{monthRefs.current[month]=node}}/>)}</div>
  </section>
}
