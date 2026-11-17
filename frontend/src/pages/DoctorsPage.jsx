import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck2, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react'

import BookingDialog from '../components/BookingDialog'
import DoctorCard from '../components/DoctorCard'
import EmptyState from '../components/EmptyState'
import ErrorBanner from '../components/ErrorBanner'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import { useClinicData } from '../hooks/useClinicData'
import { pluralize } from '../utils/format'

function DoctorsSkeleton() {
  return (
    <div className="doctors-grid" aria-hidden="true">
      {[0, 1, 2, 3].map((item) => (
        <div className="skeleton skeleton--doctor" key={item} />
      ))}
    </div>
  )
}

export default function DoctorsPage() {
  const {
    doctors,
    bookedSlotKeys,
    specialities,
    stats,
    loading,
    refreshing,
    error,
    refresh,
  } = useClinicData()
  const [query, setQuery] = useState('')
  const [speciality, setSpeciality] = useState('All')
  const [selection, setSelection] = useState(null)

  const filteredDoctors = useMemo(() => {
    const term = query.trim().toLowerCase()

    return doctors.filter((doctor) => {
      const matchesSpeciality =
        speciality === 'All' || doctor.speciality === speciality

      if (!matchesSpeciality) return false
      if (!term) return true

      return (
        doctor.name.toLowerCase().includes(term) ||
        doctor.speciality.toLowerCase().includes(term) ||
        doctor.doctor_id.toLowerCase().includes(term)
      )
    })
  }, [doctors, query, speciality])

  const hasFilters = query.trim() !== '' || speciality !== 'All'

  function clearFilters() {
    setQuery('')
    setSpeciality('All')
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Clinical team"
        title="Doctors & availability"
        description="Compare specialities, check live slot availability, and book a patient without leaving the desk."
        actions={
          <>
            <Link to="/appointments" className="btn btn--ghost">
              <CalendarCheck2 size={16} aria-hidden="true" />
              Appointments
            </Link>
            <button
              type="button"
              className="btn btn--secondary"
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
          title="Doctors could not be loaded"
          message={error.message}
          onRetry={refresh}
        />
      ) : null}

      <section className="availability-summary" aria-label="Availability summary">
        <div className="availability-summary__copy">
          <span className="status-dot is-online" aria-hidden="true" />
          <p>
            <strong>Live availability</strong>
            <span>
              {stats.openSlots} open {pluralize(stats.openSlots, 'slot')} across{' '}
              {stats.doctors} {pluralize(stats.doctors, 'doctor')}.
            </span>
          </p>
        </div>
        <Badge tone="success" dot>
          Synced with FastAPI
        </Badge>
      </section>

      <section className="toolbar" aria-label="Filter doctors">
        <div className="search-field">
          <Search size={17} aria-hidden="true" />
          <label htmlFor="doctor-search" className="sr-only">
            Search doctors by name, speciality, or ID
          </label>
          <input
            id="doctor-search"
            type="search"
            placeholder="Search by name, speciality, or ID"
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

        <div className="filter-chips" role="group" aria-label="Filter by speciality">
          <SlidersHorizontal size={15} aria-hidden="true" className="filter-chips__icon" />
          {['All', ...specialities].map((item) => (
            <button
              key={item}
              type="button"
              className={`chip ${speciality === item ? 'is-active' : ''}`}
              onClick={() => setSpeciality(item)}
              aria-pressed={speciality === item}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {loading && !doctors.length ? (
        <DoctorsSkeleton />
      ) : filteredDoctors.length ? (
        <>
          <p className="result-count" role="status">
            Showing {filteredDoctors.length}{' '}
            {pluralize(filteredDoctors.length, 'doctor')}
          </p>
          <div className="doctors-grid">
            {filteredDoctors.map((doctor, index) => (
              <DoctorCard
                key={doctor.doctor_id}
                doctor={doctor}
                index={index}
                bookedSlotKeys={bookedSlotKeys}
                onSelectSlot={(selectedDoctor, slot) =>
                  setSelection({ doctor: selectedDoctor, slot })
                }
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={Search}
          title="No doctors match those filters"
          description={
            hasFilters
              ? 'Try a different speciality or clear the search.'
              : 'No doctors are listed in the clinic schedule yet.'
          }
          action={
            hasFilters ? (
              <button type="button" className="btn btn--secondary btn--sm" onClick={clearFilters}>
                Clear filters
              </button>
            ) : null
          }
        />
      )}

      {selection ? (
        <BookingDialog
          open
          doctor={selection.doctor}
          slot={selection.slot}
          onClose={() => setSelection(null)}
        />
      ) : null}
    </div>
  )
}
