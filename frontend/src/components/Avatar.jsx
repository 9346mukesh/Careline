import { initials } from '../utils/format'

export default function Avatar({ name, size = 'md', tone = 'teal' }) {
  return (
    <span
      className={`avatar avatar--${size} avatar--${tone}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
