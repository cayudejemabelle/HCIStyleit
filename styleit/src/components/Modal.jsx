import { useEffect, useRef } from 'react'

// A pop-up built on the browser's own <dialog>: it traps focus and closes with Esc.
export default function Modal({ open, onClose, labelledBy, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} aria-labelledby={labelledBy} onClose={onClose}>
      {open ? children : null}
    </dialog>
  )
}
