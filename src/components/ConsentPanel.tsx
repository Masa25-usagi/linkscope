import { Icon } from './Icon'

interface ConsentPanelProps {
  checked: boolean
  disabled: boolean
  onChange: (checked: boolean) => void
}

export function ConsentPanel({ checked, disabled, onChange }: ConsentPanelProps) {
  return (
    <section className="panel consent-panel" aria-labelledby="consent-heading">
      <div className="panel-heading-row">
        <h2 id="consent-heading">同意確認</h2>
        <span className="panel-caption">必須</span>
      </div>
      <div className="consent-content">
        <label className={`checkbox-label ${disabled ? 'is-disabled' : ''}`}>
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span className="custom-checkbox" aria-hidden="true"><Icon name="check" size={16} strokeWidth={2.5} /></span>
          <span>対象者全員から分析への明示的な同意を得ています</span>
        </label>
        <span className={`consent-status ${checked ? 'is-confirmed' : ''}`} role="status">
          <Icon name={checked ? 'check' : 'info'} size={16} strokeWidth={2.1} />
          {checked ? '同意が確認されました' : '同意確認が必要です'}
        </span>
      </div>
      <p className="field-hint">同意のないデータや非公開情報は解析しないでください。チェックはこのページのメモリ内だけで使用します。</p>
    </section>
  )
}

