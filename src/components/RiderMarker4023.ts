import { createElement as h } from 'react'
/** Rider orientation is visual-only; canonical coordinates and profile paths are never transformed. */
export function RiderMarker4023({kind,left,top,coordinate}:{kind:'profile'|'climb';left:number;top:number;coordinate:number}){return h('span',{className:kind==='climb'?'climb-rider':'profile-rider','data-direction':'right','data-course-coordinate':coordinate.toFixed(6),style:{left:`${left}%`,top:`${top}%`}},h('span',{className:'rider-glyph','aria-label':'Rider facing right'},'🚴'))}
