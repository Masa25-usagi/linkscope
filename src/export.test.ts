import { describe, expect, it, vi } from 'vitest'
import { analyzeDataset } from './analysis'
import { buildExportPayload, downloadJson, stringifyExportPayload } from './export'
import { SYNTHETIC_DATASET } from './sampleData'
import { DEFAULT_ANALYSIS_SETTINGS } from './types'

describe('result export', () => {
  it('creates a portable payload with signals, explanations, settings, and limitations', () => {
    const results = analyzeDataset(SYNTHETIC_DATASET, DEFAULT_ANALYSIS_SETTINGS)
    const payload = buildExportPayload(SYNTHETIC_DATASET, DEFAULT_ANALYSIS_SETTINGS, results, results[0]?.candidateId ?? null, '2025-01-01T00:00:00.000Z')
    expect(payload.tool).toBe('LinkScope')
    expect(payload.referenceId).toBe('participant_ref')
    expect(payload.results[0].signals.commonConnectionScore).toBeGreaterThan(0)
    expect(payload.results[0].explanation).toContain('同一人物')
    expect(payload.limitations.join(' ')).toContain('確率')
    expect(stringifyExportPayload(payload)).toContain('"selectedCandidateId"')
  })

  it('downloads JSON through a browser object URL and revokes it', async () => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn() })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:export')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    downloadJson('results.json', '{"ok":true}')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(anchorClick).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:export')
  })
})
