export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon ? (
        <span className="empty-state__icon" aria-hidden="true">
          <Icon size={22} strokeWidth={1.7} />
        </span>
      ) : null}
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  )
}
