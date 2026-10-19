import type { CareerState } from '../types/career.ts'
import { createInitialCareer, migrateCareer, restoreCareerBeforeRender } from '../state/careerPersistence.ts'

export type CareerRepositoryMode='LOCAL_BROWSER'|'REMOTE_ACCOUNT'

export type CareerRepository={
 mode:CareerRepositoryMode
 load:(storageKey:string,displayName?:string)=>CareerState
 save:(storageKey:string,career:CareerState)=>void
}

export const CAREER_REPOSITORY_CONTRACT_VERSION=1

export function createLocalCareerRepository(storage:Pick<Storage,'getItem'|'setItem'>):CareerRepository{
 return {
  mode:'LOCAL_BROWSER',
  load(storageKey,displayName=''){
   try{
    return restoreCareerBeforeRender(storage,storageKey,displayName)
   }catch{
    const raw=storage.getItem(storageKey)
    if(raw){
     try{return migrateCareer(JSON.parse(raw) as Partial<CareerState>)}catch{/* fall through */}
    }
    const fresh=createInitialCareer()
    return {...fresh,rider:{...fresh.rider,name:displayName}}
   }
  },
  save(storageKey,career){
   storage.setItem(storageKey,JSON.stringify(career))
  },
 }
}
