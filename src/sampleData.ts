import type { DatasetStats, LinkScopeDataset } from './types'

/** Synthetic records only. These identifiers do not represent real people or services. */
export const SYNTHETIC_DATASET: LinkScopeDataset = {
  datasetName: 'synthetic-consented-demo',
  consent: { confirmed: false, scope: 'all-participants' },
  referenceId: 'participant_ref',
  participants: [
    { id: 'participant_ref', displayName: 'Reference participant', createdAt: '2024-01-15' },
    { id: 'participant_07', displayName: 'Ref study', createdAt: '2024-02-01' },
    { id: 'participant_12', displayName: 'Reference studies', createdAt: '2024-04-18' },
    { id: 'participant_21', displayName: 'Ref notes', createdAt: '2023-11-22' },
    { id: 'participant_03', displayName: 'Creative lab', createdAt: '2022-07-09' },
    { id: 'participant_33', displayName: 'Archive group', createdAt: null },
    { id: 'participant_44', displayName: 'Signal garden', createdAt: '2020-02-20' },
  ],
  edges: [
    { source: 'participant_ref', target: 'connection_01' },
    { source: 'participant_ref', target: 'connection_02' },
    { source: 'participant_ref', target: 'connection_03' },
    { source: 'participant_ref', target: 'connection_04' },
    { source: 'participant_ref', target: 'connection_05' },
    { source: 'participant_ref', target: 'connection_06' },
    { source: 'participant_ref', target: 'connection_07' },
    { source: 'participant_ref', target: 'connection_08' },
    { source: 'participant_07', target: 'connection_01' },
    { source: 'participant_07', target: 'connection_02' },
    { source: 'participant_07', target: 'connection_03' },
    { source: 'participant_07', target: 'connection_04' },
    { source: 'participant_07', target: 'connection_05' },
    { source: 'participant_07', target: 'connection_06' },
    { source: 'participant_07', target: 'connection_09' },
    { source: 'participant_12', target: 'connection_01' },
    { source: 'participant_12', target: 'connection_02' },
    { source: 'participant_12', target: 'connection_03' },
    { source: 'participant_12', target: 'connection_04' },
    { source: 'participant_12', target: 'connection_10' },
    { source: 'participant_12', target: 'connection_11' },
    { source: 'participant_21', target: 'connection_01' },
    { source: 'participant_21', target: 'connection_02' },
    { source: 'participant_21', target: 'connection_13' },
    { source: 'participant_21', target: 'connection_14' },
    { source: 'participant_21', target: 'connection_15' },
    { source: 'participant_03', target: 'connection_03' },
    { source: 'participant_03', target: 'connection_20' },
    { source: 'participant_03', target: 'connection_21' },
    { source: 'participant_33', target: 'connection_20' },
    { source: 'participant_33', target: 'connection_22' },
    { source: 'participant_44', target: 'connection_30' },
    { source: 'participant_44', target: 'connection_31' },
  ],
}

export function getDatasetStats(dataset: LinkScopeDataset): DatasetStats {
  const connectionIds = new Set<string>()
  const referenceDegree = dataset.edges.filter(
    (edge) => edge.source === dataset.referenceId || edge.target === dataset.referenceId,
  ).length

  for (const edge of dataset.edges) {
    if (!dataset.participants.some((participant) => participant.id === edge.source)) {
      connectionIds.add(edge.source)
    }
    if (!dataset.participants.some((participant) => participant.id === edge.target)) {
      connectionIds.add(edge.target)
    }
  }

  return {
    participantCount: dataset.participants.length,
    connectionCount: connectionIds.size,
    edgeCount: dataset.edges.length,
    referenceDegree,
    missingCreatedAtCount: dataset.participants.filter((participant) => !participant.createdAt).length,
  }
}

