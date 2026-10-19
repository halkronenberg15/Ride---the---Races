export type SupabasePublicConfig={
 url:string
 publishableKey:string
}

export function readSupabasePublicConfig(env:Record<string,string|boolean|undefined>=import.meta.env):SupabasePublicConfig|null{
 const url=typeof env.VITE_SUPABASE_URL==='string'?env.VITE_SUPABASE_URL.trim():''
 const publishableKey=typeof env.VITE_SUPABASE_PUBLISHABLE_KEY==='string'?env.VITE_SUPABASE_PUBLISHABLE_KEY.trim():''
 if(!url||!publishableKey)return null
 return {url:url.replace(/\/$/,''),publishableKey}
}
