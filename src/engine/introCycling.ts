import type { IntroCyclingAnswers, IntroCyclingPlan } from '../types/career.ts'
import type { RideSegment } from '../data/raceStages.ts'

export function createIntroCyclingPlan(answers:IntroCyclingAnswers):IntroCyclingPlan{
 const cautious=answers.cyclingExperience==='New'||answers.outdoorConfidence==='Low'||answers.limitations.trim().length>0
 const duration=cautious||answers.comfortableMinutes<=35?30:45
 const recoveryEvery=cautious||answers.weeklyDays<=2?2:3
 const powerCeilingPercent=answers.ftpKnown?(cautious?72:78):65
 const instructionDensity=answers.cadenceResistanceConfidence==='Low'||answers.shiftingBrakingConfidence==='Low'?'high':'standard'
 const cadenceComplexity=answers.cadenceResistanceConfidence==='Low'?'FOUNDATION' as const:'PROGRESSIVE' as const
 const calibration=answers.ftpKnown?[]:['intro-calibration'],ids=[...calibration,`intro-foundations-${duration}`,`intro-control-${duration}`,'intro-outdoor-45']
 const titles=[...(answers.ftpKnown?[]:['Intro Calibration Ride']),'Bike and Rhythm Foundations','Cadence and Resistance Control','Preparing for Longer and Outdoor Rides']
 const focuses=[...(answers.ftpKnown?[]:['Controlled cadence/load steps and RPE checkpoints establish an Intro Effort Baseline.']),'Setup, posture, smooth pedaling, cadence awareness, and easy resistance.','Separate cadence and resistance changes with recovery.','Sustainable pacing, rolling terrain, bike control, hydration, fueling, and outdoor preparation.']
 const spacing=Math.max(1,Math.floor(7/Math.max(1,answers.weeklyDays)))
 const rides=ids.map((id,index)=>({id,title:titles[index],durationMinutes:id==='intro-calibration'?30:id==='intro-outdoor-45'?45:duration,focus:focuses[index],scheduledDay:1+index*spacing,recoveryAfter:(index+1)%recoveryEvery===0}))
 return {startingDurationMinutes:duration,powerCeilingPercent,recoveryEveryRides:recoveryEvery,instructionDensity,cadenceComplexity,climbingIntroducedAfterRide:cautious?3:2,readinessAssessmentAfterRide:cautious?3:2,weeklyDays:answers.weeklyDays,comfortableMinutes:answers.comfortableMinutes,deliveryMode:answers.bikeAccess==='Both'?'HYBRID':answers.bikeAccess==='Outdoor'?'OUTDOOR_GUIDED':'INDOOR',outdoorChecklistStartsAfterRide:answers.outdoorConfidence==='Low'?2:1,rides}
}

export function applyIntroPrescription(segments:RideSegment[],ftp:number,plan:IntroCyclingPlan){
 const ceiling=Math.round(ftp*plan.powerCeilingPercent/100)
 return segments.map(segment=>{
  const values=segment.power.match(/\d+/g)?.map(Number)??[]
  const power=values.length>=2?`${Math.min(values[0],ceiling)}–${Math.min(values[1],ceiling)} W`:values.length?`Under ${Math.min(values[0],ceiling)} W`:segment.power
  const cadence=plan.cadenceComplexity==='FOUNDATION'?'85–95 rpm':segment.cadence
  const fixed=plan.instructionDensity==='high'?segment.fixed:(segment.fixed??[]).filter((_,index)=>index%2===0)
  return {...segment,power,cadence,target:`${segment.zone} • ${power}`,fixed,random:[]}
 })
}

export const OUTDOOR_READINESS_ITEMS=[['fit','Bike fit and equipment check'],['helmet','Helmet and safety equipment'],['braking','Braking and controlled stopping'],['shifting','Shifting fundamentals'],['look-back','Looking behind while holding a line'],['signals','Hand signals'],['awareness','Road awareness'],['group','Basic group-riding etiquette'],['fuel','Hydration and fueling'],['supervised','Plan a supervised first outdoor ride']] as const
export function introReadiness(completed:number,total:number,checklistCount=0){return {introComplete:completed>=total,indoorProgramReady:completed>=total,outdoorPreparationComplete:completed>=total&&checklistCount===OUTDOOR_READINESS_ITEMS.length,outdoorGroupRideCertified:false,advancedProgramReady:completed>=total&&checklistCount===OUTDOOR_READINESS_ITEMS.length}}
