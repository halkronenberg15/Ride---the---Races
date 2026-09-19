/* eslint-disable react-refresh/only-export-components */
import { createContext,useContext,useState } from 'react'
import { accountById,assignEnrollmentProgram,currentAccountId,grantProgram,isAuthenticatedLocalOwner,listAccounts,migrateLegacyOwner,registerAccount,requestProgram,resumeLegacyOwner,signInAccount,signOutAccount,type ProgramId,type RiderAccount } from '../services/accountStore.ts'

type AuthValue={account:RiderAccount|null;isOwner:boolean;register:(input:{email:string;displayName:string;password:string})=>Promise<void>;signIn:(email:string,password:string)=>Promise<void>;resumeLegacyOwner:()=>void;signOut:()=>void;canAccess:(program:ProgramId)=>boolean;enroll:(program:'intro-cycling'|'rtr-standard'|'rtr-femmes')=>void;requestAccess:(program:ProgramId)=>void;pendingAccounts:()=>RiderAccount[];approve:(accountId:string,program:ProgramId)=>void}
const AuthContext=createContext<AuthValue|null>(null)
export function AuthProvider({children}:{children:React.ReactNode}){
 const [account,setAccount]=useState(()=>{const sessionId=currentAccountId();try{const legacy=migrateLegacyOwner(JSON.parse(localStorage.getItem('ride-the-races-v2-career')??'{}').rider?.name??'');return accountById(sessionId)??legacy}catch{return accountById(sessionId)}})
 const isOwner=isAuthenticatedLocalOwner(account)
 return <AuthContext.Provider value={{account,isOwner,register:async input=>setAccount(await registerAccount(input)),signIn:async(email,password)=>setAccount(await signInAccount(email,password)),resumeLegacyOwner:()=>{const owner=resumeLegacyOwner();if(owner)setAccount(owner)},signOut:()=>{signOutAccount();setAccount(null)},canAccess:program=>Boolean(account&&(isOwner||account.entitlements.includes(program))),enroll:program=>{if(account)setAccount(assignEnrollmentProgram(account.id,program))},requestAccess:program=>{if(account)setAccount(requestProgram(account.id,program))},pendingAccounts:()=>isOwner&&account?listAccounts(account).filter(item=>item.requestedPrograms.length):[],approve:(accountId,program)=>{if(isOwner&&account){grantProgram(account,accountId,program);setAccount(accountById(account.id))}}}}>{children}</AuthContext.Provider>
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('useAuth must be used inside AuthProvider');return value}
