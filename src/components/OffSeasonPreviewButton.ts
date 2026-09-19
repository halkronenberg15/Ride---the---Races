import { createElement, Fragment } from 'react'
import type { TrainingPlan } from '../engine/alpha4025.ts'

export function OffSeasonPreviewButton({authenticated,plan,onOpen}:{authenticated:boolean;plan:TrainingPlan|null;onOpen:()=>void}){
 if(!authenticated)return null
 const details=plan?createElement(Fragment,null,createElement('small',null,`Start date: ${new Date(`${plan.startDate}T12:00:00Z`).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'})}`),createElement('small',null,`Plan length: ${plan.weeks.length} weeks`)):null
 return createElement('button',{type:'button',className:'offseason-folder',onClick:onOpen},createElement('span',{className:'eyebrow'},'PREVIEW ACCESS'),createElement('strong',null,'OFF-SEASON TRAINING'),details,createElement('b',null,'Open Off-Season Plan'))
}
