import { createElement as h } from 'react'

/** Rider orientation is visual-only; canonical coordinates and profile paths are never transformed. */
export function RiderMarker4023({kind,left,top,coordinate}:{kind:'profile'|'climb';left:number;top:number;coordinate:number}){
 const icon=h('svg',{viewBox:'0 0 48 32','aria-hidden':'true',focusable:'false'},
  h('circle',{cx:10,cy:22,r:7,fill:'none',stroke:'currentColor',strokeWidth:2.4}),
  h('circle',{cx:37,cy:22,r:7,fill:'none',stroke:'currentColor',strokeWidth:2.4}),
  h('circle',{cx:26,cy:6,r:3.7,fill:'currentColor'}),
  h('path',{d:'M25 10l-6 7 8 1 5-7m-13 6-5 5m13-4 4 6m-12-7 8 7m4-13 6 5',fill:'none',stroke:'currentColor',strokeWidth:2.8,strokeLinecap:'round',strokeLinejoin:'round'}))
 return h('span',{className:kind==='climb'?'climb-rider':'profile-rider','data-direction':'right','data-course-coordinate':coordinate.toFixed(6),style:{left:left+'%',top:top+'%'}},h('span',{className:'rider-marker-halo'}),h('span',{className:'rider-glyph','aria-label':'Rider position'},icon))
}
