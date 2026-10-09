import { Icon } from './Icon'
import type { AppMode } from '../types'

interface StepRailProps {
  currentStep: 1 | 2 | 3 | 4 | 5
  mode: AppMode
  // オンラインモード用
  hasTarget?: boolean
  hasCloseFriends?: boolean
  hasScanComplete?: boolean
  hasResults?: boolean
  // オフラインモード用
  hasDataset?: boolean
  hasConsent?: boolean
}

const onlineSteps = [
  { number: 1, label: 'ターゲット入力' },
  { number: 2, label: '親密ユーザー' },
  { number: 3, label: 'FFスキャン' },
  { number: 4, label: 'スコアリング' },
  { number: 5, label: '結果' },
] as const

const offlineSteps = [
  { number: 1, label: 'データ読込' },
  { number: 2, label: '同意確認' },
  { number: 3, label: '分析設定' },
  { number: 4, label: '結果' },
] as const

export function StepRail({
  currentStep,
  mode,
  hasTarget = false,
  hasCloseFriends = false,
  hasScanComplete = false,
  hasResults = false,
  hasDataset = false,
  hasConsent = false,
}: StepRailProps) {
  const steps = mode === 'online' ? onlineSteps : offlineSteps
  const complete = mode === 'online'
    ? [hasTarget, hasCloseFriends, hasScanComplete, hasResults, hasResults]
    : [hasDataset, hasConsent, hasResults, hasResults]

  return (
    <nav className="step-rail" aria-label="分析の進行状況">
      <ol>
        {steps.map((step, index) => {
          const isCurrent = step.number === currentStep
          const isComplete = complete[index] && !isCurrent
          return (
            <li key={step.number} className={`${isCurrent ? 'is-current' : ''} ${isComplete ? 'is-complete' : ''}`}>
              <span className="step-marker" aria-hidden="true">
                {isComplete ? <Icon name="check" size={18} strokeWidth={2.5} /> : step.number}
              </span>
              <span className="step-label">{step.label}</span>
              <span className="step-status sr-only">
                {isCurrent ? '現在のステップ' : isComplete ? '完了' : '未完了'}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
