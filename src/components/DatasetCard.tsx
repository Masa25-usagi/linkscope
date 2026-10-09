import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import type { DatasetStats, LinkScopeDataset } from '../types'
import { Icon } from './Icon'

interface DatasetCardProps {
  dataset: LinkScopeDataset | null
  sourceName: string | null
  stats: DatasetStats | undefined
  errors: string[]
  warnings: string[]
  onFileSelected: (file: File) => void
  onLoadSample: () => void
  onClear: () => void
}

function formatCount(value: number): string {
  return value.toLocaleString('ja-JP')
}

export function DatasetCard({
  dataset,
  sourceName,
  stats,
  errors,
  warnings,
  onFileSelected,
  onLoadSample,
  onClear,
}: DatasetCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onFileSelected(file)
    }
    event.target.value = ''
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) {
      onFileSelected(file)
    }
  }

  return (
    <section className="panel dataset-panel" aria-labelledby="dataset-heading">
      <div className="panel-heading-row">
        <h2 id="dataset-heading">データセット</h2>
        {dataset && (
          <span className="status-pill status-safe">
            <Icon name="check" size={15} strokeWidth={2.5} /> 読込完了
          </span>
        )}
      </div>

      <div className="dataset-load-row">
        <label
          className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
          htmlFor="dataset-file"
          onDragEnter={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (event.currentTarget === event.target) {
              setIsDragging(false)
            }
          }}
          onDrop={handleDrop}
        >
          <Icon name="file" size={27} strokeWidth={1.55} />
          <span>
            <strong>JSON / CSV を選択</strong>
            <small>またはファイルをドラッグ＆ドロップ</small>
          </span>
          <input
            ref={inputRef}
            id="dataset-file"
            type="file"
            aria-label="JSON / CSV ファイルを選択"
            accept=".json,.csv,application/json,text/csv"
            onChange={handleFileInput}
          />
        </label>
        <button type="button" className="button button-outline sample-button" onClick={onLoadSample}>
          サンプルを読み込む
        </button>
      </div>

      {sourceName && (
        <div className="file-row">
          <Icon name="file" size={19} />
          <span className="file-name" title={sourceName}>{sourceName}</span>
          {stats && <span className="file-size">{formatCount(stats.edgeCount)} エッジ</span>}
          <span className={`file-status ${dataset ? 'is-safe' : 'is-error'}`}>
            <Icon name={dataset ? 'check' : 'warning'} size={16} />
            {dataset ? '検証済み' : '読込エラー'}
          </span>
          <button type="button" className="button button-ghost compact-button" onClick={onClear}>
            クリア
          </button>
        </div>
      )}

      {errors.length > 0 && (
        <div className="message-box message-error" role="alert">
          <strong>読み込めませんでした</strong>
          <ul>
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="message-box message-warning" role="status">
          <strong>確認事項</strong>
          <ul>
            {warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      )}

      {dataset && stats && (
        <div className="dataset-summary" aria-label="データ概要">
          <div>
            <span>参照ノード</span>
            <strong>{dataset.referenceId}</strong>
          </div>
          <div>
            <span>参加者</span>
            <strong>{formatCount(stats.participantCount)}</strong>
          </div>
          <div>
            <span>接続ノード</span>
            <strong>{formatCount(stats.connectionCount)}</strong>
          </div>
          <div>
            <span>エッジ</span>
            <strong>{formatCount(stats.edgeCount)}</strong>
          </div>
        </div>
      )}
    </section>
  )
}
