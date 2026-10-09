import { describe, expect, it } from 'vitest'
import {
  bigramDice,
  buildAdjacency,
  connectionPatternScore,
  creationProximityScore,
  jaccardScore,
  normalizeDisplayName,
  analyzeDataset,
  scoreCandidate,
} from './analysis'
import { SYNTHETIC_DATASET } from './sampleData'
import { DEFAULT_ANALYSIS_SETTINGS, type LinkScopeDataset } from './types'

describe('similarity signals', () => {
  it('normalizes case, width, punctuation, and whitespace for names', () => {
    expect(normalizeDisplayName(' ＡｂＣ・ Study　Lab ')).toBe('abcstudylab')
    expect(normalizeDisplayName('研究_ノート')).toBe('研究ノート')
  })

  it('calculates multiset bigram Dice similarity', () => {
    expect(bigramDice('Reference', 'Reference')).toBe(1)
    expect(bigramDice('aba', 'abb')).toBe(0.5)
    expect(bigramDice('', '')).toBe(0)
    expect(bigramDice('A', 'a')).toBe(1)
  })

  it('handles Jaccard zero division and intersection', () => {
    expect(jaccardScore(new Set(), new Set())).toBe(0)
    expect(jaccardScore(new Set(['a', 'b']), new Set(['b', 'c']))).toBeCloseTo(1 / 3)
  })

  it('calculates degree-pattern proximity with zero-degree safety', () => {
    expect(connectionPatternScore(0, 0)).toBe(1)
    expect(connectionPatternScore(2, 4)).toBe(0.5)
    expect(connectionPatternScore(10, 0)).toBe(0)
  })

  it('calculates creation proximity and treats missing dates as unknown', () => {
    expect(creationProximityScore('2024-01-01', '2024-01-01')).toBe(1)
    expect(creationProximityScore('2024-01-01', '2025-01-01')).toBeCloseTo(0, 2)
    expect(creationProximityScore(null, '2024-01-01')).toBe(0)
  })

  it('builds a deterministic undirected adjacency map', () => {
    const adjacency = buildAdjacency([{ source: 'p1', target: 'c1' }, { source: 'p2', target: 'c1' }])
    expect([...adjacency.get('p1') ?? []]).toEqual(['c1'])
    expect([...adjacency.get('c1') ?? []]).toEqual(['p1', 'p2'])
  })

  it('returns weighted component contributions and an explanation', () => {
    const result = scoreCandidate(SYNTHETIC_DATASET, 'participant_07')
    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThanOrEqual(1)
    expect(result.commonConnections).toHaveLength(6)
    expect(result.contributions.commonConnections + result.contributions.connectionPattern + result.contributions.nameSimilarity + result.contributions.creationProximity).toBeCloseTo(result.score)
    expect(result.explanation).toContain('同一人物であることを示すものではありません')
  })

  it('filters, ranks, excludes the reference, and limits candidates', () => {
    const results = analyzeDataset(SYNTHETIC_DATASET, DEFAULT_ANALYSIS_SETTINGS)
    expect(results.length).toBeGreaterThanOrEqual(3)
    expect(results[0].candidateId).toBe('participant_07')
    expect(results.some((result) => result.candidateId === SYNTHETIC_DATASET.referenceId)).toBe(false)
    expect(results.every((result) => result.commonConnections.length >= DEFAULT_ANALYSIS_SETTINGS.minimumCommonConnections)).toBe(true)
    expect(analyzeDataset(SYNTHETIC_DATASET, { ...DEFAULT_ANALYSIS_SETTINGS, similarityThreshold: 0.99 })).toHaveLength(0)
    expect(analyzeDataset(SYNTHETIC_DATASET, { ...DEFAULT_ANALYSIS_SETTINGS, resultLimit: 1 })).toHaveLength(1)
  })

  it('keeps score behavior deterministic for zero-connection participants', () => {
    const dataset: LinkScopeDataset = {
      datasetName: 'empty-edges',
      consent: { confirmed: false, scope: 'all-participants' },
      referenceId: 'ref',
      participants: [
        { id: 'ref', displayName: 'Ref', createdAt: null },
        { id: 'candidate', displayName: 'Other', createdAt: null },
      ],
      edges: [],
    }
    const result = scoreCandidate(dataset, 'candidate')
    expect(result.commonConnectionScore).toBe(0)
    expect(result.connectionPatternScore).toBe(1)
    expect(result.creationProximityScore).toBe(0)
    expect(analyzeDataset(dataset, { ...DEFAULT_ANALYSIS_SETTINGS, minimumCommonConnections: 0, similarityThreshold: 0 })).toHaveLength(1)
  })
})
