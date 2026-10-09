import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { analyzeDataset } from './analysis'
import { analyzeTarget, checkHealth } from './api/backendClient'
import { AppHeader } from './components/AppHeader'
import { CloseFriendsPanel } from './components/CloseFriendsPanel'
import { ConsentPanel } from './components/ConsentPanel'
import { DatasetCard } from './components/DatasetCard'
import { HelpDialog } from './components/HelpDialog'
import { Icon } from './components/Icon'
import { InspectorPanel } from './components/InspectorPanel'
import { NetworkPreview } from './components/NetworkPreview'
import { ResultsPanel } from './components/ResultsPanel'
import { ScanProgress } from './components/ScanProgress'
import { StepRail } from './components/StepRail'
import { TargetInput } from './components/TargetInput'
import { AnalysisSettingsPanel } from './components/AnalysisSettingsPanel'
import { parseDatasetFile, validateDataset } from './parsers'
import { SYNTHETIC_DATASET } from './sampleData'
import { linkScopeReducer, INITIAL_STATE } from './state/linkScopeState'
import { buildExportPayload, downloadJson, stringifyExportPayload } from './export'
import './App.css'

function App() {
  const [state, dispatch] = useReducer(linkScopeReducer, INITIAL_STATE)
  const [menuOpen, setMenuOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [isReading, setIsReading] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [backendAvailable, setBackendAvailable] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // バックエンドのヘルスチェック
  useEffect(() => {
    let mounted = true
    const check = async () => {
      const ok = await checkHealth()
      if (mounted) setBackendAvailable(ok)
    }
    check()
    const interval = setInterval(check, 5000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const selectedResult = useMemo(
    () => state.results.find((result) => result.candidateId === state.selectedCandidateId) ?? null,
    [state.results, state.selectedCandidateId],
  )

  const selectedOnlineCandidate = useMemo(
    () => state.onlineCandidates.find((c) => c.userId === state.selectedOnlineCandidateId) ?? null,
    [state.onlineCandidates, state.selectedOnlineCandidateId],
  )

  const announce = (message: string) => {
    setAnnouncement('')
    window.setTimeout(() => setAnnouncement(message), 0)
  }

  // オンライン: 分析開始
  const handleStartOnlineScan = async (screenName: string) => {
    dispatch({ type: 'scanStarted', targetScreenName: screenName })
    announce(`@${screenName} の分析を開始しました。親密ユーザーと共通FFの鍵垢を探索中...`)

    abortControllerRef.current = new AbortController()
    try {
      const result = await analyzeTarget(
        screenName,
        (event) => {
          dispatch({ type: 'scanProgressUpdated', event })
        },
        abortControllerRef.current.signal
      )
      dispatch({ type: 'onlineAnalysisCompleted', result })
      announce(`${result.candidates.length}件のサブ垢候補が見つかりました。`)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        dispatch({ type: 'scanCancelled' })
        announce('分析を中止しました。')
      } else {
        const msg = err instanceof Error ? err.message : '分析中にエラーが発生しました。'
        dispatch({ type: 'scanFailed', error: msg })
        announce(`エラー: ${msg}`)
      }
    }
  }

  const handleCancelOnlineScan = () => {
    abortControllerRef.current?.abort()
  }

  // オフラインハンドラ
  const handleFileSelected = async (file: File) => {
    setIsReading(true)
    const result = await parseDatasetFile(file)
    dispatch({ type: 'datasetLoaded', result })
    setIsReading(false)
    announce(result.valid ? `${file.name}を読み込みました。` : `${file.name}の読み込みでエラーが見つかりました。`)
  }

  const handleLoadSample = () => {
    const result = validateDataset(SYNTHETIC_DATASET)
    dispatch({ type: 'datasetLoaded', result: { ...result, fileName: 'synthetic-consented-demo.json', format: 'json' } })
    announce('合成サンプルを読み込みました。対象者全員の同意を確認してください。')
  }

  const handleOfflineAnalyze = () => {
    if (!state.dataset) return
    const results = analyzeDataset(state.dataset, state.settings)
    dispatch({ type: 'analysisCompleted', results })
    announce(`${results.length}件の候補を分析しました。類似度は同一性の確率ではありません。`)
  }

  const handleExport = () => {
    if (state.mode === 'online') {
      if (!selectedOnlineCandidate) return
      const payload = {
        tool: 'LinkScope-SubAccountFinder',
        version: 2,
        exportedAt: new Date().toISOString(),
        target: state.targetUser ?? { screenName: state.targetScreenName },
        closeFriendsCount: state.closeFriends.length,
        selectedCandidate: selectedOnlineCandidate,
        allCandidates: state.onlineCandidates,
      }
      downloadJson(`subaccount-analysis-${state.targetScreenName}.json`, JSON.stringify(payload, null, 2))
      announce('サブ垢分析結果をJSONファイルとして保存しました。')
    } else {
      if (!state.dataset || !selectedResult) return
      const payload = buildExportPayload(state.dataset, state.settings, state.results, state.selectedCandidateId)
      downloadJson('linkscope-results.json', stringifyExportPayload(payload))
      announce('結果をJSONファイルとして保存しました。')
    }
  }

  const handleReset = () => {
    dispatch({ type: 'reset' })
    setMenuOpen(false)
    announce('リセットしました。')
  }

  // オンラインステップ判定
  const onlineStep: 1 | 2 | 3 | 4 | 5 = state.hasOnlineResults
    ? 5
    : state.isScanning && state.scanProgress?.stage === 'scoring'
    ? 4
    : state.isScanning && state.scanProgress?.stage === 'scanning'
    ? 3
    : state.closeFriends.length > 0
    ? 2
    : 1

  // オフラインステップ判定
  const offlineStep: 1 | 2 | 3 | 4 = state.hasAnalyzed
    ? 4
    : state.consentGiven
    ? 3
    : state.dataset
    ? 2
    : 1

  return (
    <div className="app-frame">
      <AppHeader
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen((open) => !open)}
        onHelp={() => {
          setHelpOpen(true)
          setMenuOpen(false)
        }}
        onReset={handleReset}
      />
      <div className={`app-body ${state.hasOnlineResults || state.hasAnalyzed ? 'has-analysis' : ''}`}>
        <aside className="workflow-column">
          <StepRail
            mode={state.mode}
            currentStep={state.mode === 'online' ? onlineStep : offlineStep}
            hasTarget={Boolean(state.targetScreenName)}
            hasCloseFriends={state.closeFriends.length > 0}
            hasScanComplete={state.hasOnlineResults}
            hasResults={state.mode === 'online' ? state.hasOnlineResults : state.hasAnalyzed}
            hasDataset={Boolean(state.dataset)}
            hasConsent={state.consentGiven}
          />
          <div className="workflow-meta-card">
            <div className="workflow-meta-title">
              <Icon name="database" size={20} />
              <strong>動作モード</strong>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                className={`button ${state.mode === 'online' ? 'button-primary' : 'button-ghost'}`}
                style={{ flex: 1, padding: '6px 8px', fontSize: '13px' }}
                onClick={() => dispatch({ type: 'modeChanged', mode: 'online' })}
              >
                X サブ垢探索
              </button>
              <button
                type="button"
                className={`button ${state.mode === 'offline' ? 'button-primary' : 'button-ghost'}`}
                style={{ flex: 1, padding: '6px 8px', fontSize: '13px' }}
                onClick={() => dispatch({ type: 'modeChanged', mode: 'offline' })}
              >
                オフライン
              </button>
            </div>
            {state.mode === 'online' ? (
              <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <p>親密ユーザーの共通FFに存在する鍵垢からサブ垢を推定・特定します。</p>
                <span className={`status-pill ${backendAvailable ? 'status-safe' : 'status-error'}`} style={{ marginTop: '6px' }}>
                  <Icon name={backendAvailable ? 'check' : 'warning'} size={14} />
                  {backendAvailable ? 'APIサーバー接続中' : 'APIサーバー未起動'}
                </span>
              </div>
            ) : (
              state.dataset && state.stats ? (
                <>
                  <strong className="workflow-dataset-name" style={{ marginTop: '8px', display: 'block' }}>{state.dataset.datasetName}</strong>
                  <dl>
                    <div><dt>参加者</dt><dd>{state.stats.participantCount.toLocaleString('ja-JP')}</dd></div>
                    <div><dt>接続ノード</dt><dd>{state.stats.connectionCount.toLocaleString('ja-JP')}</dd></div>
                    <div><dt>エッジ</dt><dd>{state.stats.edgeCount.toLocaleString('ja-JP')}</dd></div>
                  </dl>
                  <span className="workflow-meta-note">ブラウザメモリ内のみ</span>
                </>
              ) : <p style={{ marginTop: '8px', fontSize: '12px' }}>合成サンプルまたは同意済みファイルを読み込んでください。</p>
            )}
          </div>
        </aside>

        <main className="workspace" id="main-content">
          <div className="workspace-heading">
            <div>
              <h1>{state.mode === 'online' ? 'X サブ垢特定・共通FF鍵垢アナライザー' : '同意済みデータの類似性分析'}</h1>
            </div>
            <button type="button" className="button button-ghost workspace-reset" onClick={handleReset}>
              <Icon name="reset" size={17} /> 最初から
            </button>
          </div>

          <div className="live-region" aria-live="polite" aria-atomic="true">{announcement}</div>

          {state.mode === 'online' ? (
            <>
              <TargetInput
                onSubmit={handleStartOnlineScan}
                isScanning={state.isScanning}
                backendAvailable={backendAvailable}
                onSwitchToOffline={() => dispatch({ type: 'modeChanged', mode: 'offline' })}
              />

              <ScanProgress
                progress={state.scanProgress}
                isScanning={state.isScanning}
                onCancel={handleCancelOnlineScan}
              />

              <CloseFriendsPanel
                closeFriends={state.closeFriends}
                targetScreenName={state.targetScreenName}
              />

              <ResultsPanel
                mode="online"
                results={state.results}
                query={state.query}
                sortKey={state.sortKey}
                sortDirection={state.sortDirection}
                selectedCandidateId={state.selectedCandidateId}
                hasAnalyzed={state.hasAnalyzed}
                onQueryChange={(value) => dispatch({ type: 'queryChanged', value })}
                onSort={(key) => dispatch({ type: 'sortChanged', key })}
                onSelect={(id) => dispatch({ type: 'selectionChanged', id })}
                onlineCandidates={state.onlineCandidates}
                selectedOnlineCandidateId={state.selectedOnlineCandidateId}
                hasOnlineResults={state.hasOnlineResults}
                onSelectOnline={(id) => dispatch({ type: 'onlineCandidateSelected', id })}
              />
            </>
          ) : (
            <>
              <DatasetCard
                dataset={state.dataset}
                sourceName={state.sourceName}
                stats={state.stats}
                errors={state.loadErrors}
                warnings={state.loadWarnings}
                onFileSelected={handleFileSelected}
                onLoadSample={handleLoadSample}
                onClear={() => dispatch({ type: 'datasetCleared' })}
              />
              <ConsentPanel
                checked={state.consentGiven}
                disabled={!state.dataset || state.loadErrors.length > 0}
                onChange={(value) => dispatch({ type: 'consentChanged', value })}
              />
              <AnalysisSettingsPanel
                settings={state.settings}
                canAnalyze={Boolean(state.dataset && state.loadErrors.length === 0 && state.consentGiven && !isReading)}
                disabledReason={
                  !state.dataset
                    ? 'データセットを読み込んでください。'
                    : state.loadErrors.length > 0
                    ? 'データのエラーを修正してください。'
                    : !state.consentGiven
                    ? '対象者全員の明示的な同意を確認してください。'
                    : isReading ? 'データを読み込んでいます。' : ''
                }
                onChange={(patch) => dispatch({ type: 'settingsChanged', patch })}
                onAnalyze={handleOfflineAnalyze}
              />
              <ResultsPanel
                mode="offline"
                results={state.results}
                query={state.query}
                sortKey={state.sortKey}
                sortDirection={state.sortDirection}
                selectedCandidateId={state.selectedCandidateId}
                hasAnalyzed={state.hasAnalyzed}
                onQueryChange={(value) => dispatch({ type: 'queryChanged', value })}
                onSort={(key) => dispatch({ type: 'sortChanged', key })}
                onSelect={(id) => dispatch({ type: 'selectionChanged', id })}
              />
            </>
          )}
        </main>

        <NetworkPreview
          mode={state.mode}
          dataset={state.dataset}
          result={selectedResult}
          targetScreenName={state.targetScreenName}
          closeFriends={state.closeFriends}
          onlineCandidate={selectedOnlineCandidate}
        />

        <InspectorPanel
          mode={state.mode}
          result={selectedResult}
          onlineCandidate={selectedOnlineCandidate}
          closeFriendsCount={state.closeFriends.length}
          onExport={handleExport}
        />
      </div>

      <footer className="app-footer">
        <Icon name="shield" size={18} />
        <span>
          {state.mode === 'online'
            ? '親密ユーザーの公開FFリストから共通する鍵垢を検出・スコアリングするPoCツールです。'
            : '本人または全参加者の明示的な同意を得たデータ、または合成データだけを使用してください。'}
        </span>
        <button type="button" onClick={() => setHelpOpen(true)}>安全な利用について</button>
      </footer>
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}

export default App
