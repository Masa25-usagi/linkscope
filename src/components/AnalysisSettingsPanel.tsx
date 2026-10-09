import type { AnalysisSettings } from '../types'
import { Icon } from './Icon'

interface AnalysisSettingsPanelProps {
  settings: AnalysisSettings
  canAnalyze: boolean
  disabledReason: string
  onChange: (patch: Partial<AnalysisSettings>) => void
  onAnalyze: () => void
}

function NumberStepper({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
  disabled,
  inputMode = 'numeric',
}: {
  label: string
  hint: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  disabled: boolean
  inputMode?: 'numeric' | 'decimal'
}) {
  const update = (next: number) => onChange(Math.min(max, Math.max(min, Number(next.toFixed(2)))))
  return (
    <div className="field-group">
      <label htmlFor={`field-${label}`}>{label} <span className="info-mark" title={hint}><Icon name="info" size={14} /></span></label>
      <div className="stepper">
        <input
          id={`field-${label}`}
          type="number"
          inputMode={inputMode}
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(event) => update(Number(event.target.value))}
        />
        <button type="button" aria-label={`${label}を減らす`} disabled={disabled || value <= min} onClick={() => update(value - step)}>
          <Icon name="minus" size={17} />
        </button>
        <button type="button" aria-label={`${label}を増やす`} disabled={disabled || value >= max} onClick={() => update(value + step)}>
          <Icon name="plus" size={17} />
        </button>
      </div>
      <span className="field-hint">{hint}</span>
    </div>
  )
}

export function AnalysisSettingsPanel({ settings, canAnalyze, disabledReason, onChange, onAnalyze }: AnalysisSettingsPanelProps) {
  return (
    <section className="panel settings-panel" aria-labelledby="settings-heading">
      <div className="panel-heading-row">
        <h2 id="settings-heading">分析設定</h2>
        <span className="panel-caption">類似度の信号を調整</span>
      </div>
      <div className="settings-grid">
        <NumberStepper
          label="最低共通接続数"
          hint="参照ノードと候補に共通する接続の最低件数"
          value={settings.minimumCommonConnections}
          min={0}
          max={50}
          step={1}
          disabled={!canAnalyze && disabledReason === 'データセットを読み込んでください。'}
          onChange={(value) => onChange({ minimumCommonConnections: value })}
        />
        <NumberStepper
          label="類似度しきい値"
          hint="0〜1のスコアで、これ以上の候補を表示"
          value={settings.similarityThreshold}
          min={0}
          max={1}
          step={0.05}
          inputMode="decimal"
          disabled={!canAnalyze && disabledReason === 'データセットを読み込んでください。'}
          onChange={(value) => onChange({ similarityThreshold: value })}
        />
        <div className="field-group">
          <label htmlFor="result-limit">上位結果の表示件数 <span className="info-mark" title="一覧に表示する最大件数"><Icon name="info" size={14} /></span></label>
          <select
            id="result-limit"
            value={settings.resultLimit}
            disabled={!canAnalyze && disabledReason === 'データセットを読み込んでください。'}
            onChange={(event) => onChange({ resultLimit: Number(event.target.value) })}
          >
            {[5, 10, 20, 50].map((limit) => <option key={limit} value={limit}>{limit} 件</option>)}
          </select>
          <span className="field-hint">結果を絞り込みすぎないための上限</span>
        </div>
        <div className="analyze-action">
          <button type="button" className="button button-primary analyze-button" disabled={!canAnalyze} onClick={onAnalyze}>
            <Icon name="sparkle" size={18} /> 分析を実行
          </button>
          <span className={`analyze-hint ${canAnalyze ? 'is-ready' : ''}`} role="status">
            {canAnalyze ? '同意確認済み。ブラウザ内で解析します。' : disabledReason}
          </span>
        </div>
      </div>
    </section>
  )
}

