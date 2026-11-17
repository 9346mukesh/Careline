import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { API_BASE, api } from '../api/client'
import { VoiceCallContext, VOICE_STATUS } from './voice-context'
import { useClinicData } from '../hooks/useClinicData'
import { friendlyToolName } from '../utils/format'

const EMPTY_LEVELS = { user: 0, bot: 0 }
const EMPTY_SPEAKING = { user: false, bot: false }

function connectionErrorMessage(error) {
  if (error?.status === 503) {
    return 'The voice assistant is not configured on the server yet.'
  }

  if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
    return 'Microphone access was blocked. Allow microphone access in your browser and try again.'
  }

  if (typeof error?.message === 'string' && error.message.length < 160) {
    return `${error.message} Try again, or check that the voice service is running.`
  }

  return 'Could not start the call. Check the microphone permission and that the voice service is running.'
}

export default function VoiceCallProvider({ children }) {
  const { refresh } = useClinicData()
  const [status, setStatus] = useState(VOICE_STATUS.IDLE)
  const [transportState, setTransportState] = useState('disconnected')
  const [transcript, setTranscript] = useState([])
  const [interimUser, setInterimUser] = useState('')
  const [error, setError] = useState(null)
  const [muted, setMuted] = useState(false)
  const [levels, setLevels] = useState(EMPTY_LEVELS)
  const [speaking, setSpeaking] = useState(EMPTY_SPEAKING)
  const [activity, setActivity] = useState(null)
  const [agentState, setAgentState] = useState('idle')
  const [startedAt, setStartedAt] = useState(null)
  const [voiceStatus, setVoiceStatus] = useState({
    checking: true,
    ready: null,
    providers: null,
  })

  const clientRef = useRef(null)
  const transcriptSequence = useRef(0)
  const sawUserInput = useRef(false)
  const botAudioRef = useRef(null)

  // The WebRTC transport only hands us the remote track. Browsers do not play
  // it on their own, so wire it to a hidden audio element or the agent's voice
  // is rendered as transcript only.
  const attachRemoteAudio = useCallback((track) => {
    const element = botAudioRef.current

    if (!element || !track || track.kind !== 'audio') return

    element.srcObject = new MediaStream([track])
    element.muted = false
    element.volume = 1

    const play = () => {
      if (!element.srcObject) return
      element.play().catch(() => {
        // Autoplay policies can defer playback until the next gesture.
      })
    }

    play()

    // Safari and some Chrome configurations only allow audio after a gesture.
    // Retry on the next interaction instead of losing the bot's reply.
    document.addEventListener('click', play, { once: true })
    document.addEventListener('keydown', play, { once: true })
  }, [])

  const appendTranscript = useCallback((role, text) => {
    const cleaned = typeof text === 'string' ? text.trim() : ''

    if (!cleaned) return

    setTranscript((current) => {
      const last = current[current.length - 1]

      if (last && last.role === role && last.text === cleaned) {
        return current
      }

      return [
        ...current,
        {
          id: ++transcriptSequence.current,
          role,
          text: cleaned,
          at: new Date(),
        },
      ]
    })
  }, [])

  const finalizeCall = useCallback(() => {
    clientRef.current = null

    const element = botAudioRef.current
    if (element) {
      element.pause()
      element.srcObject = null
    }

    setStatus(VOICE_STATUS.IDLE)
    setTransportState('disconnected')
    setStartedAt(null)
    setAgentState('idle')
    setActivity(null)
    setSpeaking(EMPTY_SPEAKING)
    setLevels(EMPTY_LEVELS)
    setInterimUser('')
    setMuted(false)
    refresh({ silent: true })
  }, [refresh])

  const startCall = useCallback(async () => {
    if (clientRef.current) return

    setError(null)
    setTranscript([])
    setInterimUser('')
    setMuted(false)
    setActivity(null)
    setLevels(EMPTY_LEVELS)
    setSpeaking(EMPTY_SPEAKING)
    setAgentState('idle')
    setStatus(VOICE_STATUS.PREPARING)
    transcriptSequence.current = 0
    sawUserInput.current = false

    let client

    try {
      // Load the WebRTC SDK on demand so the dashboard stays light until a
      // call is actually started.
      const [{ PipecatClient }, { SmallWebRTCTransport }] = await Promise.all([
        import('@pipecat-ai/client-js'),
        import('@pipecat-ai/small-webrtc-transport'),
      ])

      const transport = new SmallWebRTCTransport({
        webrtcRequestParams: {
          endpoint: `${API_BASE}/api/voice/offer`,
        },
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })

      client = new PipecatClient({
        transport,
        enableMic: true,
        enableCam: false,
        callbacks: {
          onConnected: () => {
            setStatus(VOICE_STATUS.CONNECTED)
          },
          onBotReady: () => {
            setStatus(VOICE_STATUS.CONNECTED)
            setAgentState('listening')
            setStartedAt((current) => current ?? Date.now())
          },
          onDisconnected: () => {
            if (clientRef.current === client) {
              finalizeCall()
            }
          },
          onTransportStateChanged: (nextState) => {
            setTransportState(nextState)

            if (nextState === 'connecting') {
              setStatus(VOICE_STATUS.CONNECTING)
            }

            if (nextState === 'connected' || nextState === 'ready') {
              setStatus(VOICE_STATUS.CONNECTED)
            }

            if (nextState === 'error') {
              setStatus(VOICE_STATUS.ERROR)
            }
          },
          onError: (message) => {
            const detail =
              message?.data?.message ||
              message?.data?.error ||
              'The voice session reported an error.'
            setError(detail)
            setStatus(VOICE_STATUS.ERROR)
          },
          onUserStartedSpeaking: () => {
            setSpeaking((current) => ({ ...current, user: true }))
            setAgentState('listening')
          },
          onUserStoppedSpeaking: () => {
            setSpeaking((current) => ({ ...current, user: false }))
            setAgentState('thinking')
          },
          onBotStartedSpeaking: () => {
            setSpeaking((current) => ({ ...current, bot: true }))
            setAgentState('speaking')
          },
          onBotStoppedSpeaking: () => {
            setSpeaking((current) => ({ ...current, bot: false }))
            setAgentState('listening')
          },
          onTrackStarted: (track, participant) => {
            if (participant?.local) return
            attachRemoteAudio(track)
          },
          onTrackStopped: (track, participant) => {
            if (participant?.local) return

            const element = botAudioRef.current
            const stream = element?.srcObject

            if (
              element &&
              stream?.getTracks?.().some((current) => current === track)
            ) {
              element.pause()
              element.srcObject = null
            }
          },
          onUserInput: (data) => {
            sawUserInput.current = true

            if (data?.input_type && data.input_type !== 'transcription') return

            if (!data?.final) {
              setInterimUser(data?.text || '')
              return
            }

            setInterimUser('')
            appendTranscript('user', data?.text)
          },
          onUserTranscript: (data) => {
            if (sawUserInput.current) return

            if (!data?.final) {
              setInterimUser(data?.text || '')
              return
            }

            setInterimUser('')
            appendTranscript('user', data?.text)
          },
          onBotTranscript: (data) => {
            appendTranscript('agent', data?.text)
          },
          onLLMFunctionCallInProgress: (data) => {
            setActivity(friendlyToolName(data?.function_name))
            setAgentState('working')
          },
          onLLMFunctionCallStopped: () => {
            setActivity(null)
            setAgentState('thinking')
          },
          onLocalAudioLevel: (level) => {
            setLevels((current) => ({ ...current, user: level }))
          },
          onRemoteAudioLevel: (level) => {
            setLevels((current) => ({ ...current, bot: level }))
          },
        },
      })
    } catch (caught) {
      setError(connectionErrorMessage(caught))
      setStatus(VOICE_STATUS.ERROR)
      return
    }

    clientRef.current = client
    setStatus(VOICE_STATUS.CONNECTING)

    try {
      await client.connect()
    } catch (caught) {
      if (clientRef.current === client) {
        clientRef.current = null
      }

      try {
        await client.disconnect()
      } catch {
        // The transport may already be closed after a failed handshake.
      }

      setError(connectionErrorMessage(caught))
      setStatus(VOICE_STATUS.ERROR)
      setAgentState('idle')
      setStartedAt(null)
    }
  }, [appendTranscript, finalizeCall, attachRemoteAudio])

  const endCall = useCallback(async () => {
    const client = clientRef.current

    if (!client) {
      finalizeCall()
      return
    }

    setStatus(VOICE_STATUS.ENDING)

    try {
      await client.disconnect()
    } catch {
      // A failed disconnect should still release the UI.
    } finally {
      finalizeCall()
    }
  }, [finalizeCall])

  const toggleMute = useCallback(() => {
    const client = clientRef.current

    if (!client) return

    const nextMuted = !muted

    try {
      client.enableMic(!nextMuted)
      setMuted(nextMuted)
    } catch {
      setError('The microphone could not be toggled. Check your browser permissions.')
    }
  }, [muted])

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    api
      .voiceStatus({ signal: controller.signal })
      .then((data) => {
        if (!active) return
        setVoiceStatus({
          checking: false,
          ready: Boolean(data?.ready),
          providers: data?.providers || null,
        })
      })
      .catch((caught) => {
        if (!active || caught.name === 'AbortError') return

        setVoiceStatus({
          checking: false,
          ready: null,
          providers: null,
          error:
            caught.status === 404
              ? null
              : 'Voice readiness could not be verified.',
        })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  useEffect(() => {
    return () => {
      const client = clientRef.current
      clientRef.current = null

      if (client) {
        client.disconnect().catch(() => {})
      }
    }
  }, [])

  const isActive = [
    VOICE_STATUS.PREPARING,
    VOICE_STATUS.CONNECTING,
    VOICE_STATUS.CONNECTED,
    VOICE_STATUS.ENDING,
  ].includes(status)

  const value = useMemo(
    () => ({
      status,
      transportState,
      transcript,
      interimUser,
      error,
      muted,
      levels,
      speaking,
      activity,
      agentState,
      startedAt,
      voiceStatus,
      isActive,
      startCall,
      endCall,
      toggleMute,
      clearError: () => setError(null),
    }),
    [
      status,
      transportState,
      transcript,
      interimUser,
      error,
      muted,
      levels,
      speaking,
      activity,
      agentState,
      startedAt,
      voiceStatus,
      isActive,
      startCall,
      endCall,
      toggleMute,
    ],
  )

  return (
    <VoiceCallContext.Provider value={value}>
      {children}
      <audio
        ref={botAudioRef}
        autoPlay
        playsInline
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
    </VoiceCallContext.Provider>
  )
}
