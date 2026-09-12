export type TacticalOfferState='OFFERED'|'EXPIRED'|'ACCEPTED'|'DECLINED'
export function tacticalOfferSnapshot(offeredAt:number,elapsed:number,decision?:string,windowSeconds=20){
 if(decision)return {state:(decision==='accepted'?'ACCEPTED':'DECLINED') as TacticalOfferState,remaining:0,consumed:true}
 const remaining=Math.max(0,windowSeconds-(elapsed-offeredAt))
 return {state:(remaining>0?'OFFERED':'EXPIRED') as TacticalOfferState,remaining,consumed:remaining===0}
}
