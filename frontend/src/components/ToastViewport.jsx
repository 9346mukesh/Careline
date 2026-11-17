import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

export default function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="toast-viewport" role="region" aria-label="Notifications">
      {toasts.map((toast) => {
        const Icon = icons[toast.tone] || Info

        return (
          <div
            key={toast.id}
            className={`toast toast--${toast.tone}`}
            role={toast.tone === 'error' ? 'alert' : 'status'}
          >
            <span className="toast__icon" aria-hidden="true">
              <Icon size={18} />
            </span>
            <div className="toast__copy">
              <strong>{toast.title}</strong>
              {toast.description ? <p>{toast.description}</p> : null}
            </div>
            <button
              type="button"
              className="toast__close"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
