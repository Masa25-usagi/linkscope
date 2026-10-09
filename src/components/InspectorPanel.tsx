import type { SimilarityResult, SubAccountCandidate } from '../types'
import { Icon } from './Icon'

interface InspectorPanelProps {
  // オフラインモード
  result?: SimilarityResult | null
  // オンラインモード
  onlineCandidate?: SubAccountCandidate | null
  closeFriendsCount?: number
  mode: 'online' | 'offline'
  onExport: () => void
}

// オフラインモード用の信号行
const offlineSignalRows = [
  { key: 'commonConnectionScore', contribution: 'commonConnections', label: '共通接続', color: 'indigo' },
  { key: 'connectionPatternScore', contribution: 'connectionPattern', label: '接続パターン', color: 'teal' },
  { key: 'nameSimilarityScore', contribution: 'nameSimilarity', label: '表示名の類似', color: 'indigo' },
  { key: 'creationProximityScore', contribution: 'creationProximity', label: '作成時期', color: 'amber' },
] as const

function percent(value: number): string {
  return `${Math.round(value * 100)}%`
}

function OnlineInspector({ candidate, closeFriendsCount }: { candidate: SubAccountCandidate; closeFriendsCount: number }) {
  const n = closeFriendsCount || 1
  const signals = [
    { label: '相互フォロー率', value: candidate.cMut / n, contribution: candidate.mutualScore, color: 'indigo' },
    { label: '被フォロー率', value: candidate.cIn / n, contribution: candidate.inboundScore, color: 'teal' },
    { label: 'フォロー率', value: candidate.cOut / n, contribution: candidate.outboundScore, color: 'teal' },
    { label: 'フォロワー数ペナルティ', value: candidate.followerPenalty, contribution: -candidate.followerPenalty, color: 'amber', isNegative: true },
    { label: '名前/ID類似度', value: candidate.similarityBonus, contribution: candidate.similarityBonus, color: 'indigo' },
  ]
  const totalPositive = candidate.mutualScore + candidate.inboundScore + candidate.outboundScore + candidate.similarityBonus

  return (
    <>
      <div className="selected-summary">
        <div className="selected-user-info">
          <Icon name="lock" size={16} />
          <span>@<strong>{candidate.screenName}</strong></span>
          <span className="protected-badge">🔒 鍵垢</span>
        </div>
        <div className="total-score">
          <span>サブ垢スコア</span>
          <strong>{candidate.score.toFixed(2)}</strong>
        </div>
      </div>

      <div className="breakdown" aria-label="スコア信号の内訳">
        {signals.map((row) => {
          const share = totalPositive > 0 ? Math.abs(row.contribution) / totalPositive : 0
          return (
            <div className={`breakdown-row ${row.isNegative ? 'is-negative' : ''}`} key={row.label}>
              <div className="breakdown-label">
                <span>{row.label}</span>
                <small>
                  {row.isNegative ? '−' : ''}
                  {Math.abs(row.contribution).toFixed(3)}
                </small>
              </div>
              <div className="breakdown-meter">
                <span className={`meter-fill meter-${row.color}`} style={{ width: `${Math.min(100, Math.abs(row.value) * 100)}%` }} />
              </div>
              <strong>{row.isNegative ? `−${percent(share)}` : percent(share)}</strong>
            </div>
          )
        })}
      </div>

      <div className="candidate-detail">
        <h3>候補の詳細</h3>
        <ul>
          <li><Icon name="user" size={14} /> フォロワー: <strong>{candidate.followersCount.toLocaleString()}</strong> / フォロー: <strong>{candidate.friendsCount.toLocaleString()}</strong></li>
          <li><Icon name="link" size={14} /> 親密ユーザーとの相互: <strong>{candidate.cMut}</strong> / {closeFriendsCount} 人</li>
          <li><Icon name="link" size={14} /> 被フォロー: <strong>{candidate.cIn}</strong> / フォロー: <strong>{candidate.cOut}</strong></li>
          <li>作成日: {candidate.createdAt || '不明'}</li>
          <li>接続先: {candidate.connectedFriends.map((f) => `@${f}`).join(', ')}</li>
        </ul>
        <p className="explanation-full">{candidate.explanation}</p>
      </div>
    </>
  )
}

