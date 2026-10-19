export type SupabasePublicConfig={
 url:string
 publishableKey:string
}

const RTR_SUPABASE_URL='https://tanizgaletgmzewyqrel.supabase.co'
const RTR_SUPABASE_PUBLISHABLE_KEY='sb_publishable_3Q67sXWhVb2qzo2X4VlpdQ_bLDLhxzV'

export function readSupabasePublicConfig(env:Record<string,string|boolean|undefined>=import.meta.env):SupabasePublicConfig{
 const url=typeof env.VITE_SUPABASE_URL==='string'&&env.VITE_SUPABASE_URL.trim()?env.VITE_SUPABASE_URL.trim():RTR_SUPABASE_URL
 const publishableKey=typeof env.VITE_SUPABASE_PUBLISHABLE_KEY==='string'&&env.VITE_SUPABASE_PUBLISHABLE_KEY.trim()?env.VITE_SUPABASE_PUBLISHABLE_KEY.trim():RTR_SUPABASE_PUBLISHABLE_KEY
 return {url:url.replace(/\/$/,''),publishableKey}
}
