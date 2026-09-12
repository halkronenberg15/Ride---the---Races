import { createElement as h } from 'react'
import type { ProfileViewState } from '../engine/alpha4022.ts'
type GeographicMode='FULL_STAGE'|'CLIMB'
export function ProfileControls4023({climbAvailable,geographicMode,density,onGeographicMode,onDensity}:{climbAvailable:boolean;geographicMode:GeographicMode;density:ProfileViewState['mode'];onGeographicMode:(mode:GeographicMode)=>void;onDensity:(mode:ProfileViewState['mode'])=>void}){
 const controlStyle={background:'#512000',color:'#ffffff'}
 return h('footer',{className:'profile-control-footer','aria-label':'Profile controls'},
  climbAvailable?h('button',{type:'button',className:'profile-scale-control',style:controlStyle,'aria-pressed':geographicMode==='CLIMB','aria-label':geographicMode==='CLIMB'?'Show Full Stage':'Show Climb',onClick:()=>onGeographicMode(geographicMode==='CLIMB'?'FULL_STAGE':'CLIMB')},geographicMode==='CLIMB'?'SHOW FULL STAGE':'SHOW CLIMB'):null,
  h('button',{type:'button',className:'profile-view-control',style:controlStyle,'aria-pressed':density==='DETAIL','aria-label':density==='DETAIL'?'Show Overview':'Show Detail',onClick:()=>onDensity(density==='DETAIL'?'OVERVIEW':'DETAIL')},density==='DETAIL'?'SHOW OVERVIEW':'SHOW DETAIL'))
}
