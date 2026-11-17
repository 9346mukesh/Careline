import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}) {
  const dialogRef = useRef(null)
  const closeRef = useRef(onClose)
  const restoreFocusRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined

    restoreFocusRef.current = document.activeElement
    const dialog = dialogRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusFirst = window.requestAnimationFrame(() => {
      const focusable = dialog?.querySelectorAll(FOCUSABLE)

      if (focusable?.length) {
        focusable[0].focus()
      } else {
        dialog?.focus()
      }
    })

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current?.()
        return
      }

      if (event.key !== 'Tab' || !dialog) return

      const focusable = Array.from(dialog.querySelectorAll(FOCUSABLE))

      if (!focusable.length) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(focusFirst)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      restoreFocusRef.current?.focus?.()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeRef.current?.()
      }}
    >
      <div
        ref={dialogRef}
        className={`modal modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <header className="modal__header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descriptionId}>{description}</p> : null}
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={() => closeRef.current?.()}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer ? <footer className="modal__footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  )
}
