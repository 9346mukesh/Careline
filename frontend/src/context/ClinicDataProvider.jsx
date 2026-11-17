import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { api } from '../api/client'
import { ClinicDataContext } from './clinic-context'
import { todayIso } from '../utils/format'

const POLL_INTERVAL_MS = 15000
const slotKey = (doctorId, slotId) => `${doctorId}:${slotId}`
const appointmentMoment = (appointment) =>
  `${appointment.appointment_date || ''}T${appointment.appointment_time || ''}`

export default function ClinicDataProvider({ children }) {
  const [doctors, setDoctors] = useState([])
  const [appointments, setAppointments] = useState([])
  const [availability, setAvailability] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const activeRequest = useRef(null)

  const load = useCallback(async () => {
    activeRequest.current?.abort()

    const controller = new AbortController()
    activeRequest.current = controller

    try {
      const [doctorData, appointmentData, availabilityData] = await Promise.all([
        api.listDoctors({ signal: controller.signal }),
        api.listAppointments({ signal: controller.signal }),
        api.listAvailability({ signal: controller.signal }),
      ])

      if (controller.signal.aborted) return

      setDoctors(doctorData)
      setAppointments(appointmentData)
      setAvailability(availabilityData)
      setError(null)
      setLastUpdated(new Date())
    } catch (caught) {
      if (caught.name === 'AbortError' || controller.signal.aborted) return
      setError(caught)
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null
        setLoading(false)
      }
    }
  }, [])

  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setRefreshing(true)

      try {
        await load()
      } finally {
        if (!silent) setRefreshing(false)
      }
    },
    [load],
  )

  const bookAppointment = useCallback(
    async (payload) => {
      const appointment = await api.bookAppointment(payload)
      await load()
      return appointment
    },
    [load],
  )

  const cancelAppointment = useCallback(
    async (appointmentId, payload) => {
      const appointment = await api.cancelAppointment(appointmentId, payload)
      await load()
      return appointment
    },
    [load],
  )

  useEffect(() => {
    // Defer the first sync so the effect never triggers a render synchronously.
    const initialSync = window.setTimeout(() => {
      load()
    }, 0)

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        load()
      }
    }, POLL_INTERVAL_MS)

    const handleFocus = () => load()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        load()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.clearTimeout(initialSync)
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
      activeRequest.current?.abort()
    }
  }, [load])

  const doctorById = useMemo(
    () => new Map(doctors.map((doctor) => [doctor.doctor_id, doctor])),
    [doctors],
  )

  const bookedSlotKeys = useMemo(
    () =>
      new Set(
        appointments
          .filter((appointment) => appointment.status === 'booked')
          .map((appointment) => slotKey(appointment.doctor_id, appointment.slot_id)),
      ),
    [appointments],
  )

  const availableSlotKeys = useMemo(() => {
    const keys = new Set()

    availability.forEach((doctor) => {
      doctor.available_slots.forEach((slot) => {
        keys.add(slotKey(doctor.doctor_id, slot.slot_id))
      })
    })

    return keys
    }, [availability])

  const availableSlots = useMemo(
    () =>
      availability.flatMap((doctor) =>
        doctor.available_slots.map((slot) => ({
          ...slot,
          doctor_id: doctor.doctor_id,
          doctor_name: doctor.doctor_name,
          speciality: doctor.speciality,
        })),
      ),
    [availability],
  )

  const availableByDoctor = useMemo(() => {
    const map = new Map()

    availability.forEach((doctor) => {
      map.set(doctor.doctor_id, doctor.available_slots)
    })

    return map
  }, [availability])

  const enrichedAppointments = useMemo(() => {
    const rank = { booked: 0, cancelled: 1 }

    return appointments
      .map((appointment) => {
        const doctor = doctorById.get(appointment.doctor_id)

        return {
          ...appointment,
          doctor_name: doctor?.name || appointment.doctor_id,
          speciality: doctor?.speciality || 'General',
        }
      })
      .sort((first, second) => {
        const rankDiff = (rank[first.status] ?? 2) - (rank[second.status] ?? 2)

        if (rankDiff !== 0) return rankDiff

        return appointmentMoment(first).localeCompare(appointmentMoment(second))
      })
  }, [appointments, doctorById])

  const bookedAppointments = useMemo(
    () =>
      enrichedAppointments
        .filter((appointment) => appointment.status === 'booked')
        .sort((first, second) =>
          appointmentMoment(first).localeCompare(appointmentMoment(second)),
        ),
    [enrichedAppointments],
  )

  const specialities = useMemo(() => {
    const unique = new Set(doctors.map((doctor) => doctor.speciality))
    return Array.from(unique).sort()
  }, [doctors])

  const stats = useMemo(
    () => ({
      doctors: doctors.length,
      activeAppointments: appointments.filter(
        (appointment) => appointment.status === 'booked',
      ).length,
      cancelledAppointments: appointments.filter(
        (appointment) => appointment.status === 'cancelled',
      ).length,
      totalAppointments: appointments.length,
      openSlots: availableSlots.length,
      openSlotsToday: availableSlots.filter((slot) => slot.date === todayIso()).length,
    }),
    [appointments, doctors.length, availableSlots],
  )

  const value = useMemo(
    () => ({
      doctors,
      appointments: enrichedAppointments,
      availability,
      availableSlots,
      availableByDoctor,
      availableSlotKeys,
      bookedSlotKeys,
      doctorById,
      bookedAppointments,
      nextAppointment: bookedAppointments[0] || null,
      specialities,
      stats,
      loading,
      refreshing,
      error,
      lastUpdated,
      refresh,
      bookAppointment,
      cancelAppointment,
    }),
    [
      doctors,
      enrichedAppointments,
      availability,
      availableSlots,
      availableByDoctor,
      availableSlotKeys,
      bookedSlotKeys,
      doctorById,
      bookedAppointments,
      specialities,
      stats,
      loading,
      refreshing,
      error,
      lastUpdated,
      refresh,
      bookAppointment,
      cancelAppointment,
    ],
  )

  return (
    <ClinicDataContext.Provider value={value}>
      {children}
    </ClinicDataContext.Provider>
  )
}
