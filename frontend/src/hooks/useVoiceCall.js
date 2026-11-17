import { useContext } from 'react'

import { VoiceCallContext } from '../context/voice-context'

export function useVoiceCall() {
  const context = useContext(VoiceCallContext)

  if (!context) {
    throw new Error('useVoiceCall must be used inside VoiceCallProvider')
  }

  return context
}
