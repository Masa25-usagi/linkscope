import type { ResultSortKey, SimilarityResult, SortDirection, SubAccountCandidate } from '../types'
import { Icon } from './Icon'
import { filteredAndSortedResults } from './resultsUtils'

interface ResultsPanelProps {
  mode: 'online' | 'offline'
  // オフライン
  results: SimilarityResult[]
  query: string
  sortKey: ResultSortKey
  sortDirection: SortDirection
  selectedCandidateId: string | null
  hasAnalyzed: boolean
  onQueryChange: (query: string) => void
  onSort: (key: ResultSortKey) => void
  onSelect: (id: string) => void
  // オンライン
  onlineCandidates?: SubAccountCandidate[]
  selectedOnlineCandidateId?: string | null
  hasOnlineResults?: boolean
  onSelectOnline?: (id: string) => void
}

function scoreLabel(value: number): string {
  return value.toFixed(2)
}

export function ResultsPanel({
  mode,
  results,
  query,
  sortKey,
  sortDirection,
  selectedCandidateId,
  hasAnalyzed,
  onQueryChange,
  onSort,
  onSelect,
  onlineCandidates = [],
  selectedOnlineCandidateId,
  hasOnlineResults = false,
  onSelectOnline,
}: ResultsPanelProps) {
  if (mode === 'online') {
    const sortedOnline = [...onlineCandidates].sort((a, b) => {
      if (sortKey === 'score') {
        return sortDirection === 'descending' ? b.score - a.score : a.score - b.score
      }
      if (sortKey === 'commonConnections') {
        return sortDirection === 'descending' ? b.cMut - a.cMut : a.cMut - b.cMut
      }
      if (sortKey === 'followersCount') {
        return sortDirection === 'descending' ? b.followersCount - a.followersCount : a.followersCount - b.followersCount
      }
      return b.score - a.score
    })

    const filteredOnline = sortedOnline.filter((c) =>
      c.screenName.toLowerCase().includes(query.toLowerCase()) ||
      c.displayName.toLowerCase().includes(query.toLowerCase())
    )

    return (
      <section className="panel results-panel" aria-labelledby="results-heading">
        <div className="results-heading-row">
          <div>
            <h2 id="results-heading">サブ垢候補一覧</h2>
            <span className="results-subtitle">
              {hasOnlineResults ? `検出: ${filteredOnline.length} 件` : '分析を開始すると候補が表示されます'}
            </span>
          </div>
          <div className="results-tools">
            <label className="search-field">
              <span className="sr-only">候補を検索</span>
              <Icon name="search" size={19} />
              <input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="ユーザー名・表示名で検索"
                disabled={!hasOnlineResults}
              />
            </label>
            <label className="sort-select">
              <span className="sr-only">並べ替え</span>
              <select
                value={sortKey}
                onChange={(event) => onSort(event.target.value as ResultSortKey)}
                disabled={!hasOnlineResults}
              >
                <option value="score">サブ垢スコア順</option>
                <option value="commonConnections">相互フォロー数順</option>
                <option value="followersCount">フォロワー数順</option>
              </select>
            </label>
            <button
              type="button"
              className="button button-ghost filter-button"
              onClick={() => onSort(sortKey)}
              disabled={!hasOnlineResults}
            >
              <Icon name="filter" size={18} /> <span>{sortDirection === 'descending' ? '降順' : '昇順'}</span>
            </button>
          </div>
        </div>

        {!hasOnlineResults && (
          <div className="empty-state" role="status">
            <Icon name="sparkle" size={28} />
            <strong>分析前です</strong>
            <p>ターゲットアカウントを入力して「分析開始」をクリックしてください。</p>
          </div>
        )}

        {hasOnlineResults && filteredOnline.length === 0 && (
          <div className="empty-state" role="status">
            <Icon name="search" size={28} />
            <strong>{onlineCandidates.length === 0 ? '共通の鍵垢は見つかりませんでした' : '検索結果がありません'}</strong>
            <p>親密ユーザー間で共通する非公開アカウントが存在しないか、条件に一致しませんでした。</p>
          </div>
        )}

        {hasOnlineResults && filteredOnline.length > 0 && (
          <>
            <div className="table-wrap">
              <table>
                <caption className="sr-only">サブ垢候補一覧</caption>
                <thead>
                  <tr>
                    <th scope="col" className="radio-column"><span className="sr-only">選択</span></th>
                    <th scope="col">候補アカウント</th>
                    <th scope="col">スコア</th>
                    <th scope="col">親密FF相互</th>
                    <th scope="col">フォロワー</th>
                    <th scope="col">特徴・判定理由</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOnline.map((candidate) => {
                    const selected = candidate.userId === selectedOnlineCandidateId
                    return (
                      <tr
                        key={candidate.userId}
                        className={selected ? 'is-selected' : ''}
                        onClick={() => onSelectOnline?.(candidate.userId)}
                      >
                        <td className="radio-column">
                          <input
                            type="radio"
                            name="onlineCandidate"
                            checked={selected}
                            onChange={() => onSelectOnline?.(candidate.userId)}
                            aria-label={`@${candidate.screenName}を選択`}
                          />
                        </td>
                        <th scope="row">
                          <span className="candidate-id">
                            <Icon name="lock" size={14} /> @{candidate.screenName}
                          </span>
                          <span className="candidate-name">{candidate.displayName}</span>
                        </th>
                        <td>
                          <span className="score-cell">
                            <strong>{scoreLabel(candidate.score)}</strong>
                            <span className="mini-meter">
                              <span style={{ width: `${Math.min(100, Math.max(0, candidate.score * 100))}%` }} />
                            </span>
                          </span>
                        </td>
                        <td>
                          <span className="connection-count">{candidate.cMut}</span> 人
                          <small style={{ display: 'block', color: 'var(--text-muted)' }}>
                            (被: {candidate.cIn} / 与: {candidate.cOut})
                          </small>
                        </td>
                        <td>
                          <span>{candidate.followersCount.toLocaleString()}</span>
                        </td>
                        <td className="explanation-cell">
                          {candidate.explanation}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="results-footer" aria-live="polite">
              {query ? `${filteredOnline.length} / ${onlineCandidates.length} 件` : `${filteredOnline.length} 件の候補`}
            </div>
          </>
        )}
      </section>
    )
  }

  // オフラインモード（既存）
  const visibleResults = filteredAndSortedResults(results, query, sortKey, sortDirection)

  return (
    <section className="panel results-panel" aria-labelledby="results-heading">
      <div className="results-heading-row">
        <div>
          <h2 id="results-heading">結果一覧</h2>
          <span className="results-subtitle">{hasAnalyzed ? `フィルター: ${query ? '検索結果' : 'すべての結果'}` : '分析を実行すると結果が表示されます'}</span>
        </div>
        <div className="results-tools">
          <label className="search-field">
            <span className="sr-only">候補IDまたは表示名を検索</span>
            <Icon name="search" size={19} />
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="候補ID・表示名を検索" disabled={!hasAnalyzed} />
          </label>
          <label className="sort-select">
            <span className="sr-only">並べ替え項目</span>
            <select value={sortKey} onChange={(event) => onSort(event.target.value as ResultSortKey)} disabled={!hasAnalyzed}>
              <option value="score">類似度順</option>
              <option value="commonConnections">共通接続数順</option>
              <option value="nameSimilarity">名前類似度順</option>
              <option value="createdAt">作成時期順</option>
            </select>
          </label>
          <button type="button" className="button button-ghost filter-button" onClick={() => onSort(sortKey)} disabled={!hasAnalyzed}>
            <Icon name="filter" size={18} /> <span>{sortDirection === 'descending' ? '降順' : '昇順'}</span>
          </button>
        </div>
      </div>

      {!hasAnalyzed && (
        <div className="empty-state" role="status">
          <Icon name="sparkle" size={28} />
          <strong>分析前です</strong>
          <p>データを読み込み、同意を確認してから分析を実行してください。</p>
        </div>
      )}

      {hasAnalyzed && visibleResults.length === 0 && (
        <div className="empty-state" role="status">
          <Icon name="search" size={28} />
          <strong>{results.length === 0 ? '条件に合う候補はありません' : '検索結果がありません'}</strong>
          <p>{results.length === 0 ? 'しきい値または最低共通接続数を調整して再分析できます。' : '検索語を変えるか、検索欄をクリアしてください。'}</p>
        </div>
      )}

      {hasAnalyzed && visibleResults.length > 0 && (
        <>
          <div className="table-wrap">
            <table>
              <caption className="sr-only">候補の類似度一覧</caption>
              <thead>
                <tr>
                  <th scope="col" className="radio-column"><span className="sr-only">選択</span></th>
                  <th scope="col">候補ID</th>
                  <th scope="col" aria-sort={sortKey === 'score' ? sortDirection === 'descending' ? 'descending' : 'ascending' : 'none'}>類似度</th>
                  <th scope="col" aria-sort={sortKey === 'commonConnections' ? sortDirection === 'descending' ? 'descending' : 'ascending' : 'none'}>共通接続</th>
                  <th scope="col" aria-sort={sortKey === 'nameSimilarity' ? sortDirection === 'descending' ? 'descending' : 'ascending' : 'none'}>名前の類似</th>
                  <th scope="col">説明</th>
                </tr>
              </thead>
              <tbody>
                {visibleResults.map((result) => {
                  const selected = result.candidateId === selectedCandidateId
                  return (
                    <tr key={result.candidateId} className={selected ? 'is-selected' : ''} onClick={() => onSelect(result.candidateId)}>
                      <td className="radio-column">
                        <input type="radio" name="candidate" checked={selected} onChange={() => onSelect(result.candidateId)} aria-label={`${result.candidateId}を選択`} />
                      </td>
                      <th scope="row"><span className="candidate-id">{result.candidateId}</span><span className="candidate-name">{result.candidate.displayName}</span></th>
                      <td><span className="score-cell"><strong>{scoreLabel(result.score)}</strong><span className="mini-meter"><span style={{ width: `${result.score * 100}%` }} /></span></span></td>
                      <td><span className="connection-count">{result.commonConnections.length}</span> 件</td>
                      <td><span className="score-cell"><strong>{scoreLabel(result.nameSimilarityScore)}</strong><span className="mini-meter meter-teal"><span style={{ width: `${result.nameSimilarityScore * 100}%` }} /></span></span></td>
                      <td className="explanation-cell">{result.explanation.split('。')[0]}。</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="results-footer" aria-live="polite">
            {query ? `${visibleResults.length} / ${results.length} 件` : `${visibleResults.length} 件の候補`}
          </div>
        </>
      )}
    </section>
  )
}
