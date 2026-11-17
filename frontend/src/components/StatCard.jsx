export default function StatCard({ icon: Icon, label, value, detail, tone = 'teal' }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <span className="stat-card__icon" aria-hidden="true">
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <div>
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
        {detail ? <p className="stat-card__detail">{detail}</p> : null}
      </div>
    </article>
  )
}
