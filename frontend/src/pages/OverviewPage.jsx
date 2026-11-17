import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
  Clock3,
  Sparkles,
  Stethoscope,
} from 'lucide-react'

import AppointmentTable from '../components/AppointmentTable'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import CallConsole from '../components/CallConsole'
import EmptyState from '../components/EmptyState'
import ErrorBanner from '../components/ErrorBanner'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { useClinicData } from '../hooks/useClinicData'
import {
  formatDate,
  formatLongDate,
  formatTime,
  greetingForHour,
  pluralize,
} from '../utils/format'

function OverviewSkeleton() {
  return (
    <div className="overview-skeleton" aria-hidden="true">
      <div className="skeleton-stats">
        {[0, 1, 2, 3].map((item) => (
          <div className="skeleton skeleton--stat" key={item} />
        ))}
      </div>
      <div className="skeleton-grid">
        <div className="skeleton skeleton--hero" />
        <div className="skeleton skeleton--panel" />
      </div>
    </div>
  )
}

export default function OverviewPage() {
  const {
    appointments,
    doctors,
    availableSlots,
    bookedSlotKeys,
    nextAppointment,
    stats,
    loading,
    error,
    refresh,
  } = useClinicData()

  const openSlots = useMemo(
    () =>
      [...availableSlots]
        .sort((first, second) =>
          `${first.date}T${first.time}`.localeCompare(`${second.date}T${second.time}`),
        )
        .slice(0, 4),
    [availableSlots],
  )

  const doctorRows = useMemo(
    () =>
      doctors.slice(0, 4).map((doctor) => ({
        ...doctor,
        open: doctor.available_slots.filter(
          (slot) => !bookedSlotKeys.has(`${doctor.doctor_id}:${slot.slot_id}`),
        ).length,
      })),
    [doctors, bookedSlotKeys],
  )

  if (loading && !doctors.length) {
    return (
      <div className="page">
        <PageHeader
          eyebrow={formatLongDate()}
          title={`${greetingForHour()}, front desk.`}
          description="Loading today’s clinic schedule."
        />
        <OverviewSkeleton />
      </div>
    )
  }

  return (
    <div className="page page--overview">
      <PageHeader
        eyebrow={formatLongDate()}
        title={`${greetingForHour()}, front desk.`}
        description="Take a patient call, keep the schedule moving, and verify every booking in one place."
        actions={
          <>
            <Link to="/doctors" className="btn btn--secondary">
              <Stethoscope size={16} aria-hidden="true" />
              Find a slot
            </Link>
            <Link to="/appointments" className="btn btn--ghost">
              <CalendarCheck2 size={16} aria-hidden="true" />
              Appointments
            </Link>
          </>
        }
      />

      {error ? (
        <ErrorBanner
          title="Clinic data could not be loaded"
          message={error.message}
          onRetry={refresh}
        />
      ) : null}

      <section className="stats-grid" aria-label="Clinic summary">
        <StatCard
          icon={CalendarCheck2}
          label="Active appointments"
          value={stats.activeAppointments}
          detail={`${stats.totalAppointments} total ${pluralize(stats.totalAppointments, 'record')}`}
          tone="teal"
        />
        <StatCard
          icon={Clock3}
          label="Open slots"
          value={stats.openSlots}
          detail={`${stats.openSlotsToday} left for today`}
          tone="coral"
        />
        <StatCard
          icon={Stethoscope}
          label="Doctors on duty"
          value={stats.doctors}
          detail="Available in the current schedule"
          tone="amber"
        />
        <StatCard
          icon={CalendarX2}
          label="Cancelled"
          value={stats.cancelledAppointments}
          detail="Slots returned to the pool"
          tone="ink"
        />
      </section>

      <div className="overview-grid">
        <div className="overview-main">
          <CallConsole variant="overview" />

          <section className="panel" aria-labelledby="overview-appointments">
            <header className="panel__header">
              <div>
                <p className="eyebrow">Schedule</p>
                <h2 id="overview-appointments">Appointments</h2>
              </div>
              <Link to="/appointments" className="text-link">
                View all
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </header>
            <AppointmentTable
              appointments={appointments}
              limit={5}
              emptyTitle="No appointments yet"
              emptyDescription="Start a voice call or choose a doctor to create the first booking."
              emptyAction={
                <Link to="/doctors" className="btn btn--secondary btn--sm">
                  Browse doctors
                </Link>
              }
            />
          </section>
        </div>

        <aside className="overview-rail" aria-label="Clinic highlights">
          <section className="panel next-card" aria-labelledby="next-appointment">
            <header className="panel__header">
              <div>
                <p className="eyebrow">Next up</p>
                <h2 id="next-appointment">Next appointment</h2>
              </div>
              <CalendarClock size={18} aria-hidden="true" className="panel__icon" />
            </header>

            {nextAppointment ? (
              <div className="next-appointment">
                <div className="next-appointment__time">
                  <span>{formatDate(nextAppointment.appointment_date)}</span>
                  <strong>{formatTime(nextAppointment.appointment_time)}</strong>
                </div>
                <div className="next-appointment__person">
                  <Avatar name={nextAppointment.patient_name} size="md" tone="coral" />
                  <div>
                    <strong>{nextAppointment.patient_name}</strong>
                    <span>
                      {nextAppointment.doctor_name} · {nextAppointment.speciality}
                    </span>
                  </div>
                </div>
                <div className="next-appointment__meta">
                  <Badge tone="success" dot>
                    Booked
                  </Badge>
                  <span>{nextAppointment.appointment_id}</span>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={CalendarCheck2}
                title="Nothing on the books"
                description="The next confirmed appointment will surface here."
              />
            )}
          </section>

          <section className="panel" aria-labelledby="open-slots">
            <header className="panel__header">
              <div>
                <p className="eyebrow">Availability</p>
                <h2 id="open-slots">Open slots</h2>
              </div>
              <Badge tone="success">{stats.openSlots} free</Badge>
            </header>

            {openSlots.length ? (
              <ul className="slot-list">
                {openSlots.map((slot) => (
                  <li key={`${slot.doctor_id}-${slot.slot_id}`}>
                    <Link to="/doctors" className="slot-row">
                      <span className="slot-row__time">
                        <strong>{formatTime(slot.time)}</strong>
                        <span>{formatDate(slot.date)}</span>
                      </span>
                      <span className="slot-row__doctor">
                        <strong>{slot.doctor_name}</strong>
                        <span>{slot.speciality}</span>
                      </span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="Schedule is full"
                description="No open slots are left in the current schedule."
              />
            )}
          </section>

          <section className="panel" aria-labelledby="doctors-duty">
            <header className="panel__header">
              <div>
                <p className="eyebrow">Team</p>
                <h2 id="doctors-duty">Doctors on duty</h2>
              </div>
              <Link to="/doctors" className="text-link">
                All doctors
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </header>
            <ul className="doctor-mini-list">
              {doctorRows.map((doctor) => (
                <li key={doctor.doctor_id}>
                  <Avatar name={doctor.name} size="sm" tone="teal" />
                  <div>
                    <strong>{doctor.name}</strong>
                    <span>{doctor.speciality}</span>
                  </div>
                  <span className={doctor.open ? 'mini-count' : 'mini-count is-full'}>
                    {doctor.open ? `${doctor.open} open` : 'Full'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
