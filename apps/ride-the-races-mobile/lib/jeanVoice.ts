import * as Speech from 'expo-speech'
import { speechText } from '../../../src/services/jeanVoice'

export function speakAsJeanMobile(text:string,volume=1){
 Speech.stop()
 Speech.speak(speechText(text),{
   language:'en-GB',
   rate:.96,
   pitch:.94,
   volume:Math.max(0,Math.min(1,volume)),
   useApplicationAudioSession:false,
 })
}

export function stopJeanVoiceMobile(){
 Speech.stop()
}
