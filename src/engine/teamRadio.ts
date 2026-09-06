export type RadioPriority='coaching'|'marker'|'decision'|'safety'
export type TeamRadioMessage={id:string;text:string;priority:RadioPriority;createdAt:string;requiresAnswer?:boolean}
const rank:Record<RadioPriority,number>={coaching:0,marker:1,decision:2,safety:3}
export function captionDurationMs(text:string){return Math.min(10000,Math.max(6000,4000+text.split(/\s+/).length*260))}
export function enqueueRadio(queue:TeamRadioMessage[],message:TeamRadioMessage){return [...queue,message].sort((a,b)=>rank[b.priority]-rank[a.priority]||a.createdAt.localeCompare(b.createdAt))}
