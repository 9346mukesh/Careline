import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarPlus,
  Eye,
  EyeOff,
  LockKeyhole,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'

import AppointmentTable from '../components/AppointmentTable'
import Badge from '../components/Badge'
import CancelDialog from '../components/CancelDialog'
import ErrorBanner from '../components/ErrorBanner'
import PageHeader from '../components/PageHeader'
import { useClinicData } from '../hooks/useClinicData'
import { pluralize } from '../utils/format'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'booked', label: 'Booked' },
  { id: 'cancelled', label: 'Cancelled' },
]

export default function AppointmentsPage() {
  const { appointments, stats, loading, refreshing, error, refresh } = useClinicData()
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [revealPhones, setRevealPhones] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()

    return appointments.filter((appointment) => {
      if (filter !== 'all' && appointment.status !== filter) return false
      if (!term) return true

      return (
        appointment.patient_name.toLowerCase().includes(term) ||
        appointment.doctor_name.toLowerCase().includes(term) ||
        appointment.appointment_id.toLowerCase().includes(term) ||
        appointment.patient_phone.includes(term)
      )
    })
  }, [appointments, filter, query])

  const counts = {
    all: stats.totalAppointments,
    booked: stats.activeAppointments,
    cancelled: stats.cancelledAppointments,
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Bookings ledger"
        title="Appointments"
        description="Every booking made by the voice agent or the front desk, with the latest status."
        actions={
          <>
            <Link to="/doctors" className="btn btn--secondary">
              <CalendarPlus size={16} aria-hidden="true" />
              Book a patient
            </Link>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => refresh()}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? 'spin' : ''}
                aria-hidden="true"
              />
              {refreshing ? 'Refreshing' : 'Refresh'}
            </button>
          </>
        }
      />

      {error ? (
        <ErrorBanner
          title="Appointments could not be loaded"
          message={error.message}
          onRetry={refresh}
        />
      ) : null}

      <section className="appointments-panel panel" aria-labelledby="appointments-title">
        <header className="panel__header appointments-panel__header">
          <div>
            <p className="eyebrow">All records</p>
            <h2 id="appointments-title">
              {filtered.length} {pluralize(filtered.length, 'appointment')}
            </h2>
          </div>
          <div className="appointments-panel__meta">
            <Badge tone="success" dot>
              {stats.activeAppointments} active
            </Badge>
            <Badge tone="neutral">{stats.cancelledAppointments} cancelled</Badge>
          </div>
        </header>

        <div className="toolbar toolbar--appointments">
          <div className="segmented" role="group" aria-label="Filter appointments by status">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`segmented__button ${filter === item.id ? 'is-active' : ''}`}
                onClick={() => setFilter(item.id)}
                aria-pressed={filter === item.id}
              >
                {item.label}
                <span className="segmented__count">{counts[item.id]}</span>
              </button>
            ))}
          </div>

          <div className="search-field search-field--compact">
            <Search size={17} aria-hidden="true" />
            <label htmlFor="appointment-search" className="sr-only">
              Search appointments
            </label>
            <input
              id="appointment-search"
              type="search"
              placeholder="Search patient, doctor, or ID"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query ? (
              <button
                type="button"
                className="search-field__clear"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          <button
            type="button"
            className="btn btn--ghost btn--sm privacy-toggle"
            onClick={() => setRevealPhones((current) => !current)}
            aria-pressed={revealPhones}
          >
            {revealPhones ? (
              <EyeOff size={15} aria-hidden="true" />
            ) : (
              <Eye size={15} aria-hidden="true" />
            )}
            {revealPhones ? 'Hide phone numbers' : 'Show phone numbers'}
          </button>
        </div>

        <div className="privacy-note">
          <LockKeyhole size={14} aria-hidden="true" />
          <span>
            Phone numbers are masked by default. Reveal them only when you need to
            verify a patient.
          </span>
        </div>

        {loading && !appointments.length ? (
          <div className="skeleton skeleton--table" aria-hidden="true" />
        ) : (
          <AppointmentTable
            appointments={filtered}
            onCancel={setCancelTarget}
            revealPhones={revealPhones}
            emptyTitle={
              query || filter !== 'all'
                ? 'No appointments match this view'
                : 'No appointments yet'
            }
            emptyDescription={
              query || filter !== 'all'
                ? 'Adjust the filters or search for a different patient.'
                : 'Bookings made by the voice agent or from the dashboard will appear here.'
            }
            emptyAction={
              query || filter !== 'all' ? (
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => {
                    setQuery('')
                    setFilter('all')
                  }}
                >
                  Clear filters
                </button>
              ) : (
                <Link to="/doctors" className="btn btn--secondary btn--sm">
                  Browse doctors
                </Link>
              )
            }
          />
        )}

        <footer className="table-footer">
          <span>
            Appointments refresh automatically every 15 seconds and after each call.
          </span>
          <span>Storage: JSON ledger</span>
        </footer>
      </section>

      {cancelTarget ? (
        <CancelDialog
          open
          appointment={cancelTarget}
          onClose={() => setCancelTarget(null)}
        />
      ) : null}
    </div>
  )
}
