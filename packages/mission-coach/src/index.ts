export type CoachEvidenceKind =
  | 'RIDE_COMPLETION'
  | 'RIDER_FEEDBACK'
  | 'RECOVERY'
  | 'STRENGTH'
  | 'SLEEP'
  | 'NUTRITION'
  | 'BODY_COMPOSITION'
  | 'SCHEDULE'

export type EvidenceValence='POSITIVE'|'NEUTRAL'|'NEGATIVE'|'RED_FLAG'

export type CoachEvidence={
  id:string
  occurredAt:string
  kind:CoachEvidenceKind
  valence:EvidenceValence
  summary:string
  source:string
  confidence:'LOW'|'MEDIUM'|'HIGH'
  tags:string[]
}

export type PlannedSession={
  assignmentId:string
  date:string
  workoutId:string
  title:string
  durationMinutes:number
  demand:1|2|3|4|5
  intensityFamily:'RECOVERY'|'ENDURANCE'|'TEMPO'|'SWEET_SPOT'|'THRESHOLD'|'VO2'|'ANAEROBIC'
}

export type CoachAction=
  | {kind:'KEEP'}
  | {kind:'SHORTEN';durationMinutes:number}
  | {kind:'EXTEND';durationMinutes:number}
  | {kind:'REPLACE';workoutId:string;title:string;durationMinutes:number;demand:1|2|3|4|5;intensityFamily:PlannedSession['intensityFamily']}
  | {kind:'REST'}

export type CoachProposal={
  proposalId:string
  generatedAt:string
  target:PlannedSession
  action:CoachAction
  scope:'NEXT_SESSION'|'CURRENT_WEEK'|'TRAINING_BLOCK'
  rationale:string
  evidenceIds:string[]
  model?:{provider:string;model:string;promptVersion:string}
}

export type CoachDecision={
  status:'APPROVED'|'REJECTED'|'NEEDS_RIDER_CONFIRMATION'
  appliedScope:'NEXT_SESSION'|'CURRENT_WEEK'|'TRAINING_BLOCK'
  action:CoachAction
  reasons:string[]
  evidence:CoachEvidence[]
}

const familyRank:Record<PlannedSession['intensityFamily'],number>={
  RECOVERY:0,ENDURANCE:1,TEMPO:2,SWEET_SPOT:3,THRESHOLD:4,VO2:5,ANAEROBIC:6
}

const unique=<T>(values:T[])=>Array.from(new Set(values))

export function coachEvidenceWindow(evidence:CoachEvidence[],targetDate:string,days=14){
  const target=Date.parse(targetDate+'T12:00:00Z')
  return evidence.filter(item=>{
    const at=Date.parse(item.occurredAt)
    return Number.isFinite(at)&&at<=target&&target-at<=days*86400000
  }).sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt))
}

