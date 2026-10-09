import { describe, expect, it } from 'vitest'
import { analyzeDataset } from '../analysis'
import { SYNTHETIC_DATASET } from '../sampleData'
import type { ResultSortKey, SortDirection } from '../types'
import { filteredAndSortedResults } from './resultsUtils'

describe('result filtering and sorting', () => {
  const results = analyzeDataset(SYNTHETIC_DATASET, {
    minimumCommonConnections: 2,
    similarityThreshold: 0.25,
    resultLimit: 10,
  })

  it('searches candidate IDs and display names case-insensitively', () => {
    expect(filteredAndSortedResults(results, 'PARTICIPANT_21', 'score', 'descending').map((result) => result.candidateId)).toEqual(['participant_21'])
    expect(filteredAndSortedResults(results, 'reference studies', 'score', 'descending').map((result) => result.candidateId)).toEqual(['participant_12'])
    expect(filteredAndSortedResults(results, 'missing', 'score', 'descending')).toHaveLength(0)
  })

  it.each<[ResultSortKey, SortDirection, string[]]>([
    ['score', 'descending', ['participant_07', 'participant_12', 'participant_21']],
    ['commonConnections', 'ascending', ['participant_21', 'participant_12', 'participant_07']],
    ['nameSimilarity', 'descending', ['participant_12', 'participant_07', 'participant_21']],
    ['createdAt', 'ascending', ['participant_21', 'participant_07', 'participant_12']],
  ])('sorts by %s (%s)', (key, direction, expected) => {
    expect(filteredAndSortedResults(results, '', key, direction).map((result) => result.candidateId)).toEqual(expected)
  })
})
