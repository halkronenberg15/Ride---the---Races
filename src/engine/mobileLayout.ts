export type MobileViewport={width:number;height:number;safeAreaTop:number;visualViewportTop:number}
export function protectedTopBoundary(viewport:MobileViewport){const landscape=viewport.width>viewport.height&&viewport.height<=600;return Math.max(viewport.safeAreaTop,viewport.visualViewportTop,landscape?44:64)}
export function cockpitControlRect(viewport:MobileViewport){const top=protectedTopBoundary(viewport)+8;return {top,bottom:top+44,height:44}}
