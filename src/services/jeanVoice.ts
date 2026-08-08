export type JeanVoiceStatus = 'idle' | 'speaking' | 'unsupported'

const pronunciationDictionary: Record<string, string> = {
  Carcassonne: 'Car-ca-son', Foix: 'Fwah', Toses: 'Toe-zess', 'Les Angles': 'Lay Zong-gluh',
  Cerdanya: 'Ser-dan-ya', Calvaire: 'Cal-vair', Quillane: 'Kee-yan', Pyrénées: 'Peer-eh-nay',
  peloton: 'pell-uh-ton', maillot: 'my-oh', Vuelta: 'Vwell-ta', Giro: 'Jee-ro',
}

export function speechSafeText(text: string) {
  return Object.entries(pronunciationDictionary).reduce(
    (spoken, [display, pronunciation]) => spoken.replaceAll(display, pronunciation), text,
  )
}

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

export function speakAsJean(text: string, onStatusChange?: (status: JeanVoiceStatus) => void, volume = 1): () => void {
  if (!canUseJeanVoice()) {
    onStatusChange?.('unsupported')
    return () => undefined
  }

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(speechSafeText(text))
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
