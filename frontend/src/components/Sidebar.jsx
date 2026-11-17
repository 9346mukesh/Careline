import { NavLink, Link } from 'react-router-dom'
import {
  Activity,
  AudioLines,
  CalendarDays,
  LayoutDashboard,
  RefreshCw,
  Stethoscope,
} from 'lucide-react'

import CallTimer from './CallTimer'
import { useClinicData } from '../hooks/useClinicData'
import { useVoiceCall } from '../hooks/useVoiceCall'
import { formatClock } from '../utils/format'

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/doctors', label: 'Doctors & slots', icon: Stethoscope },
  { to: '/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/voice', label: 'Voice assistant', icon: AudioLines },
]

export default function Sidebar({ open, onNavigate }) {
  const { error, lastUpdated, refreshing, refresh, stats } = useClinicData()
  const { isActive, startedAt } = useVoiceCall()

  return (
    <aside className={`sidebar ${open ? 'is-open' : ''}`} aria-label="Sidebar">
      <Link to="/" className="brand" onClick={onNavigate}>
        <span className="brand__mark" aria-hidden="true">
          <Activity size={20} strokeWidth={2.4} />
        </span>
        <span className="brand__copy">
          <span className="brand__name">Careline</span>
          <span className="brand__tag">Voice front desk</span>
        </span>
      </Link>

      <nav className="sidebar__nav" aria-label="Primary">
        <p className="sidebar__label">Workspace</p>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive: active }) =>
              `nav-item ${active ? 'is-active' : ''}`
            }
          >
            <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
            {to === '/appointments' ? (
              <span className="nav-item__count">{stats.activeAppointments}</span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      {isActive ? (
        <Link to="/voice" className="call-chip" onClick={onNavigate}>
          <span className="call-chip__pulse" aria-hidden="true" />
          <span className="call-chip__copy">
            <span className="call-chip__label">On a call</span>
            <span className="call-chip__meta">
              {startedAt ? <CallTimer startedAt={startedAt} /> : 'Connecting…'}
            </span>
          </span>
          <AudioLines size={16} aria-hidden="true" />
        </Link>
      ) : (
        <div className="sidebar__note">
          <p className="sidebar__note-title">{stats.openSlots} open slots</p>
          <p className="sidebar__note-copy">
            across {stats.doctors} doctors in the current schedule.
          </p>
        </div>
      )}

      <div className="sidebar__footer">
        <div className="service-status">
          <span
            className={`status-dot ${error ? 'is-offline' : 'is-online'}`}
            aria-hidden="true"
          />
          <div>
            <p>{error ? 'Clinic service offline' : 'Clinic service online'}</p>
            <p className="service-status__meta">
              {error
                ? 'Check the FastAPI server'
                : lastUpdated
                  ? `Synced ${formatClock(lastUpdated)}`
                  : 'Syncing now'}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="sidebar__refresh"
          onClick={() => refresh()}
          disabled={refreshing}
          aria-label="Refresh clinic data"
        >
          <RefreshCw
            size={14}
            className={refreshing ? 'spin' : ''}
            aria-hidden="true"
          />
          {refreshing ? 'Refreshing' : 'Refresh'}
        </button>
      </div>
    </aside>
  )
}
