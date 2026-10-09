import type { AnalysisSettings, ExportPayload, LinkScopeDataset, SimilarityResult } from './types'

export const LIMITATIONS = [
  'これは説明可能な類似性信号の要約であり、同一人物であることの断定・確率ではありません。',
  '本人または全参加者から明示的な同意を得たデータ、または合成データだけを使用してください。',
  '結果は入力データの範囲・品質・欠損に依存し、非公開情報や外部サービスを参照していません。',
]

export function buildExportPayload(
  dataset: LinkScopeDataset,
  settings: AnalysisSettings,
  results: SimilarityResult[],
  selectedCandidateId: string | null,
  exportedAt = new Date().toISOString(),
): ExportPayload {
  return {
    tool: 'LinkScope',
    version: 1,
    exportedAt,
    datasetName: dataset.datasetName,
    referenceId: dataset.referenceId,
    settings: { ...settings },
    selectedCandidateId,
    results: results.map((result) => ({
      candidateId: result.candidateId,
      score: Number(result.score.toFixed(4)),
      signals: {
        commonConnectionScore: Number(result.commonConnectionScore.toFixed(4)),
        connectionPatternScore: Number(result.connectionPatternScore.toFixed(4)),
        nameSimilarityScore: Number(result.nameSimilarityScore.toFixed(4)),
        creationProximityScore: Number(result.creationProximityScore.toFixed(4)),
      },
      contributions: {
        commonConnections: Number(result.contributions.commonConnections.toFixed(4)),
        connectionPattern: Number(result.contributions.connectionPattern.toFixed(4)),
        nameSimilarity: Number(result.contributions.nameSimilarity.toFixed(4)),
        creationProximity: Number(result.contributions.creationProximity.toFixed(4)),
      },
      commonConnections: [...result.commonConnections],
      explanation: result.explanation,
    })),
    limitations: [...LIMITATIONS],
  }
}

export function stringifyExportPayload(payload: ExportPayload): string {
  return JSON.stringify(payload, null, 2)
}

export function downloadJson(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

