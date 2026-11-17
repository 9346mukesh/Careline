import { useLocation, useNavigate } from 'react-router-dom'
import { AudioLines, Menu, Phone } from 'lucide-react'

import { useVoiceCall } from '../hooks/useVoiceCall'
import { formatLongDate } from '../utils/format'
import { VOICE_STATUS } from '../context/voice-context'

const PAGE_TITLES = {
  '/': 'Overview',
  '/doctors': 'Doctors & slots',
  '/appointments': 'Appointments',
  '/voice': 'Voice assistant',
}

export default function Topbar({ onOpenMenu }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isActive, status, voiceStatus, startCall } = useVoiceCall()
  const title = PAGE_TITLES[location.pathname] || 'Careline'
  const voiceUnavailable = voiceStatus.ready === false

  function handleCallAction() {
    if (isActive) {
      navigate('/voice')
      return
    }

    navigate('/voice')
    startCall()
  }

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          type="button"
          className="icon-button topbar__menu"
          onClick={onOpenMenu}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <div>
          <p className="topbar__crumb">Careline / {title}</p>
          <p className="topbar__date">{formatLongDate()}</p>
        </div>
      </div>

      <div className="topbar__right">
        {status === VOICE_STATUS.CONNECTED ? (
          <span className="topbar__live">
            <span className="topbar__live-dot" aria-hidden="true" />
            Call in progress
          </span>
        ) : null}
        <button
          type="button"
          className={`btn btn--${isActive ? 'live' : 'secondary'} btn--sm topbar__call`}
          onClick={handleCallAction}
          disabled={voiceUnavailable && !isActive}
          title={
            voiceUnavailable
              ? 'Voice provider credentials are not configured'
              : undefined
          }
        >
          {isActive ? (
            <AudioLines size={16} aria-hidden="true" />
          ) : (
            <Phone size={16} aria-hidden="true" />
          )}
          {isActive ? 'Return to call' : 'Start a call'}
        </button>
      </div>
    </header>
  )
}
