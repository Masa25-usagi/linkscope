import { useEffect, useRef } from 'react'
import { Icon } from './Icon'

interface HelpDialogProps {
  open: boolean
  onClose: () => void
}

export function HelpDialog({ open, onClose }: HelpDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeButtonRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-dialog-heading">
        <div className="dialog-heading">
          <div><h2 id="help-dialog-heading">安全に使うために</h2></div>
          <button ref={closeButtonRef} type="button" className="icon-button" aria-label="ダイアログを閉じる" onClick={onClose}><Icon name="x" size={22} /></button>
        </div>
        <div className="dialog-content">
          <p>LinkScope は、本人または全参加者の明示的な同意を得たデータと合成データだけを、ブラウザ内で比較する研究用PoCです。</p>
          <div className="dialog-note"><Icon name="shield" size={21} /><span>ファイルはこのページのメモリだけで処理され、外部サービス・API・Cookieには接続しません。</span></div>
          <h3>スコアの見方</h3>
          <p>共通接続（50%）、接続パターン（20%）、表示名の類似（20%）、作成時期（10%）を重み付けしています。類似度は同一性の確率や本人判定ではありません。</p>
          <h3>禁止されている用途</h3>
          <p>非公開アカウントの探索、本人同意のないプロファイリング、外部サービスへの自動収集や身元の断定には使用しないでください。</p>
        </div>
        <div className="dialog-footer"><button type="button" className="button button-primary" onClick={onClose}>閉じる</button></div>
      </section>
    </div>
  )
}
