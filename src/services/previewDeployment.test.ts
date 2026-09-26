import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createInitialCareer } from '../state/careerPersistence.ts'
import type { RiderAccount } from './accountStore.ts'
import { buildCareerExport, commitCareerImport, parseCareerExport } from './previewTransfer.ts'
import { canUsePreviewDataTransfer } from './previewDeployment.ts'

const rider:RiderAccount={id:'fresh-preview-rider',email:'fresh@example.test',displayName:'Fresh Rider',role:'rider',passwordHash:'not-exported',salt:'not-exported',entitlements:[],requestedPrograms:[],createdAt:'2026-09-26T00:00:00Z'}
const values=new Map<string,string>()
Object.defineProperty(globalThis,'localStorage',{value:{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value),removeItem:(key:string)=>values.delete(key)},configurable:true})

test('fresh authenticated Vercel preview rider sees and can use local import without Hal or initialized Alpha state',()=>{
 const environment={VITE_VERCEL_ENV:'preview'},fresh=createInitialCareer(),source={...createInitialCareer(),rider:{...createInitialCareer().rider,name:'Imported Rider',number:27}}
 assert.equal(canUsePreviewDataTransfer(true,rider.role,environment),true)
 const payload=buildCareerExport(rider,source,null,'4.0.25.1','2026-09-26T12:00:00Z',true),preview=parseCareerExport(JSON.stringify(payload),fresh),result=commitCareerImport(rider,fresh,null,preview,true,'2026-09-26T12:01:00Z',true)
 assert.equal(result.career.rider.name,'Imported Rider')
 assert.equal(JSON.parse(values.get('ride-the-races-v2-career:fresh-preview-rider')!).rider.number,27)
 const settings=readFileSync(new URL('../screens/SettingsScreen.tsx',import.meta.url),'utf8')
 assert.match(settings,/previewTransferEnabled&&account/)
 assert.match(settings,/await file\.text\(\)/)
 assert.doesNotMatch(settings,/account\?\.role==='owner'&&<section className="settings-card preview-transfer"/)
})

test('preview transfer remains hidden when signed out and in production',()=>{
 assert.equal(canUsePreviewDataTransfer(false,undefined,{VITE_VERCEL_ENV:'preview'}),false)
 assert.equal(canUsePreviewDataTransfer(true,'rider',{VITE_VERCEL_ENV:'production'}),false)
 assert.equal(canUsePreviewDataTransfer(true,'owner',{VITE_VERCEL_ENV:'production'}),true)
})
