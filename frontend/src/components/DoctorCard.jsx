import { useMemo } from 'react'
import { CalendarDays, Clock3 } from 'lucide-react'

import Avatar from './Avatar'
import Badge from './Badge'
import { durationLabel, formatDate, formatTime } from '../utils/format'

const AVATAR_TONES = ['teal', 'coral', 'amber', 'ink']

export default function DoctorCard({ doctor, bookedSlotKeys, onSelectSlot, index = 0 }) {
  const groups = useMemo(() => {
    const map = new Map()

    doctor.available_slots.forEach((slot) => {
      if (!map.has(slot.date)) map.set(slot.date, [])
      map.get(slot.date).push(slot)
    })

    return Array.from(map.entries()).sort(([first], [second]) =>
      first.localeCompare(second),
    )
  }, [doctor])

  const openCount = doctor.available_slots.filter(
    (slot) => !bookedSlotKeys.has(`${doctor.doctor_id}:${slot.slot_id}`),
  ).length

  return (
    <article className="doctor-card">
      <header className="doctor-card__header">
        <Avatar
          name={doctor.name}
          size="lg"
          tone={AVATAR_TONES[index % AVATAR_TONES.length]}
        />
        <div className="doctor-card__identity">
          <h3>{doctor.name}</h3>
          <p>
            {doctor.speciality}
            <span aria-hidden="true"> · </span>
            {doctor.experience_years} years
          </p>
        </div>
        <Badge tone={openCount > 0 ? 'success' : 'neutral'}>
          {openCount > 0 ? `${openCount} open` : 'Fully booked'}
        </Badge>
      </header>

      <div className="doctor-card__slots">
        {groups.map(([date, slots]) => (
          <div className="slot-group" key={date}>
            <p className="slot-group__date">
              <CalendarDays size={14} aria-hidden="true" />
              {formatDate(date)}
            </p>
            <div className="slot-group__chips">
              {slots.map((slot) => {
                const booked = bookedSlotKeys.has(
                  `${doctor.doctor_id}:${slot.slot_id}`,
                )

                return (
                  <button
                    key={slot.slot_id}
                    type="button"
                    className={`slot-chip ${booked ? 'is-booked' : ''}`}
                    disabled={booked}
                    onClick={() => onSelectSlot?.(doctor, slot)}
                    aria-label={
                      booked
                        ? `${doctor.name} at ${formatTime(slot.time)} on ${formatDate(date)} is already booked`
                        : `Book ${doctor.name} at ${formatTime(slot.time)} on ${formatDate(date)}`
                    }
                  >
                    <span>{formatTime(slot.time)}</span>
                    <small>
                      {booked ? (
                        'Booked'
                      ) : (
                        <>
                          <Clock3 size={11} aria-hidden="true" />
                          {durationLabel(slot.duration_minutes)}
                        </>
                      )}
                    </small>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <footer className="doctor-card__footer">
        <span>Choose an open slot to book the patient.</span>
        <span className="doctor-card__id">{doctor.doctor_id}</span>
      </footer>
    </article>
  )
}
