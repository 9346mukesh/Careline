import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck2,
  CircleCheck,
  CircleDashed,
  LockKeyhole,
  ShieldCheck,
  Stethoscope,
  Waves,
} from 'lucide-react'

import Badge from '../components/Badge'
import CallConsole from '../components/CallConsole'
import PageHeader from '../components/PageHeader'
import { useVoiceCall } from '../hooks/useVoiceCall'

const TEST_STEPS = [
  'Ask for a cardiologist and a date.',
  'Pick one of the slots Careline reads back.',
  'Give a name and phone number, then confirm it.',
  'Ask Careline to cancel that appointment in a second call.',
]

function ProviderRow({ label, ready, detail }) {
  const Icon = ready ? CircleCheck : CircleDashed

  return (
    <li>
      <span className={`provider-row__icon ${ready ? 'is-ready' : ''}`} aria-hidden="true">
        <Icon size={17} />
      </span>
      <div>
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
      <Badge tone={ready ? 'success' : 'warning'}>{ready ? 'Ready' : 'Waiting'}</Badge>
    </li>
  )
}

export default function VoicePage() {
  const { voiceStatus } = useVoiceCall()
  const providers = voiceStatus.providers

  return (
    <div className="page">
      <PageHeader
        eyebrow="Live conversation"
        title="Voice assistant"
        description="Start a browser call, watch the transcript, and let Careline handle the booking end to end."
        actions={
          <>
            <Link to="/doctors" className="btn btn--ghost">
              <Stethoscope size={16} aria-hidden="true" />
              Doctors
            </Link>
            <Link to="/appointments" className="btn btn--ghost">
              <CalendarCheck2 size={16} aria-hidden="true" />
              Appointments
            </Link>
          </>
        }
      />

      <div className="voice-layout">
        <div className="voice-main">
          <CallConsole variant="full" />
        </div>

        <aside className="voice-rail" aria-label="Call guidance">
          <section className="panel" aria-labelledby="provider-status">
            <header className="panel__header">
              <div>
                <p className="eyebrow">Connection</p>
                <h2 id="provider-status">Service status</h2>
              </div>
              <Waves size={18} aria-hidden="true" className="panel__icon" />
            </header>

            <ul className="provider-list">
              <ProviderRow
                label="Language model"
                ready={Boolean(providers?.llm)}
                detail="Groq tool calling"
              />
              <ProviderRow
                label="Speech services"
                ready={Boolean(providers?.speech)}
                detail="Streaming speech to text and voice"
              />
              <ProviderRow
                label="Audio transport"
                ready
                detail="Small WebRTC, peer to peer"
              />
            </ul>

            {voiceStatus.ready === false ? (
              <p className="provider-warning" role="status">
                Voice calls are paused until the server has both provider
                credentials. The rest of the dashboard still works.
              </p>
            ) : null}
          </section>

          <section className="panel" aria-labelledby="test-call">
            <header className="panel__header">
              <div>
                <p className="eyebrow">Walkthrough</p>
                <h2 id="test-call">Test a full booking</h2>
              </div>
            </header>
            <ol className="step-list">
              {TEST_STEPS.map((step, index) => (
                <li key={step}>
                  <span className="step-list__number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <Link to="/appointments" className="text-link step-list__link">
              Check the ledger after the call
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </section>

          <section className="panel privacy-panel" aria-labelledby="privacy-title">
            <header className="panel__header">
              <div>
                <p className="eyebrow">Privacy</p>
                <h2 id="privacy-title">What happens to the audio</h2>
              </div>
              <ShieldCheck size={18} aria-hidden="true" className="panel__icon" />
            </header>
            <ul className="privacy-list">
              <li>
                <LockKeyhole size={15} aria-hidden="true" />
                Audio streams to your FastAPI server only for the duration of this
                call.
              </li>
              <li>
                <LockKeyhole size={15} aria-hidden="true" />
                The transcript lives in this browser tab and is cleared on reload.
              </li>
              <li>
                <LockKeyhole size={15} aria-hidden="true" />
                The agent asks for phone confirmation before booking or cancelling.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
