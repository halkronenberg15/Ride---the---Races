import { useEffect, useMemo, useState } from 'react'
import { getCalendarMonth } from '../data/seasonCalendar.ts'
import { planMonths } from '../engine/offSeasonCalendar.ts'
import { availableRideChanges, canSwitchRideSetting, type CalendarAssignment, type TrainingPlan } from '../engine/alpha4025.ts'

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthName = (year: number, month: number) => new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month, 1)))
const shortLabel = (assignment: CalendarAssignment) => assignment.type === 'CYCLING' || assignment.type === 'ASSESSMENT' ? 'Ride' : assignment.type === 'STRENGTH' ? 'Strength' : assignment.type === 'MOBILITY' ? 'Mobility' : 'Rest'

export default function OffSeasonCalendar({ plan, today, activeOutdoorAssignmentId, onStartWorkout, onStartOutdoor, onMove, onChange, onSwitchSetting }: { plan: TrainingPlan; today: string; activeOutdoorAssignmentId:string|null; onStartWorkout: (workoutId: string, assignmentId: string) => void; onStartOutdoor: (assignmentId: string, resume: boolean) => void; onMove:(assignmentId:string,date:string)=>void; onChange:(assignmentId:string,workoutId:string)=>void; onSwitchSetting:(assignmentId:string)=>void }) {
  const assignments = plan.weeks.flatMap(week => week.assignments)
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarAssignment[]>()
    for (const assignment of assignments) map.set(assignment.date, [...(map.get(assignment.date) ?? []), assignment])
    return map
  }, [assignments])
  const [selectedDate, setSelectedDate] = useState<string | null>(() => byDate.has(today) ? today : assignments.find(item => item.status === 'PLANNED')?.date ?? null)
  const [moveDate,setMoveDate]=useState(''),[changeId,setChangeId]=useState('')
  const selectedAssignments = selectedDate ? byDate.get(selectedDate) ?? [] : []
  const selectedWeek = plan.weeks.find(week => week.assignments.some(item => item.date === selectedDate))
  useEffect(() => { if (selectedDate) document.getElementById('training-date-details')?.scrollIntoView({ block: 'nearest' }) }, [selectedDate])

  const assignmentDetails = (selected: CalendarAssignment) => {
    const selectedWorkoutChanges = availableRideChanges(plan, selected.id)
    return <article className="training-session-card" key={selected.id}>
      <header className="training-session-heading"><div><p className="eyebrow">{shortLabel(selected)} · {selected.status}</p><h3>{selected.title}</h3></div><strong>{selected.durationMinutes} min</strong></header>
      <p>{selected.purpose}</p>
      <p><strong>Plan:</strong> {selected.environment.toLowerCase()} · {selected.effort}</p>
      <p>{selected.primary}</p>
      {selected.completion && <p><strong>Recorded:</strong> {new Date(selected.completion.completedAt).toLocaleString()} · {selected.completion.durationMinutes} minutes{selected.completion.notes ? ` · ${selected.completion.notes}` : ''}</p>}
      {selected.substitution && <p><strong>Adjustment:</strong> {selected.substitution.reason}</p>}
      <p><strong>Fueling:</strong> {selected.fueling.preRide} {selected.fueling.carbsPerHour === null ? '' : `${selected.fueling.carbsPerHour} g carbohydrate/hour.`} {selected.fueling.fluidMlPerHour === null ? '' : `${selected.fueling.fluidMlPerHour} ml fluid/hour.`}</p>
      <details><summary>Alternatives and recovery</summary><p><strong>Short:</strong> {selected.shortened}</p><p><strong>Indoor:</strong> {selected.indoorAlternative}</p><p><strong>Outdoor:</strong> {selected.outdoorAlternative}</p><p><strong>Recovery:</strong> {selected.recoveryAlternative}</p><p>{selected.fueling.recoveryPriority}</p></details>
      {(selected.type === 'CYCLING' || selected.type === 'ASSESSMENT') && selected.workoutId && <button type="button" className="primary-cta" disabled={Boolean(activeOutdoorAssignmentId&&activeOutdoorAssignmentId!==selected.id&&selected.environment==='OUTDOOR')} onClick={() => selected.environment === 'OUTDOOR' ? onStartOutdoor(selected.id, activeOutdoorAssignmentId===selected.id) : onStartWorkout(selected.workoutId!, selected.id)}>{activeOutdoorAssignmentId&&activeOutdoorAssignmentId!==selected.id&&selected.environment==='OUTDOOR'?'Finish the active outdoor ride first':activeOutdoorAssignmentId===selected.id&&selected.environment==='OUTDOOR' ? 'Resume Outdoor Ride' : selected.status === 'PLANNED' ? 'Open Ride Briefing' : 'Ride Again — Open Briefing'}</button>}
      {(selected.type==='CYCLING'||selected.type==='ASSESSMENT')&&!selected.completion&&selected.status!=='COMPLETED'&&selected.status!=='PARTIAL'&&<div className="training-ride-actions">
        {canSwitchRideSetting(selected)&&<button type="button" disabled={Boolean(activeOutdoorAssignmentId)} onClick={()=>onSwitchSetting(selected.id)}>Switch to {selected.environment==='OUTDOOR'?'indoor':'outdoor'} · same ride</button>}
        {selectedWeek?.assignments.some(item=>item.type==='REST'&&item.status==='PLANNED'&&item.date>=today)&&<label>Move ride to a rest day<select value={moveDate} onChange={event=>setMoveDate(event.target.value)}><option value="">Select day</option>{selectedWeek.assignments.filter(item=>item.type==='REST'&&item.status==='PLANNED'&&item.date>=today).map(item=><option key={item.id} value={item.date}>{item.day} · {item.date}</option>)}</select><button type="button" disabled={!moveDate||Boolean(activeOutdoorAssignmentId)} onClick={()=>{onMove(selected.id,moveDate);setMoveDate('');setSelectedDate(moveDate)}}>Move ride</button></label>}
        {selectedWorkoutChanges.length>0&&<label>Change to a shorter or easier ride<select value={changeId} onChange={event=>setChangeId(event.target.value)}><option value="">Select workout</option>{selectedWorkoutChanges.map(workout=><option key={workout.id} value={workout.id}>{workout.title} · {workout.durationMinutes} min</option>)}</select><button type="button" disabled={!changeId||Boolean(activeOutdoorAssignmentId)} onClick={()=>{onChange(selected.id,changeId);setChangeId('')}}>Change workout</button></label>}
      </div>}
    </article>
  }

  const details = selectedDate && selectedAssignments.length > 0 && <article className="dashboard-card training-date-details" id="training-date-details" aria-live="polite">
      <p className="eyebrow">{selectedDate} · {selectedAssignments[0]?.day} · Week {selectedWeek?.number}</p>
      <header className="training-day-detail-heading"><div><h2>Training day</h2>{selectedWeek && <p><strong>{selectedWeek.camp}</strong> · {selectedWeek.focus}{selectedWeek.recoveryWeek ? ' · Recovery week' : ''}</p>}</div><strong>{selectedAssignments.reduce((sum,item)=>sum+item.durationMinutes,0)} min total</strong></header>
      {selectedAssignments.length > 1 && <p className="training-double-note"><strong>Double-session day:</strong> {selectedAssignments.map(item => shortLabel(item)).join(' + ')}. These sessions are intentionally scheduled on the same date and are not treated as a conflict.</p>}
      <div className="training-session-list">{selectedAssignments.map(assignmentDetails)}</div>
    </article>

  return <section className="offseason-calendar" aria-label={`Personalized ${plan.weeks.length}-week training calendar`}>
    <header className="offseason-calendar-heading"><h2>Personalized {plan.weeks.length}-week calendar</h2><p>{plan.explanation}</p><p>Select a date to open that training day. Ride and strength sessions may intentionally share a date. The 100-plus-mile consecutive-day goal remains a later distance-and-recovery milestone; this calendar prescribes time, not guaranteed mileage.</p></header>
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
          const dayAssignments = byDate.get(date) ?? []
          const completeCount = dayAssignments.filter(item=>item.status==='COMPLETED').length
          const partial = dayAssignments.some(item=>item.status==='PARTIAL')
          const statusClass = dayAssignments.length===0?'':partial?'partial':completeCount===dayAssignments.length?'completed':'planned'
          const labels = dayAssignments.map(shortLabel)
          return <div className={`calendar-date training-date${date === today ? ' is-today' : ''}${dayAssignments.length ? ' has-assignment' : ''}`} key={date}>
            {dayAssignments.length ? <button type="button" className={`training-day-button training-${statusClass}${selectedDate === date ? ' is-selected' : ''}`} aria-pressed={selectedDate === date} aria-label={`${date}: ${dayAssignments.map(item=>item.title).join(', ')}. View training day`} onClick={() => setSelectedDate(date)}><span className="training-day-number">{day}</span><span className="training-day-type">{labels.join(' + ')}</span><span className="training-day-status">{completeCount===dayAssignments.length?'✓':partial?'◐':dayAssignments.length>1?String(dayAssignments.length):''}</span></button> : <span className="training-empty-date">{day}</span>}
          </div>
        })}</div>
      </article>
      {selectedDate?.slice(0, 7) === key && details}
      </div>
    })}</div>
  </section>
}
