export type CooldownCompletion={officialRaceDurationSeconds:number;cooldownDurationSeconds:number;cooldownSkipped:boolean}

/** Final result and cooldown clocks are intentionally separate. */
export function completeCooldown(raceFinishTime:number,totalDuration:number,elapsed:number,cooldownSkipped:boolean):CooldownCompletion{
 const safeElapsed=Math.min(totalDuration,Math.max(raceFinishTime,elapsed))
 return {officialRaceDurationSeconds:raceFinishTime,cooldownDurationSeconds:safeElapsed-raceFinishTime,cooldownSkipped}
}
