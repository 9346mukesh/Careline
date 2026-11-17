import {
  AudioLines,
  LoaderCircle,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  ShieldCheck,
  Timer,
} from 'lucide-react'

import Badge from './Badge'
import CallTimer from './CallTimer'
import Transcript from './Transcript'
import Waveform from './Waveform'
import { useVoiceCall } from '../hooks/useVoiceCall'
import { VOICE_STATUS } from '../context/voice-context'

const STATUS_META = {
  [VOICE_STATUS.IDLE]: { label: 'Ready', tone: 'neutral' },
  [VOICE_STATUS.PREPARING]: { label: 'Preparing', tone: 'warning' },
  [VOICE_STATUS.CONNECTING]: { label: 'Connecting', tone: 'warning' },
  [VOICE_STATUS.CONNECTED]: { label: 'Live', tone: 'live' },
  [VOICE_STATUS.ENDING]: { label: 'Ending', tone: 'warning' },
  [VOICE_STATUS.ERROR]: { label: 'Needs attention', tone: 'danger' },
}

const AGENT_LABELS = {
  idle: 'Not connected',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
  working: 'Working',
}

export default function CallConsole({ variant = 'overview' }) {
  const {
    status,
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
    startCall,
    endCall,
    toggleMute,
    clearError,
  } = useVoiceCall()

  const connected = status === VOICE_STATUS.CONNECTED
  const busy =
    status === VOICE_STATUS.PREPARING ||
    status === VOICE_STATUS.CONNECTING ||
    status === VOICE_STATUS.ENDING
  const voiceUnavailable = voiceStatus.ready === false
  const primaryLevel = speaking.bot
    ? levels.bot
    : speaking.user
      ? levels.user
      : 0.12

  let headline = 'Start a patient call'
  let subline =
    'Careline checks availability, books a slot, and cancels appointments in a natural voice conversation.'

  if (status === VOICE_STATUS.PREPARING) {
    headline = 'Preparing the call'
    subline = 'Requesting microphone access and setting up the audio session.'
  } else if (status === VOICE_STATUS.CONNECTING) {
    headline = 'Connecting to Careline'
    subline = 'The voice agent is joining. This usually takes a few seconds.'
  } else if (connected) {
    headline =
      agentState === 'speaking'
        ? 'Careline is speaking'
        : agentState === 'thinking'
          ? 'Careline is thinking'
          : agentState === 'working'
            ? 'Careline is working on it'
            : 'Listening for the patient'

    subline = muted
      ? 'Your microphone is muted. Unmute to continue the conversation.'
      : 'Speak naturally. The transcript appears here in real time.'
  } else if (status === VOICE_STATUS.ENDING) {
    headline = 'Ending the call'
    subline = 'Closing the audio session and refreshing the clinic schedule.'
  } else if (status === VOICE_STATUS.ERROR) {
    headline = 'The call could not start'
    subline = 'Check the microphone permission and the voice service, then try again.'
  }

  const statusMeta = STATUS_META[status] || STATUS_META.idle

  return (
    <section
      className={`call-console call-console--${variant}`}
      aria-labelledby={`call-title-${variant}`}
    >
      <div className={`call-stage ${connected ? 'is-live' : ''}`}>
        <header className="call-stage__header">
          <div className="call-brand">
            <span className="call-brand__mark" aria-hidden="true">
              <AudioLines size={17} strokeWidth={2} />
            </span>
            <span className="call-brand__name">
              Careline <em>voice</em>
            </span>
          </div>
          <Badge tone={statusMeta.tone} dot>
            {statusMeta.label}
          </Badge>
        </header>

        <div className="call-stage__focus">
          <div className={`call-viz ${speaking.bot ? 'is-agent' : ''}`}>
            <span className="call-viz__glow" aria-hidden="true" />
            <Waveform
              level={primaryLevel}
              active={connected}
              tone={speaking.bot ? 'coral' : 'teal'}
              bars={variant === 'full' ? 56 : 42}
            />
          </div>

          <div className="call-stage__copy">
            <h2 id={`call-title-${variant}`}>{headline}</h2>
            <p>{subline}</p>
          </div>

          <div className="call-stage__state" aria-live="polite">
            {connected ? (
              <span className={`agent-state agent-state--${agentState}`}>
                <span className="agent-state__dot" aria-hidden="true" />
                {AGENT_LABELS[agentState] || 'On call'}
              </span>
            ) : null}
            {activity ? (
              <span className="call-activity">
                <LoaderCircle size={13} className="spin" aria-hidden="true" />
                {activity}
              </span>
            ) : null}
          </div>
        </div>

        <div className="call-stage__controls">
          {connected ? (
            <>
              <button
                type="button"
                className={`call-control ${muted ? 'is-muted' : ''}`}
                onClick={toggleMute}
                aria-pressed={muted}
              >
                {muted ? <MicOff size={17} /> : <Mic size={17} />}
                {muted ? 'Unmute' : 'Mute'}
              </button>
              <button
                type="button"
                className="call-control call-control--end"
                onClick={endCall}
              >
                <PhoneOff size={17} />
                End call
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn--signal btn--lg call-start"
              onClick={startCall}
              disabled={busy || voiceUnavailable}
            >
              {busy ? (
                <LoaderCircle size={18} className="spin" aria-hidden="true" />
              ) : (
                <Phone size={18} aria-hidden="true" />
              )}
              {status === VOICE_STATUS.ERROR
                ? 'Try again'
                : status === VOICE_STATUS.ENDING
                  ? 'Ending…'
                  : busy
                    ? 'Connecting…'
                    : 'Start voice call'}
            </button>
          )}
        </div>

        {voiceUnavailable ? (
          <p className="call-stage__notice">
            The voice assistant is not configured. Add the LLM and speech provider
            credentials on the server to enable calls.
          </p>
        ) : null}

        {error ? (
          <div className="call-stage__error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={clearError}>
              Dismiss
            </button>
          </div>
        ) : null}

        <footer className="call-stage__footer">
          <span>
            <Timer size={14} aria-hidden="true" />
            {startedAt ? <CallTimer startedAt={startedAt} /> : 'Not connected'}
          </span>
          <span>
            <ShieldCheck size={14} aria-hidden="true" />
            Audio is streamed only for this session
          </span>
        </footer>
      </div>

      <Transcript
        transcript={transcript}
        interimUser={interimUser}
        variant={variant}
      />
    </section>
  )
}
