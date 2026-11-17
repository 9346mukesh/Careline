const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim()

export const API_BASE = (configuredBase || 'http://localhost:8000').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, { status = 0, kind = 'api' } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.kind = kind
  }
}

function messageFromDetail(detail) {
  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg)
      .filter(Boolean)
      .join(' ')
  }

  return 'Something went wrong. Please try again.'
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let response

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error

    throw new ApiError(
      'Cannot reach the clinic service. Make sure the FastAPI server is running.',
      { kind: 'network' },
    )
  }

  const contentType = response.headers.get('content-type') || ''
  let data = null

  if (contentType.includes('application/json')) {
    try {
      data = await response.json()
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    throw new ApiError(messageFromDetail(data?.detail), {
      status: response.status,
    })
  }

  return data
}

export const api = {
  listDoctors: ({ signal } = {}) => request('/api/doctors', { signal }),

  listAvailability: ({ speciality, date, doctorId, signal } = {}) => {
    const params = new URLSearchParams()

    if (speciality) params.set('speciality', speciality)
    if (date) params.set('date', date)
    if (doctorId) params.set('doctor_id', doctorId)

    const query = params.toString()

    return request(`/api/availability${query ? `?${query}` : ''}`, { signal })
  },

  listAppointments: ({ signal } = {}) => request('/api/appointments', { signal }),

  bookAppointment: (payload) =>
    request('/api/appointments', {
      method: 'POST',
      body: payload,
    }),

  cancelAppointment: (appointmentId, payload) =>
    request(`/api/appointments/${encodeURIComponent(appointmentId)}/cancel`, {
      method: 'POST',
      body: payload,
    }),

  voiceStatus: ({ signal } = {}) => request('/api/voice/status', { signal }),
}
