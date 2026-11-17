import { useState } from 'react'

import Badge from './Badge'
import Modal from './Modal'
import { useClinicData } from '../hooks/useClinicData'
import { useToast } from '../hooks/useToast'
import { formatDate, formatPhone, formatTime } from '../utils/format'

function normalizePhone(value) {
  return value.replace(/[\s()-]/g, '')
}

export default function CancelDialog({ open, appointment, onClose }) {
  const { cancelAppointment } = useClinicData()
  const { pushToast } = useToast()
  const [phone, setPhone] = useState(appointment?.patient_phone || '')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    const cleanPhone = normalizePhone(phone)

    if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
      setError('Enter the phone number used for this booking.')
      return
    }

    if (!confirmed) {
      setError('Confirm that the patient asked to cancel this appointment.')
      return
    }

    setSubmitting(true)

    try {
      await cancelAppointment(appointment.appointment_id, {
        patient_phone: cleanPhone,
        phone_confirmed: true,
      })

      pushToast({
        tone: 'success',
        title: 'Appointment cancelled',
        description: `${appointment.patient_name} · ${formatDate(appointment.appointment_date)} at ${formatTime(appointment.appointment_time)}`,
      })
      onClose()
    } catch (caught) {
      setError(caught.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={submitting ? () => {} : onClose}
      title="Cancel this appointment"
      description="The slot will reopen for other patients."
      footer={
        <>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Keep appointment
          </button>
          <button
            type="submit"
            form="cancel-form"
            className="btn btn--danger"
            disabled={submitting || !appointment}
          >
            {submitting ? 'Cancelling…' : 'Cancel appointment'}
          </button>
        </>
      }
    >
      {appointment ? (
        <>
          <div className="cancel-summary">
            <div>
              <span className="cancel-summary__label">Appointment</span>
              <strong>{appointment.appointment_id}</strong>
            </div>
            <div>
              <span className="cancel-summary__label">Patient</span>
              <strong>{appointment.patient_name}</strong>
              <span className="cancel-summary__muted">
                {formatPhone(appointment.patient_phone)}
              </span>
            </div>
            <div>
              <span className="cancel-summary__label">With</span>
              <strong>{appointment.doctor_name}</strong>
              <span className="cancel-summary__muted">{appointment.speciality}</span>
            </div>
            <div>
              <span className="cancel-summary__label">When</span>
              <strong>
                {formatDate(appointment.appointment_date)} ·{' '}
                {formatTime(appointment.appointment_time)}
              </strong>
              <Badge tone="success" dot>
                Booked
              </Badge>
            </div>
          </div>

          <form id="cancel-form" className="form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="cancel-phone">Phone number on the booking</label>
              <input
                id="cancel-phone"
                name="patient_phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                pattern="^\+?[0-9]{10,15}$"
                disabled={submitting}
                aria-describedby="cancel-phone-hint"
              />
              <p id="cancel-phone-hint" className="form-hint">
                The server checks this number against the booking before cancelling.
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
                The patient asked to cancel and confirmed their phone number.
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
