import { createElement as h } from 'react'

function VectorRider(){
 return h('svg',{viewBox:'0 0 52 34','aria-hidden':'true',focusable:'false'},
  h('circle',{className:'rider-wheel',cx:11,cy:24,r:7}),
  h('circle',{className:'rider-wheel',cx:41,cy:24,r:7}),
  h('path',{className:'rider-frame',d:'M11 24 L20 12 L29 24 L11 24 M20 12 L34 12 L41 24 M29 24 L34 12'}),
  h('path',{className:'rider-body',d:'M22 11 L27 5 L34 9 L30 14 L24 13 Z'}),
  h('circle',{className:'rider-head',cx:27,cy:3.7,r:2.7}),
  h('path',{className:'rider-limb',d:'M26 8 L20 12 M31 10 L36 13 M24 13 L29 18 M29 18 L33 22'})
 )
}

/** Rider orientation is visual-only; canonical coordinates and profile paths are never transformed. */
export function RiderMarker4023({kind,left,top,coordinate}:{kind:'profile'|'climb';left:number;top:number;coordinate:number}){
 return h('span',{
  className:kind==='climb'?'climb-rider':'profile-rider',
  'data-direction':'right',
  'data-course-coordinate':coordinate.toFixed(6),
  style:{left:`${left}%`,top:`${top}%`},
 },
  h('span',{className:'rider-marker-halo','aria-hidden':'true'}),
  h('span',{className:'rider-glyph','aria-label':'Rider facing right'},h(VectorRider))
 )
}
