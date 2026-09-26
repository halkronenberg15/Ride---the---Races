export type LocationStatus='Disabled'|'Active'|'Acquiring'|'Permission Denied'|'Unavailable'|'Stale'
export type VerifiedLocationFix={latitude:number;longitude:number;accuracy:number|null;timestamp:number}
export type GeolocationLike={watchPosition:(success:(position:GeolocationPosition)=>void,error:(error:GeolocationPositionError)=>void,options?:PositionOptions)=>number;clearWatch:(id:number)=>void}

export function verifiedLocationFix(position:GeolocationPosition):VerifiedLocationFix{
 return {latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:Number.isFinite(position.coords.accuracy)?position.coords.accuracy:null,timestamp:position.timestamp}
}
export function locationErrorStatus(code:number):LocationStatus{return code===1?'Permission Denied':'Unavailable'}
export function locationFixAgeSeconds(fix:VerifiedLocationFix|null,now:number){return fix?Math.max(0,Math.floor((now-fix.timestamp)/1000)):null}

let mapsPromise:Promise<void>|null=null
export function loadGoogleMaps(apiKey:string,documentRef:Document=document):Promise<void>{
 if(!apiKey)return Promise.reject(new Error('Google Maps API key is missing.'))
 const googleRef=(globalThis as typeof globalThis&{google?:{maps?:unknown}}).google
 if(googleRef?.maps)return Promise.resolve()
 if(mapsPromise)return mapsPromise
 mapsPromise=new Promise((resolve,reject)=>{const existing=documentRef.querySelector<HTMLScriptElement>('script[data-rtr-google-maps]');if(existing){existing.addEventListener('load',()=>resolve(),{once:true});existing.addEventListener('error',()=>reject(new Error('Google Maps failed to load.')),{once:true});return}const script=documentRef.createElement('script');script.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;script.async=true;script.defer=true;script.dataset.rtrGoogleMaps='true';script.addEventListener('load',()=>resolve(),{once:true});script.addEventListener('error',()=>{mapsPromise=null;reject(new Error('Google Maps failed to load.'))},{once:true});documentRef.head.appendChild(script)})
 return mapsPromise
}
