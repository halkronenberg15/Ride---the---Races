import type { CareerState } from '../types/career.ts'

export type OnboardingNumbers={numberText:string;heightText:string;weightText:string;ftpText:string}
export function canAdvanceOnboarding(step:number,rider:CareerState['rider'],numbers:OnboardingNumbers){
 if(step===0)return rider.name.trim().length>1&&rider.nationality.trim().length>1&&Number(numbers.numberText)>0&&Number(numbers.heightText)>0&&Number(numbers.weightText)>0
 if(step===1)return !rider.ftpKnown||(Number(numbers.ftpText)>0&&Number.isFinite(Number(numbers.ftpText)))
 return true
}
export function advanceOnboarding(step:number,rider:CareerState['rider'],numbers:OnboardingNumbers){return canAdvanceOnboarding(step,rider,numbers)?Math.min(5,step+1):step}
