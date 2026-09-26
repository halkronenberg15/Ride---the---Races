export type DeploymentEnvironment={VITE_VERCEL_ENV?:string;MODE?:string}

export function isVercelPreview(environment:DeploymentEnvironment=(import.meta as ImportMeta&{env?:DeploymentEnvironment}).env??{}){
 return environment.VITE_VERCEL_ENV==='preview'
}

export function canUsePreviewDataTransfer(isAuthenticated:boolean,role:string|undefined,environment?:DeploymentEnvironment){
 return isAuthenticated&&(role==='owner'||isVercelPreview(environment))
}