function OfflineInspector({ result }: { result: SimilarityResult }) {
  return (
    <>
      <div className="selected-summary">
        <span>選択中: <strong>{result.candidateId}</strong></span>
        <div className="total-score"><span>総合類似度</span><strong>{result.score.toFixed(2)}</strong><small>/ 1.00</small></div>
      </div>
      <div className="breakdown" aria-label="スコア信号の内訳">
        {offlineSignalRows.map((row) => {
          const signalValue = result[row.key]
          const contributionValue = result.contributions[row.contribution]
          const contributionShare = result.score > 0 ? contributionValue / result.score : 0
          return (
            <div className="breakdown-row" key={row.key}>
              <div className="breakdown-label"><span>{row.label}</span><small>信号 {signalValue.toFixed(2)} · 寄与 {contributionValue.toFixed(2)}</small></div>
              <div className="breakdown-meter"><span className={`meter-fill meter-${row.color}`} style={{ width: `${signalValue * 100}%` }} /></div>
              <strong>{percent(contributionShare)}</strong>
            </div>
          )
        })}
      </div>
      <div className="notice notice-warning">
        <Icon name="warning" size={21} />
        <p><strong>一致を断定するものではありません</strong><br />この結果は観測可能な類似性信号の要約です。同一人物であることを示す確率や身元判定ではありません。</p>
      </div>
      <div className="candidate-detail">
        <h3>選択中の候補の詳細</h3>
        <ul>
          <li>共通接続は {result.commonConnections.length} 件です。</li>
          <li>接続パターン信号は {result.connectionPatternScore.toFixed(2)} です。</li>
          <li>表示名の類似信号は {result.nameSimilarityScore.toFixed(2)} です。</li>
          <li>作成時期: {result.candidate.createdAt ?? '不明'}。</li>
        </ul>
        <p className="explanation-full">{result.explanation}</p>
      </div>
    </>
  )
}

export function InspectorPanel({ result, onlineCandidate, closeFriendsCount = 0, mode, onExport }: InspectorPanelProps) {
  const hasSelection = mode === 'online' ? Boolean(onlineCandidate) : Boolean(result)

  return (
    <aside className="inspector-column" aria-label="選択候補の詳細">
      <section className="panel inspector-panel" aria-labelledby="inspector-heading">
        <div className="panel-heading-row">
          <h2 id="inspector-heading">スコアの内訳</h2>
          <span className="panel-caption">
            <Icon name="info" size={14} /> {mode === 'online' ? '5信号' : '4信号'}
          </span>
        </div>
        {!hasSelection && (
          <div className="inspector-empty" role="status">
            <Icon name="info" size={26} />
            <strong>候補を選択してください</strong>
            <p>結果一覧から候補を選ぶと、信号の根拠とネットワークが表示されます。</p>
          </div>
        )}
        {mode === 'online' && onlineCandidate && (
          <OnlineInspector candidate={onlineCandidate} closeFriendsCount={closeFriendsCount} />
        )}
        {mode === 'offline' && result && (
          <OfflineInspector result={result} />
        )}
      </section>
      <section className="panel export-panel" aria-labelledby="export-heading">
        <div className="panel-heading-row">
          <h2 id="export-heading">エクスポート</h2>
        </div>
        <button type="button" className="button button-outline export-button" onClick={onExport} disabled={!hasSelection}>
          <Icon name="download" size={19} /> 結果をJSONで保存
        </button>
        <p className="field-hint">入力データと分析結果は外部へ送信されません。</p>
      </section>
    </aside>
  )
}
