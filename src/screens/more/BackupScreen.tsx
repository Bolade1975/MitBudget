import { useRef, useState } from 'react'
import { db } from '../../db/schema'
import { useSafeAction, useToast } from '../../state/toastHooks'
import { exportBackup, importBackup, parseBackupJson } from '../../db/repositories/backupRepository'
import { backupFileName, previewBackup, type BackupFile } from '../../domain/backup'
import { BottomSheet } from '../../components/BottomSheet'
import { formatDaDate } from '../../domain/format'

export function BackupScreen({ onBack }: { onBack: () => void }) {
  const safe = useSafeAction()
  const showToast = useToast()
  const fileInput = useRef<HTMLInputElement | null>(null)
  const [pendingImport, setPendingImport] = useState<BackupFile | null>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    const file = await safe(() => exportBackup(db))
    setExporting(false)
    if (!file) return
    const name = backupFileName(file.exportedAt)
    const json = JSON.stringify(file, null, 2)
    const blob = new Blob([json], { type: 'application/json' })

    const canShareFiles =
      typeof navigator !== 'undefined' &&
      'canShare' in navigator &&
      typeof File !== 'undefined' &&
      navigator.canShare?.({ files: [new File([blob], name, { type: 'application/json' })] })

    if (canShareFiles && navigator.share) {
      try {
        await navigator.share({
          files: [new File([blob], name, { type: 'application/json' })],
          title: name,
        })
        return
      } catch {
        // Fall through to download if the user cancels or share fails.
      }
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    showToast(`Sikkerhedskopi gemt som ${name}`)
  }

  async function handleFileSelected(file: File) {
    const text = await file.text()
    const result = parseBackupJson(text)
    if (!result.ok) {
      showToast(result.error)
      return
    }
    setPendingImport(result.file)
  }

  async function runImport(mode: 'replace' | 'merge') {
    if (!pendingImport) return
    setImporting(true)
    const ok = await safe(() => importBackup(db, pendingImport, mode))
    setImporting(false)
    if (ok !== undefined) {
      showToast('Importen er gennemført.')
      setPendingImport(null)
    }
  }

  const preview = pendingImport ? previewBackup(pendingImport) : null

  return (
    <div className="app-main">
      <button type="button" className="btn-text" onClick={onBack} style={{ marginBottom: 8 }}>
        ‹ Tilbage
      </button>
      <h1>Sikkerhedskopi</h1>
      <p className="text-sm muted">
        Appen har ingen cloud-konto. Skifter du telefon, skal du eksportere en fil her og importere
        den på den nye telefon.
      </p>

      <div className="section">
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={exporting}
          onClick={handleExport}
        >
          Eksporter sikkerhedskopi
        </button>
      </div>

      <div className="section">
        <button
          type="button"
          className="btn btn-block"
          disabled={importing}
          onClick={() => fileInput.current?.click()}
        >
          Importer sikkerhedskopi
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFileSelected(file)
            e.target.value = ''
          }}
        />
      </div>

      {pendingImport && preview ? (
        <BottomSheet title="Gennemse import" onClose={() => setPendingImport(null)}>
          <div className="row-group" style={{ marginBottom: 12 }}>
            <div className="row">
              <span className="row-name">Eksporteret</span>
              <span className="row-amount">{formatDaDate(preview.exportedAt.slice(0, 10))}</span>
            </div>
            <div className="row">
              <span className="row-name">Budgetår i filen</span>
              <span className="row-amount">{preview.years.join(', ') || 'ingen'}</span>
            </div>
            <div className="row">
              <span className="row-name">Antal poster</span>
              <span className="row-amount">{preview.entryCount}</span>
            </div>
          </div>
          <p className="text-sm muted">
            <strong>Erstat</strong> sletter dine nuværende data og bruger kun filens indhold.
            <strong> Sammenlæg</strong> beholder dine nuværende data og tilføjer/opdaterer med
            filens indhold, uden at oprette dubletter.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-block"
              disabled={importing}
              onClick={() => runImport('merge')}
            >
              Sammenlæg med eksisterende data
            </button>
            <button
              type="button"
              className="btn btn-danger btn-block"
              disabled={importing}
              onClick={() => runImport('replace')}
            >
              Erstat eksisterende data
            </button>
            <button type="button" className="btn-text" onClick={() => setPendingImport(null)}>
              Annuller
            </button>
          </div>
        </BottomSheet>
      ) : null}
    </div>
  )
}
