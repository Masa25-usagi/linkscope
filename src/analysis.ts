import type {
  AnalysisSettings,
  Edge,
  LinkScopeDataset,
  Participant,
  ScoreContributions,
  SimilarityResult,
  ScoreSignals,
} from './types'

export const SCORE_WEIGHTS = {
  commonConnections: 0.5,
  connectionPattern: 0.2,
  nameSimilarity: 0.2,
  creationProximity: 0.1,
} as const

export function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum))
}

export function normalizeDisplayName(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('ja-JP')
    .replace(/[\p{P}\p{S}\p{Z}\s]+/gu, '')
}

export function makeBigrams(value: string): string[] {
  const normalized = normalizeDisplayName(value)
  const characters = Array.from(normalized)

  if (characters.length === 1) {
    return characters
  }

  return characters.slice(0, -1).map((character, index) => `${character}${characters[index + 1]}`)
}

export function bigramDice(left: string, right: string): number {
  const leftBigrams = makeBigrams(left)
  const rightBigrams = makeBigrams(right)
  const denominator = leftBigrams.length + rightBigrams.length

  if (denominator === 0) {
    return 0
  }

  const rightCounts = new Map<string, number>()
  for (const bigram of rightBigrams) {
    rightCounts.set(bigram, (rightCounts.get(bigram) ?? 0) + 1)
  }

  let intersection = 0
  for (const bigram of leftBigrams) {
    const count = rightCounts.get(bigram) ?? 0
    if (count > 0) {
      intersection += 1
      rightCounts.set(bigram, count - 1)
    }
  }

  return clamp((2 * intersection) / denominator)
}

export function buildAdjacency(edges: Edge[]): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>()

  for (const edge of edges) {
    const sourceNeighbors = adjacency.get(edge.source) ?? new Set<string>()
    sourceNeighbors.add(edge.target)
    adjacency.set(edge.source, sourceNeighbors)

    const targetNeighbors = adjacency.get(edge.target) ?? new Set<string>()
    targetNeighbors.add(edge.source)
    adjacency.set(edge.target, targetNeighbors)
  }

  return adjacency
}

export function neighborsFor(adjacency: Map<string, Set<string>>, id: string): Set<string> {
  return new Set(adjacency.get(id) ?? [])
}

export function jaccardScore(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 && right.size === 0) {
    return 0
  }

  let intersection = 0
  for (const value of left) {
    if (right.has(value)) {
      intersection += 1
    }
  }

  const union = new Set([...left, ...right]).size
  return union === 0 ? 0 : clamp(intersection / union)
}

export function connectionPatternScore(leftDegree: number, rightDegree: number): number {
  const denominator = Math.max(leftDegree, rightDegree, 1)
  return clamp(1 - Math.abs(leftDegree - rightDegree) / denominator)
}

function parseUtcDate(value: string | null | undefined): number | null {
  if (!value) {
    return null
  }

  const timestamp = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(timestamp) ? timestamp : null
}

export function creationProximityScore(left: string | null | undefined, right: string | null | undefined): number {
  const leftTimestamp = parseUtcDate(left)
  const rightTimestamp = parseUtcDate(right)

  if (leftTimestamp === null || rightTimestamp === null) {
    return 0
  }

  const daysApart = Math.abs(leftTimestamp - rightTimestamp) / 86_400_000
  return clamp(1 - daysApart / 365)
}

export function weightedScore(signals: ScoreSignals): number {
  return clamp(
    signals.commonConnectionScore * SCORE_WEIGHTS.commonConnections +
      signals.connectionPatternScore * SCORE_WEIGHTS.connectionPattern +
      signals.nameSimilarityScore * SCORE_WEIGHTS.nameSimilarity +
      signals.creationProximityScore * SCORE_WEIGHTS.creationProximity,
  )
}

export function getScoreContributions(signals: ScoreSignals): ScoreContributions {
  return {
    commonConnections: clamp(signals.commonConnectionScore * SCORE_WEIGHTS.commonConnections),
    connectionPattern: clamp(signals.connectionPatternScore * SCORE_WEIGHTS.connectionPattern),
    nameSimilarity: clamp(signals.nameSimilarityScore * SCORE_WEIGHTS.nameSimilarity),
    creationProximity: clamp(signals.creationProximityScore * SCORE_WEIGHTS.creationProximity),
  }
}

function explainResult(
  commonConnections: string[],
  signals: ScoreSignals,
  reference: Participant,
  candidate: Participant,
): string {
  const commonText = commonConnections.length
    ? `${commonConnections.length}件の共通接続が確認されました`
    : '共通接続は確認されませんでした'
  const nameText = signals.nameSimilarityScore >= 0.66
    ? '表示名の類似度は高めです'
    : signals.nameSimilarityScore >= 0.33
      ? '表示名に中程度の類似信号があります'
      : '表示名の類似信号は限定的です'
  const dateText = signals.creationProximityScore > 0
    ? '作成時期の近さも反映されています'
    : '作成時期は不明または離れているため寄与していません'

  return `${commonText}。${nameText}。${dateText}。これは「${reference.id}」と「${candidate.id}」の観測可能な信号を要約した類似度であり、同一人物であることを示すものではありません。`
}

export function scoreCandidate(
  dataset: LinkScopeDataset,
  candidateId: string,
  adjacency = buildAdjacency(dataset.edges),
): SimilarityResult {
  const reference = dataset.participants.find((participant) => participant.id === dataset.referenceId)
  const candidate = dataset.participants.find((participant) => participant.id === candidateId)

  if (!reference || !candidate) {
    throw new Error('参照ノードまたは候補ノードが見つかりません。')
  }

  const referenceNeighbors = neighborsFor(adjacency, reference.id)
  const candidateNeighbors = neighborsFor(adjacency, candidate.id)
  const commonConnections = [...referenceNeighbors].filter((value) => candidateNeighbors.has(value)).sort()
  const signals: ScoreSignals = {
    commonConnectionScore: jaccardScore(referenceNeighbors, candidateNeighbors),
    connectionPatternScore: connectionPatternScore(referenceNeighbors.size, candidateNeighbors.size),
    nameSimilarityScore: bigramDice(reference.displayName, candidate.displayName),
    creationProximityScore: creationProximityScore(reference.createdAt, candidate.createdAt),
  }

  return {
    candidateId: candidate.id,
    candidate,
    score: weightedScore(signals),
    ...signals,
    contributions: getScoreContributions(signals),
    commonConnections,
    explanation: explainResult(commonConnections, signals, reference, candidate),
  }
}

export function analyzeDataset(
  dataset: LinkScopeDataset,
  settings: AnalysisSettings,
): SimilarityResult[] {
  const adjacency = buildAdjacency(dataset.edges)
  const minimumCommonConnections = Math.max(0, Math.floor(settings.minimumCommonConnections))
  const similarityThreshold = clamp(settings.similarityThreshold)
  const resultLimit = Math.max(1, Math.floor(settings.resultLimit))

  return dataset.participants
    .filter((participant) => participant.id !== dataset.referenceId)
    .map((participant) => scoreCandidate(dataset, participant.id, adjacency))
    .filter((result) => result.commonConnections.length >= minimumCommonConnections)
    .filter((result) => result.score >= similarityThreshold)
    .sort((left, right) => right.score - left.score || left.candidateId.localeCompare(right.candidateId))
    .slice(0, resultLimit)
}

