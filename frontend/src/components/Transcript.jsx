import { useEffect, useRef } from 'react'
import { AudioLines, Sparkles, User } from 'lucide-react'

import { formatClock } from '../utils/format'

const PROMPTS = [
  'Find a cardiologist for tomorrow.',
  'Book the 10:30 slot with Dr. Sharma.',
  'Cancel my appointment for 9876543210.',
]

export default function Transcript({ transcript, interimUser, variant = 'panel' }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [transcript.length, interimUser])

  const messageCount = transcript.length

  return (
    <section className={`transcript transcript--${variant}`} aria-label="Live call transcript">
      <header className="transcript__header">
        <div>
          <p className="transcript__eyebrow">Live transcript</p>
          <h3>Conversation</h3>
        </div>
        <span className="transcript__count">
          {messageCount} {messageCount === 1 ? 'message' : 'messages'}
        </span>
      </header>

      <div
        className="transcript__body"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {messageCount === 0 && !interimUser ? (
          <div className="transcript__empty">
            <span className="transcript__empty-icon" aria-hidden="true">
              <Sparkles size={20} strokeWidth={1.7} />
            </span>
            <p className="transcript__empty-title">The conversation will appear here.</p>
            <p className="transcript__empty-copy">
              Start a call, then try one of these:
            </p>
            <ul>
              {PROMPTS.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {transcript.map((message) => (
          <article
            key={message.id}
            className={`message message--${message.role}`}
          >
            <span className="message__avatar" aria-hidden="true">
              {message.role === 'agent' ? <AudioLines size={15} /> : <User size={15} />}
            </span>
            <div className="message__content">
              <div className="message__meta">
                <strong>{message.role === 'agent' ? 'Careline' : 'Patient'}</strong>
                <time dateTime={message.at.toISOString()}>
                  {formatClock(message.at)}
                </time>
              </div>
              <p>{message.text}</p>
            </div>
          </article>
        ))}

        {interimUser ? (
          <article className="message message--user message--interim">
            <span className="message__avatar" aria-hidden="true">
              <User size={15} />
            </span>
            <div className="message__content">
              <div className="message__meta">
                <strong>Patient</strong>
                <span className="message__listening">Listening</span>
              </div>
              <p>{interimUser}</p>
            </div>
          </article>
        ) : null}

        <div ref={endRef} />
      </div>
    </section>
  )
}
