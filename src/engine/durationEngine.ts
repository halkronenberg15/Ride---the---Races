import type { RideSegment } from '../data/raceStages.ts'

export const DURATION_MODES = ['QUICK', 'STANDARD', 'EXTENDED', 'EPIC', 'CUSTOM', 'RECOMMENDED'] as const
export type DurationMode = typeof DURATION_MODES[number]
export type DurationSelection = { mode: DurationMode; customMinutes?: number; recommendedMinutes?: number; targetMinutes?: number }
export type CompressionSection = { segmentIndex: number; originalSeconds: number; simulatedSeconds: number; preservation: 'decisive' | 'important' | 'transition' }
export type TimeCompressionMap = { mode: DurationMode; officialDurationSeconds: number; sections: CompressionSection[] }
export type PersistedDurationMode = Exclude<DurationMode, 'CUSTOM'>
export type StageDurationPlan = {
  classification: 'short-tt'|'long-tt'|'flat'|'rolling'|'hilly'|'medium-mountain'|'major-mountain'|'queen'
  customMinMinutes: number
  customMaxMinutes: number
  minutes: Record<PersistedDurationMode, number>
}
export type CourseDurationOption={minutes:number;mode:PersistedDurationMode;recommended:boolean}

const decisive = (segment: RideSegment) => /summit|attack|sprint|kom|final|time trial/i.test(`${segment.name} ${segment.type}`)
const important = (segment: RideSegment) => /climb|mountain|threshold|breakaway|chase/i.test(`${segment.name} ${segment.type}`)
const defaultFactor: Record<Exclude<DurationMode, 'CUSTOM' | 'RECOMMENDED'>, number> = { QUICK: .72, STANDARD: 1, EXTENDED: 1.25, EPIC: 1.55 }

export function stageDurationPlan(stage: { distanceKm: number; elevationM?:number; theme?: string; difficulty?: string; segments: RideSegment[] }): StageDurationPlan {
  const primary=`${stage.theme??''} ${stage.difficulty??''}`.toLowerCase()
  const description=`${primary} ${stage.segments.map(segment=>`${segment.name} ${segment.type}`).join(' ')}`.toLowerCase()
  const isTt=/time trial|\btt\b/.test(primary)||(!stage.theme&&/time trial|\btt\b/.test(description))
  const classification:StageDurationPlan['classification']=isTt?(stage.distanceKm<=25?'short-tt':'long-tt')
    :/queen/.test(primary)||(stage.elevationM??0)>=4500?'queen':/medium mountain/.test(primary)?'medium-mountain'
    :/major mountain|high mountain|summit finish/.test(primary)||(stage.elevationM??0)>=3000?'major-mountain'
    :/mountain/.test(primary)?'medium-mountain':/hilly|classic/.test(primary)?'hilly'
    :/flat|sprint/.test(primary)?'flat':/rolling/.test(primary)?'rolling':'rolling'
  const ranges:Record<StageDurationPlan['classification'],[number,number,number,number,number]>={
    'short-tt':[30,35,40,45,50], 'long-tt':[40,45,52,60,65], flat:[45,60,68,75,90], rolling:[50,60,75,90,105],
    hilly:[60,75,82,90,110], 'medium-mountain':[70,80,105,120,140], 'major-mountain':[80,90,105,120,140], queen:[90,105,112,120,150],
  }
  const [quick,standard,recommended,extended,epic]=ranges[classification]
  return {classification,customMinMinutes:quick,customMaxMinutes:epic,minutes:{QUICK:quick,STANDARD:standard,RECOMMENDED:recommended,EXTENDED:extended,EPIC:epic}}
}

export function durationSelectionForStage(stage: Parameters<typeof stageDurationPlan>[0], selection: DurationSelection): DurationSelection {
  const plan=stageDurationPlan(stage)
  if(selection.mode==='CUSTOM')return {...selection,customMinutes:Math.min(plan.customMaxMinutes,Math.max(plan.customMinMinutes,selection.customMinutes??plan.minutes.RECOMMENDED))}
  return {...selection,targetMinutes:plan.minutes[selection.mode]}
}

/** Rider-facing choices are concrete times; mode remains internal compression metadata. */
export function courseDurationOptions(stage:Parameters<typeof stageDurationPlan>[0]):CourseDurationOption[]{
  const plan=stageDurationPlan(stage)
  const modes:PersistedDurationMode[]=['QUICK','STANDARD','RECOMMENDED','EXTENDED','EPIC']
  const byMinutes=new Map<number,CourseDurationOption>()
  for(const mode of modes){const minutes=plan.minutes[mode],existing=byMinutes.get(minutes);byMinutes.set(minutes,{minutes,mode:mode==='RECOMMENDED'||!existing?mode:existing.mode,recommended:mode==='RECOMMENDED'||Boolean(existing?.recommended)})}
  return [...byMinutes.values()].sort((a,b)=>a.minutes-b.minutes)
}

/** Builds a weighted time map; route kilometres and segment order are copied unchanged. */
export function createTimeCompressionMap(segments: RideSegment[], selection: DurationSelection): TimeCompressionMap {
  const original = segments.reduce((sum, segment) => sum + segment.sec, 0)
  const requested = selection.targetMinutes ? selection.targetMinutes*60 : selection.mode === 'CUSTOM' ? (selection.customMinutes ?? original / 60) * 60
    : selection.mode === 'RECOMMENDED' ? (selection.recommendedMinutes ?? original / 60) * 60
    : original * defaultFactor[selection.mode]
  const weights = segments.map(segment => decisive(segment) ? .6 : important(segment) ? .85 : 1.3)
  const delta = requested - original
  const capacity = segments.reduce((sum, segment, index) => sum + segment.sec * weights[index], 0)
  const sections = segments.map((segment, index) => {
    const preservation = decisive(segment) ? 'decisive' : important(segment) ? 'important' : 'transition'
    const simulatedSeconds = Math.max(20, Math.round(segment.sec + delta * segment.sec * weights[index] / capacity))
    return { segmentIndex: index, originalSeconds: segment.sec, simulatedSeconds, preservation } satisfies CompressionSection
  })
  let remainder=Math.round(requested)-sections.reduce((sum,section)=>sum+section.simulatedSeconds,0)
  for(const section of [...sections].sort((a,b)=>b.preservation.localeCompare(a.preservation))){
    if(!remainder)break
    const adjustment=remainder<0?Math.max(remainder,20-section.simulatedSeconds):remainder
    section.simulatedSeconds+=adjustment; remainder-=adjustment
  }
  return { mode: selection.mode, officialDurationSeconds: sections.reduce((sum, section) => sum + section.simulatedSeconds, 0), sections }
}

export function applyDurationSelection(segments: RideSegment[], selection: DurationSelection) {
  const map = createTimeCompressionMap(segments, selection)
  return { segments: segments.map((segment, index) => ({ ...segment, sec: map.sections[index].simulatedSeconds })), map }
}
