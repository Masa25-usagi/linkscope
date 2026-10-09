// ── Offline mode types (既存) ──

export type ConsentScope = 'all-participants' | 'self-only' | string

export interface ConsentInfo {
  confirmed: boolean
  scope: ConsentScope
}

export interface Participant {
  id: string
  displayName: string
  createdAt?: string | null
}

export interface Edge {
  source: string
  target: string
}

export interface LinkScopeDataset {
  datasetName: string
  consent: ConsentInfo
  referenceId: string
  participants: Participant[]
  edges: Edge[]
}

export interface DatasetStats {
  participantCount: number
  connectionCount: number
  edgeCount: number
  referenceDegree: number
  missingCreatedAtCount: number
}

export interface ValidationResult {
  valid: boolean
  dataset?: LinkScopeDataset
  errors: string[]
  warnings: string[]
  stats?: DatasetStats
}

export interface ParsedFileResult extends ValidationResult {
  fileName?: string
  format?: 'json' | 'csv'
}

export interface AnalysisSettings {
  minimumCommonConnections: number
  similarityThreshold: number
  resultLimit: number
}

export interface ScoreSignals {
  commonConnectionScore: number
  connectionPatternScore: number
  nameSimilarityScore: number
  creationProximityScore: number
}

export interface ScoreContributions {
  commonConnections: number
  connectionPattern: number
  nameSimilarity: number
  creationProximity: number
}

export interface SimilarityResult extends ScoreSignals {
  candidateId: string
  candidate: Participant
  score: number
  contributions: ScoreContributions
  commonConnections: string[]
  explanation: string
}

export type ResultSortKey =
  | 'score'
  | 'commonConnections'
  | 'nameSimilarity'
  | 'createdAt'
  | 'followersCount'

export type SortDirection = 'ascending' | 'descending'

export interface ExportPayload {
  tool: 'LinkScope'
  version: 1
  exportedAt: string
  datasetName: string
  referenceId: string
  settings: AnalysisSettings
  selectedCandidateId: string | null
  results: Array<{
    candidateId: string
    score: number
    signals: ScoreSignals
    contributions: ScoreContributions
    commonConnections: string[]
    explanation: string
  }>
  limitations: string[]
}

export const DEFAULT_ANALYSIS_SETTINGS: AnalysisSettings = {
  minimumCommonConnections: 2,
  similarityThreshold: 0.25,
  resultLimit: 10,
}

export const MAX_FILE_BYTES = 5 * 1024 * 1024
export const MAX_PARTICIPANTS = 10_000
export const MAX_EDGES = 100_000

// ── Online mode types (新規: X サブ垢特定) ──

export type AppMode = 'online' | 'offline'

/** X ユーザー基本情報 */
export interface XUser {
  userId: string
  screenName: string
  displayName: string
  protected: boolean
  followersCount: number
  friendsCount: number
  createdAt: string
  profileImageUrl?: string
}

/** 親密ユーザー（よく絡む人） */
export interface CloseFriend {
  userId: string
  screenName: string
  displayName: string
  interactionScore: number
  replyCount: number
  mentionCount: number
  profileImageUrl?: string
}

/** サブ垢候補（鍵垢 + スコアリング済み） */
export interface SubAccountCandidate {
  userId: string
  screenName: string
  displayName: string
  protected: boolean
  followersCount: number
  friendsCount: number
  createdAt: string
  /** 親密ユーザーのうちこの垢をフォローしている人数 */
  cIn: number
  /** 親密ユーザーのうちこの垢にフォローされている人数 */
  cOut: number
  /** 相互フォロー数 */
  cMut: number
  /** 繋がっている親密ユーザーのscreen_name一覧 */
  connectedFriends: string[]
  /** 総合スコア */
  score: number
  /** 相互フォロー率寄与 */
  mutualScore: number
  /** 被フォロー率寄与 */
  inboundScore: number
  /** フォロー率寄与 */
  outboundScore: number
  /** フォロワー数ペナルティ */
  followerPenalty: number
  /** 名前/ID類似度ボーナス */
  similarityBonus: number
  /** 説明テキスト */
  explanation: string
}

/** 分析の進捗ステージ */
export type AnalysisStage =
  | 'user_lookup'
  | 'close_friends'
  | 'scanning'
  | 'scoring'
  | 'complete'
  | 'error'

/** SSE で配信される分析進捗イベント */
export interface AnalysisProgressEvent {
  stage: AnalysisStage
  message: string
  progress?: number
  data?: {
    target?: XUser
    close_friends?: CloseFriend[]
    candidates?: SubAccountCandidate[]
  }
}

/** オンライン分析の完了結果 */
export interface OnlineAnalysisResult {
  target: XUser
  closeFriends: CloseFriend[]
  candidates: SubAccountCandidate[]
}
