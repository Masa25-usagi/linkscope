import { describe, expect, it } from 'vitest'
import { MAX_FILE_BYTES } from './types'
import { parseCsvRows, parseCsvText, parseDatasetFile, parseJsonText, validateDataset } from './parsers'

const validJson = JSON.stringify({
  datasetName: 'test-dataset',
  consent: { confirmed: true, scope: 'all-participants' },
  referenceId: 'ref',
  participants: [
    { id: 'ref', displayName: 'Reference', createdAt: '2024-01-01' },
    { id: 'p2', displayName: 'Candidate', createdAt: null },
  ],
  edges: [
    { source: 'ref', target: 'connection_1' },
    { source: 'p2', target: 'connection_1' },
  ],
})

describe('dataset parsers and validation', () => {
  it('parses a valid JSON graph including anonymous edge-only connection nodes', () => {
    const result = parseJsonText(validJson)
    expect(result.valid).toBe(true)
    expect(result.dataset?.referenceId).toBe('ref')
    expect(result.stats?.connectionCount).toBe(1)
    expect(result.stats?.edgeCount).toBe(2)
  })

  it('rejects malformed JSON and an empty file', () => {
    expect(parseJsonText('{oops').errors[0]).toContain('JSONの形式')
    expect(parseJsonText('   ').errors[0]).toContain('空')
  })

  it('rejects duplicate IDs, unknown edge sources, invalid dates, and missing consent', () => {
    const value = JSON.parse(validJson) as Record<string, unknown>
    value.consent = { confirmed: true }
    value.participants = [
      { id: 'ref', displayName: 'Reference', createdAt: '2024-02-31' },
      { id: 'ref', displayName: 'Duplicate', createdAt: '2024-01-01' },
    ]
    value.referenceId = 'ref'
    value.edges = [{ source: 'ghost', target: 'connection_1' }]
    const result = validateDataset(value)
    expect(result.valid).toBe(false)
    expect(result.errors.join('\n')).toContain('重複')
    expect(result.errors.join('\n')).toContain('未知の参加者ID')
    expect(result.errors.join('\n')).toContain('有効なYYYY-MM-DD')
    expect(result.errors.join('\n')).toContain('consent')
  })

  it('parses quoted CSV fields and builds connections from pipe-delimited values', () => {
    const csv = 'id,displayName,createdAt,connections\nref,"Reference, one",2024-01-01,"c1|c2"\np2,Candidate,,c2|c3\n'
    const result = parseCsvText(csv, 'participants.csv')
    expect(result.valid).toBe(true)
    expect(result.dataset?.participants[0].displayName).toBe('Reference, one')
    expect(result.dataset?.edges).toHaveLength(4)
    expect(result.dataset?.referenceId).toBe('ref')
    expect(result.warnings[0]).toContain('先頭行')
  })

  it('rejects malformed CSV, missing columns, and empty rows', () => {
    expect(() => parseCsvRows('id,displayName,createdAt,connections\n"ref,Name,2024-01-01,c1')).toThrow('引用符')
    expect(parseCsvText('id,displayName\nref,Name').errors[0]).toContain('必須列')
    expect(parseCsvText('  \n').errors[0]).toContain('空')
  })

  it('returns concrete validation errors for empty arrays and unknown references', () => {
    const result = validateDataset({
      datasetName: 'empty',
      consent: { confirmed: false, scope: 'all-participants' },
      referenceId: 'missing',
      participants: [],
      edges: [],
    })
    expect(result.valid).toBe(false)
    expect(result.errors.join('\n')).toContain('少なくとも1件')
    expect(result.errors.join('\n')).toContain('未知の参加者ID')
  })

  it('rejects unsupported and oversized files before reading their contents', async () => {
    const oversized = new File(['ignored'], 'huge.json')
    Object.defineProperty(oversized, 'size', { configurable: true, value: MAX_FILE_BYTES + 1 })
    const oversizedResult = await parseDatasetFile(oversized)
    expect(oversizedResult.valid).toBe(false)
    expect(oversizedResult.errors[0]).toContain('ファイルサイズが上限')

    const unsupported = new File(['ignored'], 'notes.txt')
    const unsupportedResult = await parseDatasetFile(unsupported)
    expect(unsupportedResult.valid).toBe(false)
    expect(unsupportedResult.errors[0]).toContain('JSONまたはCSV')
  })

  it('parses a file input through its extension and preserves metadata', async () => {
    const file = new File([validJson], 'consented.json', { type: 'application/json' })
    Object.defineProperty(file, 'text', { configurable: true, value: async () => validJson })
    const result = await parseDatasetFile(file)
    expect(result.valid).toBe(true)
    expect(result.fileName).toBe('consented.json')
    expect(result.format).toBe('json')
  })
})
