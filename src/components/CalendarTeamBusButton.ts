import {createElement} from 'react'
export function CalendarTeamBusButton({onBack}:{onBack:()=>void}){return createElement('button',{type:'button',className:'calendar-team-bus',onClick:onBack},'← Back to Team Bus')}
