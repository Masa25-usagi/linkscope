import { useState, type FormEvent } from 'react'
import { Icon } from './Icon'

interface TargetInputProps {
  onSubmit: (screenName: string) => void
  isScanning: boolean
  backendAvailable: boolean
  onSwitchToOffline: () => void
}

export function TargetInput({ onSubmit, isScanning, backendAvailable, onSwitchToOffline }: TargetInputProps) {
  const [value, setValue] = useState('')

  const screenName = value.replace(/^@/, '').trim()
  const canSubmit = screenName.length > 0 && !isScanning && backendAvailable

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (canSubmit) {
      onSubmit(screenName)
    }
  }

  return (
    <section className="panel target-panel" aria-labelledby="target-heading">
      <div className="panel-heading-row">
        <h2 id="target-heading">ターゲットアカウント</h2>
        {!backendAvailable && (
          <span className="status-pill status-error">
            <Icon name="warning" size={15} /> サーバー未接続
          </span>
        )}
      </div>
      <form className="target-form" onSubmit={handleSubmit}>
        <div className="target-input-wrap">
          <span className="target-at" aria-hidden="true">@</span>
          <input
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="screen_name を入力"
            aria-label="X ユーザー名"
            disabled={isScanning}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button
          type="submit"
          className="button button-primary"
          disabled={!canSubmit}
        >
          <Icon name="search" size={18} /> 分析開始
        </button>
      </form>
      {!backendAvailable && (
        <div className="message-box message-warning">
          <p>
            バックエンドサーバーに接続できません。
            <code>cd backend && uvicorn server:app --reload</code> で起動してください。
          </p>
          <button type="button" className="button button-ghost" onClick={onSwitchToOffline}>
            オフラインモードで使う
          </button>
        </div>
      )}
      <p className="field-hint">
        サブ垢を特定したいアカウントのユーザー名を入力してください。そのアカウントとよく絡む人の共通FF鍵垢を自動で検出します。
      </p>
    </section>
  )
}
