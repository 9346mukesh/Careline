import { useState } from 'react'

import Avatar from './Avatar'
import Badge from './Badge'
import Modal from './Modal'
import { useClinicData } from '../hooks/useClinicData'
import { useToast } from '../hooks/useToast'
import { durationLabel, formatDate, formatTime } from '../utils/format'

function normalizePhone(value) {
  return value.replace(/[\s()-]/g, '')
}

export default function BookingDialog({ open, doctor, slot, onClose }) {
  const { bookAppointment } = useClinicData()
  const { pushToast } = useToast()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    const cleanName = name.trim()
    const cleanPhone = normalizePhone(phone)

    if (cleanName.length < 2) {
      setError('Enter the patient’s full name.')
      return
    }

    if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
      setError('Enter a valid phone number with 10 to 15 digits.')
      return
    }

    if (!confirmed) {
      setError('Confirm that the patient verified this phone number.')
      return
    }

    setSubmitting(true)

    try {
      await bookAppointment({
        doctor_id: doctor.doctor_id,
        slot_id: slot.slot_id,
        patient_name: cleanName,
        patient_phone: cleanPhone,
        phone_confirmed: true,
      })

      pushToast({
        tone: 'success',
        title: 'Appointment booked',
        description: `${doctor.name} · ${formatDate(slot.date)} at ${formatTime(slot.time)}`,
      })
      onClose()
    } catch (caught) {
      setError(caught.message)
    } finally {
      setSubmitting(false)
    }
  }

  const summary = doctor && slot

  return (
    <Modal
      open={open}
      onClose={submitting ? () => {} : onClose}
      title="Book this appointment"
      description="Confirm the patient details before reserving the slot."
      footer={
        <>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Keep browsing
          </button>
          <button
            type="submit"
            form="booking-form"
            className="btn btn--primary"
            disabled={submitting || !summary}
          >
            {submitting ? 'Booking…' : 'Confirm booking'}
          </button>
        </>
      }
    >
      {summary ? (
        <>
          <div className="booking-summary">
            <Avatar name={doctor.name} size="md" tone="teal" />
            <div>
              <strong>{doctor.name}</strong>
              <span>{doctor.speciality}</span>
            </div>
            <div className="booking-summary__slot">
              <span>{formatDate(slot.date)}</span>
              <strong>{formatTime(slot.time)}</strong>
              <Badge tone="neutral">{durationLabel(slot.duration_minutes)}</Badge>
            </div>
          </div>

          <form id="booking-form" className="form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="booking-name">Patient name</label>
              <input
                id="booking-name"
                name="patient_name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Asha Menon"
                required
                minLength={2}
                maxLength={100}
                disabled={submitting}
              />
            </div>

            <div className="form-field">
              <label htmlFor="booking-phone">Phone number</label>
              <input
                id="booking-phone"
                name="patient_phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="e.g. 9876543210"
                required
                pattern="^\+?[0-9]{10,15}$"
                disabled={submitting}
                aria-describedby="booking-phone-hint"
              />
              <p id="booking-phone-hint" className="form-hint">
                Use the number the patient confirmed. It is used to find and cancel
                the booking later.
              </p>
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                disabled={submitting}
              />
              <span>
                The patient confirmed this phone number and wants this appointment.
              </span>
            </label>

            {error ? (
              <div className="form-error" role="alert">
                {error}
              </div>
            ) : null}
          </form>
        </>
      ) : null}
    </Modal>
  )
}
