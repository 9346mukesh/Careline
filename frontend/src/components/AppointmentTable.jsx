import { CalendarX2, X } from 'lucide-react'

import Badge from './Badge'
import EmptyState from './EmptyState'
import { formatDate, formatPhone, formatTime, maskPhone } from '../utils/format'

export default function AppointmentTable({
  appointments,
  onCancel,
  revealPhones = false,
  limit,
  emptyTitle = 'No appointments yet',
  emptyDescription = 'Bookings made by the voice agent or from the dashboard will appear here.',
  emptyAction,
}) {
  const rows = typeof limit === 'number' ? appointments.slice(0, limit) : appointments

  if (!rows.length) {
    return (
      <EmptyState
        icon={CalendarX2}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    )
  }

  return (
    <div className="table-wrap">
      <table className="appointment-table">
        <caption className="sr-only">Doctor appointments</caption>
        <thead>
          <tr>
            <th scope="col">Patient</th>
            <th scope="col">Doctor</th>
            <th scope="col">Appointment</th>
            <th scope="col">Status</th>
            {onCancel ? <th scope="col"><span className="sr-only">Actions</span></th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((appointment) => {
            const active = appointment.status === 'booked'

            return (
              <tr key={appointment.appointment_id}>
                <td data-label="Patient">
                  <div className="table-cell">
                    <span className="table-primary">{appointment.patient_name}</span>
                    <span className="table-secondary">
                      {revealPhones
                        ? formatPhone(appointment.patient_phone)
                        : maskPhone(appointment.patient_phone)}
                    </span>
                  </div>
                </td>
                <td data-label="Doctor">
                  <div className="table-cell">
                    <span className="table-primary">{appointment.doctor_name}</span>
                    <span className="table-secondary">{appointment.speciality}</span>
                  </div>
                </td>
                <td data-label="Appointment">
                  <div className="table-cell">
                    <span className="table-primary">
                      {formatDate(appointment.appointment_date)}
                    </span>
                    <span className="table-secondary">
                      {formatTime(appointment.appointment_time)} · {appointment.appointment_id}
                    </span>
                  </div>
                </td>
                <td data-label="Status">
                  <Badge tone={active ? 'success' : 'neutral'} dot>
                    {active ? 'Booked' : 'Cancelled'}
                  </Badge>
                </td>
                {onCancel ? (
                  <td data-label="Actions" className="table-actions">
                    {active ? (
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm btn--danger-text"
                        onClick={() => onCancel(appointment)}
                        aria-label={`Cancel appointment ${appointment.appointment_id} for ${appointment.patient_name}`}
                      >
                        <X size={14} aria-hidden="true" />
                        Cancel
                      </button>
                    ) : (
                      <span className="table-muted">No action</span>
                    )}
                  </td>
                ) : null}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
