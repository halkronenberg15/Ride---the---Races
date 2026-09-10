import { createElement as h } from 'react'
import { gradientDifficultyColor } from '../engine/gradientRoad.ts'
import { mobileGradientWindow, type CanonicalCoursePosition } from '../engine/alpha4023.ts'
import type { RoadModel } from '../engine/roadModel.ts'
import { RiderMarker4023 } from './RiderMarker4023.ts'

type Props={model:RoadModel;position:CanonicalCoursePosition;currentResistance:string;nextResistance:string;formatDistance:(km:number)=>string;formatTime:(seconds:number)=>string;approach?:boolean}
const clamp=(value:number)=>Math.max(0,Math.min(1,value))

/** Continuous source-profile mountain. Every path uses the canonical climb
 * coordinate; colors are decoration over the same connected elevation line. */
export function ClimbProfile4023({model,position,currentResistance,nextResistance,formatDistance,formatTime,approach=false}:Props){
 const climb=model.climbs.find(item=>item.id===position.currentClimbId)
 if(!climb||position.climbCoordinate===null)return null
 const all=position.gradientSections
 const active=Math.max(0,all.indexOf(position.currentGradientSection!))
 const windowed=mobileGradientWindow(all,active)
 const first=windowed.sections[0]?.start??0,last=windowed.sections.at(-1)?.end??1,windowSpan=Math.max(.0001,last-first)
 const climbLength=climb.summitDistance-climb.startDistance
 const windowStart=climb.startDistance+first*climbLength,windowEnd=climb.startDistance+last*climbLength
 const source=model.points.filter(point=>point.position*model.distanceKm>=windowStart-1e-6&&point.position*model.distanceKm<=windowEnd+1e-6)
 const elevations=[model.elevationAt(windowStart/model.distanceKm),...source.map(point=>point.elevation),model.elevationAt(windowEnd/model.distanceKm)]
 const min=Math.min(...elevations),span=Math.max(1,Math.max(...elevations)-min)
 const xy=(km:number)=>({x:(km-windowStart)/(windowEnd-windowStart)*100,y:86-(model.elevationAt(km/model.distanceKm)-min)/span*68})
 const displayedCoordinate=approach?0:position.climbCoordinate
 const riderKm=climb.startDistance+displayedCoordinate*climbLength,rider=xy(Math.max(windowStart,Math.min(windowEnd,riderKm)))
 const segmentPath=(start:number,end:number)=>{
  const startKm=climb.startDistance+start*climbLength,endKm=climb.startDistance+end*climbLength
  const samples=[startKm,...source.map(point=>point.position*model.distanceKm).filter(km=>km>startKm&&km<endKm),endKm]
  return samples.map((km,index)=>`${index?'L':'M'}${xy(km).x.toFixed(3)},${xy(km).y.toFixed(3)}`).join(' ')
 }
 const summit=!approach&&(position.climbCompletion??0)===100
 const formattedChange=formatDistance(position.distanceToNextGradientBoundary??0)
 const readableChange=/^0\.0\s/.test(formattedChange)?formattedChange.replace(/^0\.0/,'<0.1'):formattedChange
 return h('section',{className:'climb-profile-4023','aria-label':`${climb.name} Climb View`},
  h('header',null,h('strong',null,climb.name),h('span',null,summit?'SUMMIT':`${approach?0:Math.round(position.climbCompletion??0)}%`),h('span',{className:'summit-metrics'},`${formatDistance(position.distanceToSummit??0)} · ${formatTime(position.timeToSummit??0)}`)),
  h('div',{className:'climb-guidance'},
   h('span',null,h('small',null,approach?'CLIMB START':'CURRENT'),h('strong',null,`${position.currentGradientSection?.gradient.toFixed(1)??'—'}%`),h('b',null,`${currentResistance} resistance`)),
   h('span',null,h('small',null,'NEXT'),h('strong',null,position.nextGradientSection?`${position.nextGradientSection.gradient.toFixed(1)}%`:'SUMMIT'),h('b',null,position.nextGradientSection?`${nextResistance} resistance`:'—')),
   h('span',{className:'change'},h('small',null,position.gradientBoundaryCrossing?'CHANGE':'CHANGE IN'),h('strong',null,position.gradientBoundaryCrossing?'NOW':readableChange))),
  h('div',{className:'climb-svg-region'},
   h('svg',{viewBox:'0 0 100 100',preserveAspectRatio:'none',role:'img','aria-label':'Continuous colored climb mountain'},...windowed.sections.map((section,index)=>{const d=segmentPath(section.start,section.end),left=(section.start-first)/windowSpan*100,right=(section.end-first)/windowSpan*100,end=xy(climb.startDistance+section.end*climbLength);return h('g',{key:`${section.start}-${section.end}`,className:index+windowed.start<active?'completed':index+windowed.start===active?'current':'upcoming'},h('path',{d:`${d} L${right},94 L${left},94 Z`,fill:gradientDifficultyColor(section.gradient)}),h('path',{d,fill:'none',stroke:gradientDifficultyColor(section.gradient),strokeWidth:index+windowed.start===active?5:3,vectorEffect:'non-scaling-stroke'}),h('circle',{cx:end.x,cy:end.y,r:'.6',fill:'currentColor'}))})),
   h(RiderMarker4023,{kind:'climb',left:clamp(rider.x/100)*100,top:rider.y,coordinate:displayedCoordinate})))

}
