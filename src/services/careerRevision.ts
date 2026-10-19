import type { CareerState } from '../types/career.ts'

export type CareerLocalMetadata={
 savedAt:string
 revision:string
}

export const careerMetadataStorageKey=(storageKey:string)=>storageKey+':metadata:v1'

export function careerRevision(career:CareerState){
 const input=JSON.stringify(career)
 let hash=2166136261
 for(let i=0;i<input.length;i++){
  hash^=input.charCodeAt(i)
  hash=Math.imul(hash,16777619)
 }
 return (hash>>>0).toString(16).padStart(8,'0')
}

export function writeCareerLocalMetadata(storage:Pick<Storage,'setItem'>,storageKey:string,career:CareerState,savedAt=new Date().toISOString()):CareerLocalMetadata{
 const metadata={savedAt,revision:careerRevision(career)}
 storage.setItem(careerMetadataStorageKey(storageKey),JSON.stringify(metadata))
 return metadata
}

export function readCareerLocalMetadata(storage:Pick<Storage,'getItem'>,storageKey:string):CareerLocalMetadata|null{
 try{
  const raw=storage.getItem(careerMetadataStorageKey(storageKey))
  if(!raw)return null
  const parsed=JSON.parse(raw) as CareerLocalMetadata
  return parsed.savedAt&&parsed.revision?parsed:null
 }catch{return null}
}
