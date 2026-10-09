import { describe, expect, it } from 'vitest'
import { scoreCandidate } from '../analysis'
import { SYNTHETIC_DATASET } from '../sampleData'
import { makeNetwork } from './networkUtils'

describe('anonymous network layout', () => {
  it('limits displayed neighbors and separates common and unique connections', () => {
    const result = scoreCandidate(SYNTHETIC_DATASET, 'participant_07')
    const network = makeNetwork(SYNTHETIC_DATASET, result)

    expect(network.common).toEqual(['connection_01', 'connection_02', 'connection_03', 'connection_04', 'connection_05', 'connection_06'])
    expect(network.referenceOnly).toEqual(['connection_07', 'connection_08'])
    expect(network.candidateOnly).toEqual(['connection_09'])
    expect(network.nodes.find((node) => node.kind === 'reference')).toMatchObject({ id: 'participant_ref', x: 110, y: 130 })
    expect(network.nodes.filter((node) => node.kind === 'common')).toHaveLength(6)
  })
})
