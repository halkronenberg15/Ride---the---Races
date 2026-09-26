import { useEffect, useState } from 'react'
import { getCalendarMonth } from '../data/seasonCalendar.ts'
import { planMonths } from '../engine/offSeasonCalendar.ts'
import { availableRideChanges, canSwitchRideSetting, type CalendarAssignment, type TrainingPlan } from '../engine/alpha4025.ts'

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthName = (year: number, month: number) => new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month, 1)))
const shortLabel = (assignment: CalendarAssignment) => assignment.type === 'CYCLING' || assignment.type === 'ASSESSMENT' ? 'Ride' : assignment.type === 'STRENGTH' ? 'Strength' : assignment.type === 'MOBILITY' ? 'Mobility' : 'Rest'

export default function OffSeasonCalendar({ plan, today, activeOutdoorAssignmentId, onStartWorkout, onStartOutdoor, onMove, onChange, onSwitchSetting }: { plan: TrainingPlan; today: string; activeOutdoorAssignmentId:string|null; onStartWorkout: (workoutId: string, assignmentId: string) => void; onStartOutdoor: (assignmentId: string, resume: boolean) => void; onMove:(assignmentId:string,date:string)=>void; onChange:(assignmentId:string,workoutId:string)=>void; onSwitchSetting:(assignmentId:string)=>void }) {
  const assignments = plan.weeks.flatMap(week => week.assignments)
  const byDate = new Map(assignments.map(item => [item.date, item]))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [moveDate,setMoveDate]=useState(''),[changeId,setChangeId]=useState('')
  const selected = assignments.find(item => item.id === selectedId) ?? null
  const selectedWeek = plan.weeks.find(week => week.assignments.some(item => item.id === selectedId))
  useEffect(() => { if (selectedId) document.getElementById('training-date-details')?.scrollIntoView({ block: 'nearest' }) }, [selectedId])

  const details = selected && <article className="dashboard-card training-date-details" id="training-date-details" aria-live="polite">
      <p className="eyebrow">{selected.date} · {selected.day} · Week {selectedWeek?.number} · {selected.status}</p>
      <h3>{selected.title}</h3>
      {selectedWeek && <p><strong>{selectedWeek.camp}</strong> · {selectedWeek.focus}{selectedWeek.recoveryWeek ? ' · Recovery week' : ''}</p>}
      <p>{selected.purpose}</p>
      <p><strong>Plan:</strong> {selected.durationMinutes} minutes · {selected.environment.toLowerCase()} · {selected.effort}</p>
      <p>{selected.primary}</p>
      {selected.completion && <p><strong>Recorded:</strong> {new Date(selected.completion.completedAt).toLocaleString()} · {selected.completion.durationMinutes} minutes{selected.completion.notes ? ` · ${selected.completion.notes}` : ''}</p>}
      {selected.substitution && <p><strong>Adjustment:</strong> {selected.substitution.reason}</p>}
      <p><strong>Fueling:</strong> {selected.fueling.preRide} {selected.fueling.carbsPerHour === null ? '' : `${selected.fueling.carbsPerHour} g carbohydrate/hour.`} {selected.fueling.fluidMlPerHour === null ? '' : `${selected.fueling.fluidMlPerHour} ml fluid/hour.`}</p>
      <details><summary>Alternatives and recovery</summary><p><strong>Short:</strong> {selected.shortened}</p><p><strong>Indoor:</strong> {selected.indoorAlternative}</p><p><strong>Outdoor:</strong> {selected.outdoorAlternative}</p><p><strong>Recovery:</strong> {selected.recoveryAlternative}</p><p>{selected.fueling.recoveryPriority}</p></details>
      {(selected.type === 'CYCLING' || selected.type === 'ASSESSMENT') && selected.workoutId && <button type="button" className="primary-cta" disabled={Boolean(activeOutdoorAssignmentId&&activeOutdoorAssignmentId!==selected.id&&selected.environment==='OUTDOOR')} onClick={() => selected.environment === 'OUTDOOR' ? onStartOutdoor(selected.id, activeOutdoorAssignmentId===selected.id) : onStartWorkout(selected.workoutId!, selected.id)}>{activeOutdoorAssignmentId&&activeOutdoorAssignmentId!==selected.id&&selected.environment==='OUTDOOR'?'Finish the active outdoor ride first':activeOutdoorAssignmentId===selected.id&&selected.environment==='OUTDOOR' ? 'Resume Outdoor Ride' : selected.status === 'PLANNED' ? 'Open Ride Briefing' : 'Ride Again — Open Briefing'}</button>}
      {(selected.type==='CYCLING'||selected.type==='ASSESSMENT')&&!selected.completion&&selected.status!=='COMPLETED'&&selected.status!=='PARTIAL'&&<div className="training-ride-actions">
        {canSwitchRideSetting(selected)&&<button type="button" disabled={Boolean(activeOutdoorAssignmentId)} onClick={()=>onSwitchSetting(selected.id)}>Switch to {selected.environment==='OUTDOOR'?'indoor':'outdoor'} · same ride</button>}
        {selectedWeek?.assignments.some(item=>item.type==='REST'&&item.status==='PLANNED'&&item.date>=today)&&<label>Move ride to a rest day<select value={moveDate} onChange={event=>setMoveDate(event.target.value)}><option value="">Select day</option>{selectedWeek.assignments.filter(item=>item.type==='REST'&&item.status==='PLANNED'&&item.date>=today).map(item=><option key={item.id} value={item.date}>{item.day} · {item.date}</option>)}</select><button type="button" disabled={!moveDate||Boolean(activeOutdoorAssignmentId)} onClick={()=>{onMove(selected.id,moveDate);setMoveDate('')}}>Move ride</button></label>}
        {availableRideChanges(plan,selected.id).length>0&&<label>Change to a shorter or easier ride<select value={changeId} onChange={event=>setChangeId(event.target.value)}><option value="">Select workout</option>{availableRideChanges(plan,selected.id).map(workout=><option key={workout.id} value={workout.id}>{workout.title} · {workout.durationMinutes} min</option>)}</select><button type="button" disabled={!changeId||Boolean(activeOutdoorAssignmentId)} onClick={()=>{onChange(selected.id,changeId);setChangeId('')}}>Change workout</button></label>}
      </div>}
    </article>

  return <section className="offseason-calendar" aria-label={`Personalized ${plan.weeks.length}-week training calendar`}>
    <header className="offseason-calendar-heading"><h2>Personalized {plan.weeks.length}-week calendar</h2><p>{plan.explanation}</p><p>The 100-plus-mile consecutive-day goal requires later distance and recovery milestones; this calendar prescribes time, not guaranteed mileage. Select a date to see its workout, fueling, alternatives, and recorded status. Ride sessions stay available for another attempt.</p></header>
    <nav className="offseason-month-jump" aria-label="Jump to training month">{planMonths(plan).map(({ key, year, month }) => <a key={key} href={`#training-${key}`}>{monthName(year, month)}</a>)}</nav>
    <div className="season-months">{planMonths(plan).map(({ key, year, month }) => {
      const { leadingDays, dayCount } = getCalendarMonth(year, month)
      const cells = [...Array(leadingDays).fill(null), ...Array.from({ length: dayCount }, (_, index) => index + 1)]
      return <div className="training-month-section" key={key}><article className="month-calendar" id={`training-${key}`}>
        <header><h2>{monthName(year, month)}</h2><strong>TRAINING</strong></header>
        <div className="calendar-weekdays">{weekdays.map(day => <span key={day}>{day}</span>)}</div>
        <div className="calendar-grid">{cells.map((day, index) => {
          if (day === null) return <span className="calendar-blank" aria-hidden="true" key={`blank-${index}`} />
          const date = `${key}-${String(day).padStart(2, '0')}`
          const assignment = byDate.get(date)
          return <div className={`calendar-date training-date${date === today ? ' is-today' : ''}${assignment ? ' has-assignment' : ''}`} key={date}>
            {assignment ? <button type="button" className={`training-day-button training-${assignment.status.toLowerCase()}${selected?.id === assignment.id ? ' is-selected' : ''}`} aria-pressed={selected?.id === assignment.id} aria-label={`${date}: ${assignment.title}, ${assignment.status.toLowerCase()}. View training details`} onClick={() => setSelectedId(assignment.id)}><span className="training-day-number">{day}</span><span className="training-day-type">{shortLabel(assignment)}</span><span className="training-day-status">{assignment.status === 'COMPLETED' ? '✓' : assignment.status === 'PARTIAL' ? '◐' : assignment.status === 'PLANNED' ? '' : '•'}</span></button> : <span className="training-empty-date">{day}</span>}
          </div>
        })}</div>
      </article>
      {selected?.date.slice(0, 7) === key && details}
      </div>
    })}</div>
  </section>
}
