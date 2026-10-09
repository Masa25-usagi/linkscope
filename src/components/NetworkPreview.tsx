import { useMemo } from 'react'
import type { CloseFriend, LinkScopeDataset, SimilarityResult, SubAccountCandidate } from '../types'
import { Icon } from './Icon'
import { makeNetwork } from './networkUtils'

interface NetworkPreviewProps {
  mode: 'online' | 'offline'
  // オフライン
  dataset?: LinkScopeDataset | null
  result?: SimilarityResult | null
  // オンライン
  targetScreenName?: string
  closeFriends?: CloseFriend[]
  onlineCandidate?: SubAccountCandidate | null
}

export function NetworkPreview({
  mode,
  dataset = null,
  result = null,
  targetScreenName = '',
  closeFriends = [],
  onlineCandidate = null,
}: NetworkPreviewProps) {
  // オフライン用ネットワーク
  const offlineNetwork = useMemo(
    () => (dataset && result ? makeNetwork(dataset, result) : null),
    [dataset, result]
  )

  // オンライン用ネットワーク計算
  const onlineNetwork = useMemo(() => {
    if (!targetScreenName || !onlineCandidate || closeFriends.length === 0) return null

    const targetNode = { id: targetScreenName, label: `@${targetScreenName}`, x: 80, y: 120, kind: 'target' }
    const candidateNode = {
      id: onlineCandidate.screenName,
      label: `@${onlineCandidate.screenName} (🔒)`,
      x: 720,
      y: 120,
      kind: 'candidate',
    }

    const connectedSet = new Set(onlineCandidate.connectedFriends)
    // 最大8人表示
    const displayFriends = closeFriends.slice(0, 8)
    const friendNodes = displayFriends.map((f, i) => {
      const x = 200 + (400 / Math.max(1, displayFriends.length - 1)) * i
      const isTop = i % 2 === 0
      const y = isTop ? 50 : 190
      return {
        id: f.screenName,
        label: `@${f.screenName}`,
        x,
        y,
        isConnected: connectedSet.has(f.screenName),
        kind: 'friend',
      }
    })

    return { targetNode, candidateNode, friendNodes }
  }, [targetScreenName, onlineCandidate, closeFriends])

  if (mode === 'online') {
    return (
      <section className="panel network-panel" aria-labelledby="network-heading">
        <div className="panel-heading-row">
          <h2 id="network-heading">
            ソーシャルグラフ相関図 <span className="heading-note">（ターゲット × 親密FF × 鍵垢候補）</span>
          </h2>
          <span className="network-filter">
            <Icon name="filter" size={15} /> 共通の親密ユーザーを可視化
          </span>
        </div>
        {!onlineNetwork && (
          <div className="network-empty" role="status">
            <Icon name="info" size={24} />
            <span>サブ垢候補を選択すると、親密ユーザーとの接続グラフが表示されます。</span>
          </div>
        )}
        {onlineNetwork && (
          <>
            <div className="network-canvas">
              <svg
                viewBox="0 0 800 240"
                role="img"
                aria-label={`@${targetScreenName}と@${onlineCandidate?.screenName}のソーシャルグラフ`}
              >
                <defs>
                  <pattern id="network-dots-online" width="16" height="16" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="#d9deea" />
                  </pattern>
                </defs>
                <rect width="800" height="240" fill="url(#network-dots-online)" opacity=".48" />

                {/* ターゲットから各親密ユーザーへのエッジ */}
                {onlineNetwork.friendNodes.map((fn) => (
                  <line
                    key={`target-friend-${fn.id}`}
                    className="network-edge"
                    x1={onlineNetwork.targetNode.x}
                    y1={onlineNetwork.targetNode.y}
                    x2={fn.x}
                    y2={fn.y}
                    stroke="#4338ca"
                    strokeWidth="1.5"
                  />
                ))}

                {/* 親密ユーザーから鍵垢候補へのエッジ（繋がっている場合のみ） */}
                {onlineNetwork.friendNodes
                  .filter((fn) => fn.isConnected)
                  .map((fn) => (
                    <line
                      key={`friend-candidate-${fn.id}`}
                      className="network-edge network-edge-common"
                      x1={fn.x}
                      y1={fn.y}
                      x2={onlineNetwork.candidateNode.x}
                      y2={onlineNetwork.candidateNode.y}
                      stroke="#0d9488"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                  ))}

                {/* ノード描画 */}
                {/* ターゲットノード */}
                <g key="node-target">
                  <circle
                    className="network-node network-node-reference"
                    cx={onlineNetwork.targetNode.x}
                    cy={onlineNetwork.targetNode.y}
                    r={24}
                    fill="#312e81"
                  />
                  <text className="network-label" x={onlineNetwork.targetNode.x} y={onlineNetwork.targetNode.y + 44} textAnchor="middle">
                    {onlineNetwork.targetNode.label}
                  </text>
                </g>

                {/* 親密ユーザーノード */}
                {onlineNetwork.friendNodes.map((fn) => (
                  <g key={`node-friend-${fn.id}`}>
                    <circle
                      className="network-node"
                      cx={fn.x}
                      cy={fn.y}
                      r={fn.isConnected ? 14 : 10}
                      fill={fn.isConnected ? '#0d9488' : '#94a3b8'}
                    />
                    <text className="network-label" x={fn.x} y={fn.y > 120 ? fn.y + 24 : fn.y - 18} textAnchor="middle" fontSize="11">
                      {fn.label}
                    </text>
                  </g>
                ))}

                {/* 鍵垢候補ノード */}
                <g key="node-candidate">
                  <circle
                    className="network-node network-node-candidate"
                    cx={onlineNetwork.candidateNode.x}
                    cy={onlineNetwork.candidateNode.y}
                    r={24}
                    fill="#0d9488"
                  />
                  <text className="network-label" x={onlineNetwork.candidateNode.x} y={onlineNetwork.candidateNode.y + 44} textAnchor="middle">
                    {onlineNetwork.candidateNode.label}
                  </text>
                </g>
              </svg>
            </div>
            <div className="network-legend" aria-label="ネットワーク凡例">
              <span><i className="legend-dot" style={{ background: '#312e81' }} /> ターゲット（本人）</span>
              <span><i className="legend-dot" style={{ background: '#0d9488' }} /> 共通FFの親密ユーザー</span>
              <span><i className="legend-dot" style={{ background: '#94a3b8' }} /> その他親密ユーザー</span>
              <span><i className="legend-dot" style={{ background: '#0d9488', border: '2px solid #fff' }} /> 鍵垢候補</span>
              <span><i className="legend-line legend-dashed" /> 鍵垢との接続</span>
            </div>
          </>
        )}
      </section>
    )
  }

  // オフラインモード（既存）
  const nodeById = new Map(offlineNetwork?.nodes.map((node) => [node.id, node]) ?? [])

  return (
    <section className="panel network-panel" aria-labelledby="network-heading">
      <div className="panel-heading-row">
        <h2 id="network-heading">関連ネットワーク <span className="heading-note">（プレビュー）</span></h2>
        <span className="network-filter"><Icon name="filter" size={15} /> 共通接続を中心に表示</span>
      </div>
      {!offlineNetwork && (
        <div className="network-empty" role="status"><Icon name="info" size={24} /><span>候補を選択すると匿名ネットワークが表示されます。</span></div>
      )}
      {offlineNetwork && (
        <>
          <div className="network-canvas">
            <svg viewBox="0 0 800 240" role="img" aria-label={`${result?.candidateId ?? '候補'}と参照ノードの匿名ネットワーク。共通接続は${offlineNetwork.common.length}件`}>
              <defs>
                <pattern id="network-dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#d9deea" /></pattern>
              </defs>
              <rect width="800" height="240" fill="url(#network-dots)" opacity=".48" />
              {offlineNetwork.nodes.filter((node) => node.kind === 'common').map((node) => {
                const reference = nodeById.get(dataset?.referenceId ?? '')
                const candidate = nodeById.get(result?.candidateId ?? '')
                if (!reference || !candidate) return null
                return <g key={`edge-${node.id}`}><line className="network-edge network-edge-common" x1={reference.x} y1={reference.y} x2={node.x} y2={node.y} /><line className="network-edge network-edge-common" x1={candidate.x} y1={candidate.y} x2={node.x} y2={node.y} /></g>
              })}
              {offlineNetwork.referenceOnly.map((id) => {
                const node = nodeById.get(id)
                const reference = nodeById.get(dataset?.referenceId ?? '')
                return node && reference ? <line key={`ref-edge-${id}`} className="network-edge" x1={reference.x} y1={reference.y} x2={node.x} y2={node.y} /> : null
              })}
              {offlineNetwork.candidateOnly.map((id) => {
                const node = nodeById.get(id)
                const candidate = nodeById.get(result?.candidateId ?? '')
                return node && candidate ? <line key={`candidate-edge-${id}`} className="network-edge" x1={candidate.x} y1={candidate.y} x2={node.x} y2={node.y} /> : null
              })}
              {offlineNetwork.nodes.map((node) => (
                <g key={`node-${node.id}`}>
                  <circle className={`network-node network-node-${node.kind}`} cx={node.x} cy={node.y} r={node.kind === 'reference' || node.kind === 'candidate' ? 22 : 10} />
                  {(node.kind === 'reference' || node.kind === 'candidate') && <text className="network-label" x={node.x} y={node.y + 42} textAnchor="middle">{node.id}</text>}
                </g>
              ))}
            </svg>
          </div>
          <div className="network-legend" aria-label="ネットワーク凡例">
            <span><i className="legend-line legend-solid" />直接接続</span>
            <span><i className="legend-line legend-dashed" />共通接続</span>
            <span><i className="legend-dot legend-reference" />参照</span>
            <span><i className="legend-dot legend-candidate" />候補</span>
          </div>
          <p className="network-caption">表示している接続IDは入力データ由来の匿名ラベルです（最大 {offlineNetwork.common.length} 件の共通接続）。</p>
        </>
      )}
    </section>
  )
}
