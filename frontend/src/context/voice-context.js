import { createContext } from 'react'

export const VoiceCallContext = createContext(null)

export const VOICE_STATUS = {
  IDLE: 'idle',
  PREPARING: 'preparing',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ENDING: 'ending',
  ERROR: 'error',
}
