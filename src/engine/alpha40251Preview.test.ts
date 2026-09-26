import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { OffSeasonPreviewButton } from '../components/OffSeasonPreviewButton.ts'
import { generatePlan, HAL_GOALS, HAL_INPUT } from './alpha4025.ts'
import { readFileSync } from 'node:fs'

test('authenticated Team Bus preview renders required plan labels without a lock',()=>{const html=renderToStaticMarkup(createElement(OffSeasonPreviewButton,{authenticated:true,plan:generatePlan(HAL_INPUT,HAL_GOALS),onOpen:()=>{}}));for(const label of ['OFF-SEASON TRAINING','PREVIEW ACCESS','Start date: September 21, 2026','Plan length: 24 weeks','Open Off-Season Plan'])assert.match(html,new RegExp(label));assert.doesNotMatch(html,/🔒|disabled/)})
test('unauthenticated Team Bus preview renders no route action',()=>{assert.equal(renderToStaticMarkup(createElement(OffSeasonPreviewButton,{authenticated:false,plan:null,onOpen:()=>{}})),'')})
test('Team Bus, Home, screen and route consume the same authenticated-session selector',()=>{const files=['../screens/TeamBusScreen.tsx','../screens/TeamHQScreen.tsx','../screens/OffSeasonScreen.tsx','../App.tsx'].map(path=>readFileSync(new URL(path,import.meta.url),'utf8'));for(const source of files)assert.match(source,/isAuthenticated/);assert.match(files[3],/screen==='offseason'&&!isAuthenticated/)})
