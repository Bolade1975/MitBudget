import { BottomSheet } from './BottomSheet'

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Bekræft',
  danger,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <BottomSheet title={title} onClose={onCancel}>
      <p>{message}</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="button" className="btn btn-block" onClick={onCancel}>
          Annuller
        </button>
        <button
          type="button"
          className={`btn btn-block ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </BottomSheet>
  )
}
