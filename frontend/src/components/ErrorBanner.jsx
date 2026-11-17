import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function ErrorBanner({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="error-banner" role="alert">
      <span className="error-banner__icon" aria-hidden="true">
        <AlertTriangle size={18} />
      </span>
      <div className="error-banner__copy">
        <strong>{title}</strong>
        <p>{message || 'The clinic service did not respond. Please try again.'}</p>
      </div>
      {onRetry ? (
        <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry}>
          <RotateCcw size={15} aria-hidden="true" />
          Retry
        </button>
      ) : null}
    </div>
  )
}
