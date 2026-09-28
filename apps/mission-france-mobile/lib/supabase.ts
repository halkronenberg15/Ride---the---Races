import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const url=process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://tanizgaletgmzewyqrel.supabase.co'
const publishableKey=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_3Q67sXWhVb2qzo2X4VlpdQ_bLDLhxzV'

export const supabase=createClient(url,publishableKey,{
  auth:{
    storage:AsyncStorage,
    autoRefreshToken:true,
    persistSession:true,
    detectSessionInUrl:false,
  },
})
