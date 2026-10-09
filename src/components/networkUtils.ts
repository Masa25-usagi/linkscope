import type { LinkScopeDataset, SimilarityResult } from '../types'
import { buildAdjacency } from '../analysis'

export interface NetworkNode {
  id: string
  x: number
  y: number
  kind: 'reference' | 'candidate' | 'common' | 'other'
}

export function makeNetwork(dataset: LinkScopeDataset, result: SimilarityResult): {
  nodes: NetworkNode[]
  common: string[]
  referenceOnly: string[]
  candidateOnly: string[]
} {
  const adjacency = buildAdjacency(dataset.edges)
  const referenceNeighbors = [...(adjacency.get(dataset.referenceId) ?? [])].sort()
  const candidateNeighbors = [...(adjacency.get(result.candidateId) ?? [])].sort()
  const common = referenceNeighbors.filter((id) => candidateNeighbors.includes(id)).slice(0, 8)
  const commonSet = new Set(common)
  const referenceOnly = referenceNeighbors.filter((id) => !commonSet.has(id)).slice(0, 4)
  const candidateOnly = candidateNeighbors.filter((id) => !commonSet.has(id)).slice(0, 4)
  const nodes: NetworkNode[] = [
    { id: dataset.referenceId, x: 110, y: 130, kind: 'reference' },
    { id: result.candidateId, x: 690, y: 130, kind: 'candidate' },
  ]

  common.forEach((id, index) => {
    const column = index % 4
    const row = Math.floor(index / 4)
    nodes.push({ id, x: 270 + column * 105, y: 78 + row * 104, kind: 'common' })
  })
  referenceOnly.forEach((id, index) => nodes.push({ id, x: 190, y: 42 + index * 58, kind: 'other' }))
  candidateOnly.forEach((id, index) => nodes.push({ id, x: 610, y: 42 + index * 58, kind: 'other' }))

  return { nodes, common, referenceOnly, candidateOnly }
}
