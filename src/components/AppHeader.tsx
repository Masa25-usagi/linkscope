import { Icon } from './Icon'

interface AppHeaderProps {
  menuOpen: boolean
  onMenuToggle: () => void
  onHelp: () => void
  onReset: () => void
}

export function AppHeader({ menuOpen, onMenuToggle, onHelp, onReset }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-wrap"><span className="brand-mark" aria-hidden="true">L</span><span className="brand-name">LinkScope</span></div>
      <div className={`header-actions ${menuOpen ? 'is-open' : ''}`}>
        <span className="local-badge"><Icon name="shield" size={17} /> ローカル処理・外部送信なし</span>
        <button type="button" className="header-link" onClick={onHelp}><Icon name="book" size={18} /> ドキュメント</button>
        <button type="button" className="header-link" onClick={onReset}><Icon name="reset" size={18} /> リセット</button>
        <button type="button" className="header-link" onClick={onHelp}><Icon name="help" size={18} /> ヘルプ</button>
      </div>
      <button type="button" className="menu-toggle" aria-label={menuOpen ? 'メニューを閉じる' : 'メニューを開く'} aria-expanded={menuOpen} onClick={onMenuToggle}>
        <Icon name={menuOpen ? 'x' : 'menu'} size={27} strokeWidth={1.8} />
      </button>
    </header>
  )
}

