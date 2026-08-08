export type JeanVoiceStatus = 'idle' | 'speaking' | 'unsupported'

export function canUseJeanVoice(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

function chooseJeanVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()

  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith('fr') && /male|thomas|daniel|henri/i.test(voice.name)) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('fr')) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('en') && /male|daniel|alex|arthur/i.test(voice.name)) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('en')) ??
    voices[0]
  )
}

/** Visible copy stays authentic; only Jean's speech receives phonetic help. */
export const pronunciationOverrides: Record<string, string> = {
  'Alpe d’Huez': 'Alp doo-ez', 'Alpe d\'Huez': 'Alp doo-ez',
  'Côte': 'Coat', 'Mont Ventoux': 'Mon Von-too', 'Tourmalet': 'Toor-ma-lay',
  'Le Bourg-d’Oisans': 'Luh Boor dwah-zon', 'Gavarnie-Gèdre': 'Gah-var-nee Zhed-ruh',
  'maillot jaune': 'my-oh zhohn', 'peloton': 'pell-oh-ton', 'domestique': 'doh-mess-teek',
}

export function speechText(text: string) {
  return Object.entries(pronunciationOverrides).reduce((spoken, [label, pronunciation]) => spoken.replaceAll(label, pronunciation), text)
}

export function speakAsJean(text: string, onStatusChange?: (status: JeanVoiceStatus) => void, volume = 1): () => void {
  if (!canUseJeanVoice()) {
    onStatusChange?.('unsupported')
    return () => undefined
  }

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(speechText(text))
  utterance.rate = 0.92
  utterance.pitch = 0.86
  utterance.volume = Math.max(0, Math.min(1, volume))

  const assignVoice = () => {
    const voice = chooseJeanVoice()
    if (voice) utterance.voice = voice
  }

  assignVoice()
  utterance.onstart = () => onStatusChange?.('speaking')
  utterance.onend = () => onStatusChange?.('idle')
  utterance.onerror = () => onStatusChange?.('idle')

  window.speechSynthesis.speak(utterance)

  return () => {
    window.speechSynthesis.cancel()
    onStatusChange?.('idle')
  }
}

export function stopJeanVoice(): void {
  if (canUseJeanVoice()) window.speechSynthesis.cancel()
}
