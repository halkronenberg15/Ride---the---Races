import { createElement as h } from 'react'
/** Semantic start and finish overlays replace all generic/author marker duplicates. */
export function CourseEndpointMarkers4023({progress=0}:{progress?:number}){return h('div',{className:'course-endpoint-layer','aria-label':'Course endpoints'},h('span',{className:`profile-end-marker start${progress>0?' compact':''}`,'aria-label':'Kilometre Zero'},progress>0?'':'KM 0',h('i')),h('span',{className:'profile-end-marker finish','aria-label':'Finish'},'FINISH',h('i')))}
