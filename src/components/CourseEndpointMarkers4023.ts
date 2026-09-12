import { createElement as h } from 'react'
/** KM0 remains an HTML overlay; Finish lives in the SVG at the final source sample. */
export function CourseEndpointMarkers4023({progress=0}:{progress?:number}){return h('div',{className:'course-endpoint-layer','aria-label':'Course start'},h('span',{className:`profile-end-marker start${progress>0?' compact':''}`,'aria-label':'Kilometre Zero'},progress>0?'':'KM 0',h('i')))}
export function CourseFinishMarker4023({y}:{y:number}){const labelY=Math.max(8,y-24);return h('g',{className:'course-finish-svg','aria-label':'Finish','data-endpoint-x':'100','data-endpoint-y':y.toFixed(3)},h('line',{x1:100,y1:y,x2:100,y2:labelY+3,stroke:'currentColor',strokeWidth:2,vectorEffect:'non-scaling-stroke'}),h('text',{x:98,y:labelY,textAnchor:'end'},'FINISH'))}
