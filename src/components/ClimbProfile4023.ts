import { createElement as h } from 'react'
import { gradientDifficultyColor } from '../engine/gradientRoad.ts'
import { mobileGradientWindow, type CanonicalCoursePosition } from '../engine/alpha4023.ts'
import type { RoadModel } from '../engine/roadModel.ts'
import { RiderMarker4023 } from './RiderMarker4023.ts'

type Props={model:RoadModel;position:CanonicalCoursePosition;currentResistance:string;nextResistance:string;formatDistance:(km:number)=>string;formatTime:(seconds:number)=>string;approach?:boolean}
const clamp=(value:number)=>Math.max(0,Math.min(1,value))

/** Continuous source-profile mountain. Every path uses the canonical climb
 * coordinate; colors are decoration over the same connected elevation line. */
export function ClimbProfile4023({model,position,formatDistance,formatTime,approach=false}:Props){
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
 const currentGrade=position.currentGradientSection?.gradient??0
 const summitVisible=last>=.995
 return h('section',{className:'climb-profile-4023 broadcast-climb','aria-label':`${climb.name} Climb View`},
  h('header',null,
   h('div',{className:'climb-title-stack'},h('small',null,climb.name),h('strong',null,summit?'SUMMIT':`CLIMB ${approach?0:Math.round(position.climbCompletion??0)}%`)),
   h('div',{className:'climb-live-grade'},h('small',null,'CURRENT'),h('strong',null,`${currentGrade>0?'+':''}${currentGrade.toFixed(1)}%`)),
   h('span',{className:'summit-metrics'},`${formatDistance(position.distanceToSummit??0)} TO SUMMIT · ${formatTime(position.timeToSummit??0)} ETA`)
  ),
  h('div',{className:'climb-svg-region'},
   h('svg',{viewBox:'0 0 100 100',preserveAspectRatio:'none',role:'img','aria-label':'Continuous colored climb mountain'},
    h('defs',null,
     h('filter',{id:'climbGlow',x:'-20%',y:'-20%',width:'140%',height:'140%'},h('feGaussianBlur',{stdDeviation:'1.35',result:'blur'}),h('feMerge',null,h('feMergeNode',{in:'blur'}),h('feMergeNode',{in:'SourceGraphic'}))),
     h('linearGradient',{id:'climbSummitBeam',x1:'0',x2:'0',y1:'0',y2:'1'},h('stop',{offset:'0%',stopColor:'rgba(255,255,255,.7)'}),h('stop',{offset:'100%',stopColor:'rgba(255,255,255,0)'}))
    ),
    ...[20,40,60,80].map(y=>h('line',{key:`grid-y-${y}`,x1:0,x2:100,y1:y,y2:y,stroke:'rgba(255,255,255,.045)',strokeWidth:'.45',vectorEffect:'non-scaling-stroke'})),
    ...windowed.sections.map((section,index)=>{const d=segmentPath(section.start,section.end),left=(section.start-first)/windowSpan*100,right=(section.end-first)/windowSpan*100,end=xy(climb.startDistance+section.end*climbLength),state=index+windowed.start<active?'completed':index+windowed.start===active?'current':'upcoming';return h('g',{key:`${section.start}-${section.end}`,className:state},
      h('path',{d:`${d} L${right},94 L${left},94 Z`,fill:gradientDifficultyColor(section.gradient),opacity:state==='completed'?.34:state==='current'?.78:.52}),
      state==='current'?h('path',{d,fill:'none',stroke:gradientDifficultyColor(section.gradient),strokeWidth:8,opacity:.32,vectorEffect:'non-scaling-stroke',filter:'url(#climbGlow)'}):null,
      h('path',{d,fill:'none',stroke:gradientDifficultyColor(section.gradient),strokeWidth:state==='current'?4.7:2.7,vectorEffect:'non-scaling-stroke',filter:state==='current'?'url(#climbGlow)':undefined}),
      h('circle',{cx:end.x,cy:end.y,r:state==='current'?1.15:.55,fill:'#fff',opacity:state==='completed'?.45:.95})
    )}),
    summitVisible?h('g',{className:'climb-summit-beacon'},h('line',{x1:100,x2:100,y1:4,y2:95,stroke:'url(#climbSummitBeam)',strokeWidth:1.2,vectorEffect:'non-scaling-stroke'}),h('path',{d:'M93 10 L100 6 L100 15 Z',fill:'#fff'})):null
   ),
   h(RiderMarker4023,{kind:'climb',left:clamp(rider.x/100)*100,top:rider.y,coordinate:displayedCoordinate})
  ),
  h('div',{className:'climb-gradient-ribbon','aria-label':'Gradient blocks'},...windowed.sections.map((section,index)=>h('span',{key:`ribbon-${section.start}-${section.end}`,className:index+windowed.start===active?'active':index+windowed.start<active?'complete':'upcoming'},h('small',null,index+windowed.start===active?'NOW':'ROAD'),h('strong',null,`${section.gradient>0?'+':''}${section.gradient.toFixed(1)}%`)))
  ))

}
