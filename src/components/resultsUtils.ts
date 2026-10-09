import type { ResultSortKey, SimilarityResult, SortDirection } from '../types'

export function filteredAndSortedResults(
  results: SimilarityResult[],
  query: string,
  sortKey: ResultSortKey,
  sortDirection: SortDirection,
): SimilarityResult[] {
  const normalizedQuery = query.trim().toLocaleLowerCase('ja-JP')
  const filtered = results.filter((result) => {
    if (!normalizedQuery) return true
    return result.candidateId.toLocaleLowerCase('ja-JP').includes(normalizedQuery)
      || result.candidate.displayName.toLocaleLowerCase('ja-JP').includes(normalizedQuery)
  })

  return [...filtered].sort((left, right) => {
    let difference = 0
    if (sortKey === 'score') difference = left.score - right.score
    if (sortKey === 'commonConnections') difference = left.commonConnections.length - right.commonConnections.length
    if (sortKey === 'nameSimilarity') difference = left.nameSimilarityScore - right.nameSimilarityScore
    if (sortKey === 'createdAt') difference = (left.candidate.createdAt ?? '').localeCompare(right.candidate.createdAt ?? '')
    if (difference === 0) return left.candidateId.localeCompare(right.candidateId)
    return sortDirection === 'descending' ? -difference : difference
  })
}
