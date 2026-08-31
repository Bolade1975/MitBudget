import { BottomSheet } from '../../components/BottomSheet'
import type { EditScope } from '../../db/repositories/entryRepository'

export function EditScopeDialog({
  onChoose,
  onCancel,
}: {
  onChoose: (scope: EditScope) => void
  onCancel: () => void
}) {
  return (
    <BottomSheet title="Denne ændring gælder for" onClose={onCancel}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button type="button" className="btn btn-block" onClick={() => onChoose('thisMonthOnly')}>
          Kun denne måned
        </button>
        <button type="button" className="btn btn-block" onClick={() => onChoose('thisAndFuture')}>
          Denne og kommende måneder
        </button>
        <button type="button" className="btn btn-primary btn-block" onClick={() => onChoose('all')}>
          Alle måneder
        </button>
      </div>
    </BottomSheet>
  )
}