export function validateCoachProposal(proposal:CoachProposal,allEvidence:CoachEvidence[]):CoachDecision{
  const evidenceIds=new Set(proposal.evidenceIds)
  const evidence=coachEvidenceWindow(allEvidence,proposal.target.date).filter(item=>evidenceIds.has(item.id))
  const reasons:string[]=[]
  const red=evidence.filter(item=>item.valence==='RED_FLAG')
  const negative=evidence.filter(item=>item.valence==='NEGATIVE')
  const positive=evidence.filter(item=>item.valence==='POSITIVE')
  const highConfidencePositive=positive.filter(item=>item.confidence==='HIGH'||item.confidence==='MEDIUM')
  const daysWithPositive=unique(highConfidencePositive.map(item=>item.occurredAt.slice(0,10)))
  const fatigueSignals=evidence.filter(item=>item.tags.some(tag=>['fatigue','pain','illness','poor-recovery','sleep-debt'].includes(tag)))
  const logisticsOnly=evidence.filter(item=>item.tags.includes('logistics')&&!item.tags.some(tag=>['fatigue','pain','illness'].includes(tag)))

  if(!evidence.length){
    return {status:'REJECTED',appliedScope:'NEXT_SESSION',action:{kind:'KEEP'},reasons:['No cited recent evidence supports this adaptation.'],evidence:[]}
  }

  if(red.length){
    reasons.push('A red-flag recovery, pain or illness signal blocks workload progression.')
    if(proposal.action.kind==='REST'||proposal.action.kind==='SHORTEN')return {status:'APPROVED',appliedScope:'NEXT_SESSION',action:proposal.action,reasons,evidence}
    return {status:'REJECTED',appliedScope:'NEXT_SESSION',action:{kind:'KEEP'},reasons,evidence}
  }

  const original=proposal.target
  const action=proposal.action
  const nextDuration=action.kind==='EXTEND'||action.kind==='SHORTEN'||action.kind==='REPLACE'?action.durationMinutes:action.kind==='REST'?0:original.durationMinutes
  const nextDemand=action.kind==='REPLACE'?action.demand:action.kind==='REST'?1:original.demand
  const nextFamily=action.kind==='REPLACE'?action.intensityFamily:action.kind==='REST'?'RECOVERY':original.intensityFamily
  const durationIncrease=(nextDuration-original.durationMinutes)/Math.max(1,original.durationMinutes)
  const intensityIncrease=familyRank[nextFamily]>familyRank[original.intensityFamily]||nextDemand>original.demand
  const workloadIncrease=nextDuration>original.durationMinutes||intensityIncrease

  if(fatigueSignals.length&&workloadIncrease){
    return {status:'REJECTED',appliedScope:'NEXT_SESSION',action:{kind:'KEEP'},reasons:['Recent fatigue, pain, illness or poor-recovery evidence does not support increasing workload.'],evidence}
  }

  if(negative.length&&workloadIncrease){
    return {status:'REJECTED',appliedScope:'NEXT_SESSION',action:{kind:'KEEP'},reasons:['Recent negative training evidence blocks progression until the rider responds successfully.'],evidence}
  }

  if(workloadIncrease&&!highConfidencePositive.length){
    return {status:'REJECTED',appliedScope:'NEXT_SESSION',action:{kind:'KEEP'},reasons:['A workload increase requires positive rider evidence with at least medium confidence.'],evidence}
  }

  if(action.kind==='EXTEND'&&durationIncrease>.5){
    return {status:'REJECTED',appliedScope:'NEXT_SESSION',action:{kind:'KEEP'},reasons:['A single adaptation may not increase session duration by more than 50%.'],evidence}
  }

  if(action.kind==='EXTEND'&&intensityIncrease){
    return {status:'REJECTED',appliedScope:'NEXT_SESSION',action:{kind:'KEEP'},reasons:['Do not increase duration and intensity in the same local progression.'],evidence}
  }

  if(proposal.scope==='TRAINING_BLOCK'){
    const spanDays=daysWithPositive.length?Math.round((Date.parse(daysWithPositive.at(-1)!)-Date.parse(daysWithPositive[0]))/86400000):0
    if(daysWithPositive.length<3||spanDays<7){
      reasons.push('Training-block changes require repeated successful evidence across at least three days and seven calendar days.')
      return {status:'NEEDS_RIDER_CONFIRMATION',appliedScope:'NEXT_SESSION',action, reasons,evidence}
    }
  }

  if(proposal.scope==='CURRENT_WEEK'&&highConfidencePositive.length<2&&workloadIncrease){
    reasons.push('One successful signal can justify a local change, not a multi-session rewrite.')
    return {status:'NEEDS_RIDER_CONFIRMATION',appliedScope:'NEXT_SESSION',action,reasons,evidence}
  }

  if(logisticsOnly.length){
    reasons.push('Logistical omissions are not interpreted as fatigue or failed completion.')
  }
  if(workloadIncrease)reasons.push('Recent positive evidence supports a bounded progression.')
  else if(action.kind==='KEEP')reasons.push('Current evidence supports preserving the planned session.')
  else reasons.push('The proposed reduction is supported by the cited evidence.')

  const appliedScope=proposal.scope==='TRAINING_BLOCK'?'TRAINING_BLOCK':proposal.scope==='CURRENT_WEEK'?'CURRENT_WEEK':'NEXT_SESSION'
  return {status:'APPROVED',appliedScope,action,reasons,evidence}
}

export function coachingReceipt(proposal:CoachProposal,decision:CoachDecision){
  const action=decision.action
  const change=action.kind==='KEEP'
    ? 'Keep original session'
    : action.kind==='REST'
      ? 'Rest'
      : action.kind==='SHORTEN'
        ? `Shorten to ${action.durationMinutes} min`
        : action.kind==='EXTEND'
          ? `Extend to ${action.durationMinutes} min`
          : `Replace with ${action.title} (${action.durationMinutes} min)`
  return {
    proposalId:proposal.proposalId,
    original:`${proposal.target.title} · ${proposal.target.durationMinutes} min`,
    change,
    scope:decision.appliedScope,
    status:decision.status,
    why:decision.reasons,
    evidence:decision.evidence.map(item=>item.summary),
  }
}
