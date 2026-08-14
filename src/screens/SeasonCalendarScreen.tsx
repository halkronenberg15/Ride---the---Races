import { useEffect, useRef } from 'react'
import { getCalendarMonth, getInitialMonth, type RaceCalendarEntry, type Season } from '../data/seasonCalendar'

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

export default function SeasonCalendarScreen({ season, currentRace, onBack, onOpenRace }: { season: Season; currentRace?: string; onBack: () => void; onOpenRace: (raceId: string) => void }) {
  const monthRefs = useRef<(HTMLElement | null)[]>([])
  useEffect(() => { monthRefs.current[getInitialMonth(season, currentRace)]?.scrollIntoView({ block: 'start' }) }, [season, currentRace])
  return <section className="season-calendar-screen">
    <button type="button" onClick={onBack}>← Team Bus</button>
    <header className="compact-page-header"><p className="eyebrow">TEAM LORIOT • SEASON</p><h1>{season.year}</h1><p>Professional race calendar. Select a race start to open its roadbook.</p></header>
    <div className="season-months">{monthNames.map((_, month) => <div key={month} ref={(node) => { monthRefs.current[month] = node }}><MonthCalendar year={season.year} month={month} races={season.races} currentRace={currentRace} onOpenRace={onOpenRace} /></div>)}</div>
  </section>
}
