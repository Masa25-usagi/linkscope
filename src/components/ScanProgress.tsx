import type { AnalysisProgressEvent } from '../types'
import { Icon } from './Icon'

interface ScanProgressProps {
  progress: AnalysisProgressEvent | null
  isScanning: boolean
  onCancel: () => void
}

const stageLabels: Record<string, string> = {
  user_lookup: 'ユーザー情報取得',
  close_friends: '親密ユーザー抽出',
  scanning: 'FF一覧スキャン',
  scoring: 'スコアリング',
  complete: '完了',
  error: 'エラー',
}

export function ScanProgress({ progress, isScanning, onCancel }: ScanProgressProps) {
  if (!isScanning && !progress) return null

  const stage = progress?.stage ?? 'user_lookup'
  const message = progress?.message ?? '準備中...'
  const progressValue = progress?.progress ?? 0
  const isError = stage === 'error'

  return (
    <section className="panel scan-progress-panel" aria-labelledby="scan-heading">
      <div className="panel-heading-row">
        <h2 id="scan-heading">分析進捗</h2>
        <span className="panel-caption">{stageLabels[stage] ?? stage}</span>
      </div>
      <div className={`scan-progress-content ${isError ? 'is-error' : ''}`}>
        <div className="scan-progress-bar" role="progressbar" aria-valuenow={Math.round(progressValue * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={`scan-progress-fill ${isError ? 'is-error' : ''}`}
            style={{ width: `${Math.min(100, progressValue * 100)}%` }}
          />
        </div>
        <div className="scan-progress-message">
          {isScanning && !isError && <span className="scan-spinner" aria-hidden="true" />}
          {isError && <Icon name="warning" size={18} />}
          <span>{message}</span>
        </div>
        {isScanning && (
          <button type="button" className="button button-ghost" onClick={onCancel}>
            <Icon name="x" size={16} /> 中止
          </button>
        )}
      </div>
    </section>
  )
}
