import { useState } from 'react'

/** Small inline help affordance so a field's meaning doesn't require opening the full guide. */
export function InfoIcon({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        className="info-btn"
        aria-expanded={open}
        aria-label="Mere information"
        onClick={() => setOpen((o) => !o)}
      >
        i
      </button>
      {open ? (
        <span
          role="status"
          className="card text-sm"
          style={{
            position: 'absolute',
            top: '22px',
            left: 0,
            zIndex: 30,
            width: '220px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
          }}
        >
          {text}
        </span>
      ) : null}
    </span>
  )
}
