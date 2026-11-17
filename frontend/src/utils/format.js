const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

const longDateFormatter = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const shortDateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
})

const timeFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
})

const clockFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
})

export function parseDateOnly(value) {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value) {
  const date = parseDateOnly(value)
  return date ? dateFormatter.format(date) : value || '—'
}

export function formatLongDate(value = new Date()) {
  return longDateFormatter.format(value)
}

export function formatShortDate(value) {
  const date = parseDateOnly(value)
  return date ? shortDateFormatter.format(date) : value || '—'
}

export function formatTime(value) {
  if (!value) return '—'

  const [hours, minutes] = value.split(':').map(Number)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value

  const date = new Date()
  date.setHours(hours, minutes, 0, 0)

  return timeFormatter.format(date)
}

export function formatClock(value = new Date()) {
  return clockFormatter.format(value)
}

export function toIsoDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function todayIso() {
  return toIsoDate()
}

export function initials(name = '') {
  const cleaned = name.replace(/^dr\.?\s+/i, '').trim()

  if (!cleaned) return '?'

  return cleaned
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function maskPhone(phone = '') {
  const digits = phone.replace(/\D/g, '')

  if (digits.length < 4) return '••••'

  const prefix = phone.startsWith('+') ? '+' : ''
  return `${prefix}••••••${digits.slice(-4)}`
}

export function formatPhone(phone = '') {
  const digits = phone.replace(/\D/g, '')

  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
  }

  return phone
}

export function durationLabel(minutes) {
  if (!minutes) return ''
  return `${minutes} min`
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return count === 1 ? singular : plural
}

export function greetingForHour(hour = new Date().getHours()) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function elapsedLabel(startedAt) {
  if (!startedAt) return '00:00'

  const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
  const remainder = String(seconds % 60).padStart(2, '0')

  return `${minutes}:${remainder}`
}

export function friendlyToolName(name) {
  const names = {
    check_doctor_availability: 'Checking doctor availability',
    book_appointment: 'Booking the appointment',
    cancel_appointment: 'Cancelling the appointment',
  }

  return names[name] || 'Working on your request'
}
