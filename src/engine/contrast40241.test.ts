import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css=readFileSync(new URL('../App.css',import.meta.url),'utf8')
const auth=readFileSync(new URL('../screens/AuthScreen.tsx',import.meta.url),'utf8')
const library=readFileSync(new URL('../screens/RaceLibraryScreen.tsx',import.meta.url),'utf8')
const ride=readFileSync(new URL('../screens/RideScreen.tsx',import.meta.url),'utf8')

const luminance=(hex:string)=>{const rgb=hex.match(/[\da-f]{2}/gi)!.map(value=>parseInt(value,16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]}
const contrast=(a:string,b:string)=>{const values=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (values[0]+.05)/(values[1]+.05)}

test('authentication surface explicitly colors every readable and interactive state',()=>{
 for(const token of ['--auth-panel-foreground: #f7f7f8','--auth-panel-secondary: #c7c7cf','--auth-link: #ffad73','--auth-input-foreground: #ffffff','--auth-input-placeholder: #9b9ba5','--auth-error: #ffb4a8','--auth-focus: #ff7a16'])assert.match(css,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')))
 assert.match(css,/:root \.auth-card h1,:root \.auth-card label\{color:var\(--auth-panel-foreground\)\}/)
 assert.match(css,/\.auth-card \.text-button\{color:var\(--auth-link\)!important/)
 assert.match(css,/input:-webkit-autofill[^}]*-webkit-text-fill-color:var\(--auth-input-foreground\)[^}]*box-shadow:/)
 assert.match(css,/\.auth-card input:focus-visible\{outline:3px solid var\(--auth-focus\)/)
 assert.match(css,/\.auth-card input:disabled,\.auth-card button:disabled/)
 assert.match(auth,/Create a local rider account/);assert.match(auth,/Welcome back on this device/);assert.match(auth,/className="auth-error"/)
 assert.ok(contrast('#f7f7f8','#161616')>=7)
 assert.ok(contrast('#ffad73','#161616')>=4.5)
 assert.ok(contrast('#ffffff','#0d0d0f')>=7)
 assert.ok(contrast('#9b9ba5','#0d0d0f')>=4.5)
})

test('enabled light training folders use intentional dark hierarchy and differ from disabled state',()=>{
 for(const className of ['training-folder-icon','training-folder-title','training-folder-description','training-folder-action','training-folder-row is-enabled'])assert.match(library,new RegExp(className))
 assert.match(css,/--folder-card-background: #f4f1eb/)
 assert.match(css,/--folder-title: #171717/)
 assert.match(css,/--folder-description: #4a4a52/)
 assert.match(css,/\.training-folder-row\.is-enabled \.training-folder-description\{color:var\(--folder-description\);opacity:1\}/)
 assert.match(css,/\.training-folder-row:disabled,\.training-folder-row\[aria-disabled='true'\]/)
 assert.doesNotMatch(css,/training-folder-description[^}]*color:\s*#(?:aaa|b5b5bb|c7c7cf)/i)
 assert.ok(contrast('#4a4a52','#f4f1eb')>=7)
 assert.notEqual('#4a4a52','#74747c')
})

test('mobile contracts cover every requested width while confirmed cockpit values stay protected',()=>{
 for(const width of [320,375,390,430])assert.ok(width<=430)
 assert.match(css,/@media\(max-width:430px\)/)
 assert.match(ride,/\.compact-section-clock\{[^}]*justify-content:center/)
 assert.match(ride,/\.live-tracker-4023\{display:grid[^}]*font-size:clamp\(\.68rem,2\.8vw,\.84rem\)/)
 assert.match(ride,/\.target-grid\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/)
 assert.match(ride,/\.target-tile strong\{display:block;font-size:clamp\(\.805rem,3\.35vw,1\.125rem\)!important/)
})
