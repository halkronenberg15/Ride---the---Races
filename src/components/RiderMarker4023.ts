import { createElement as h } from 'react'

/** Rider orientation is visual-only; canonical coordinates and profile paths are never transformed. */
export function RiderMarker4023({kind,left,top,coordinate}:{kind:'profile'|'climb';left:number;top:number;coordinate:number}){
 const icon=h('svg',{viewBox:'0 0 56 34','aria-hidden':'true',focusable:'false'},
  h('circle',{cx:11,cy:24,r:7.2,fill:'none',stroke:'currentColor',strokeWidth:2}),
  h('circle',{cx:44,cy:24,r:7.2,fill:'none',stroke:'currentColor',strokeWidth:2}),
  h('path',{d:'M11 24 L22 13 L30 24 L11 24 M22 13 L36 13 L44 24 M30 24 L36 13 M22 13 L19 9 M36 13 L40 9 L45 9',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'}),
  h('circle',{cx:31,cy:5.8,r:3.2,fill:'currentColor'}),
  h('path',{d:'M30 9 L25 13 L34 14 L39 10 M25 13 L22 18 M34 14 L30 20',fill:'none',stroke:'currentColor',strokeWidth:2.4,strokeLinecap:'round',strokeLinejoin:'round'}))
 return h('span',{className:kind==='climb'?'climb-rider':'profile-rider','data-direction':'right','data-course-coordinate':coordinate.toFixed(6),style:{left:left+'%',top:top+'%'}},h('span',{className:'rider-glyph','aria-label':'Rider position'},icon))
}
