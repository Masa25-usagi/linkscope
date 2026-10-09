import { getDatasetStats } from './sampleData'
import {
  MAX_EDGES,
  MAX_FILE_BYTES,
  MAX_PARTICIPANTS,
  type ConsentInfo,
  type Edge,
  type LinkScopeDataset,
  type Participant,
  type ParsedFileResult,
  type ValidationResult,
} from './types'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function textValue(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() : null
}

function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function invalidResult(errors: string[], warnings: string[] = []): ValidationResult {
  return { valid: false, errors, warnings }
}

function validateConsent(value: unknown, errors: string[]): ConsentInfo | null {
  if (!isRecord(value)) {
    errors.push('consent: 同意情報（confirmed と scope）が必要です。')
    return null
  }

  if (typeof value.confirmed !== 'boolean') {
    errors.push('consent.confirmed: true または false を指定してください。')
  }

  const scope = textValue(value.scope)
  if (!scope) {
    errors.push('consent.scope: 同意の範囲を指定してください。')
  }

  if (typeof value.confirmed !== 'boolean' || !scope) {
    return null
  }

  return { confirmed: value.confirmed, scope }
}

function validateParticipants(value: unknown, errors: string[]): Participant[] {
  if (!Array.isArray(value)) {
    errors.push('participants: 配列が必要です。')
    return []
  }
  if (value.length === 0) {
    errors.push('participants: 少なくとも1件の参加者が必要です。')
  }
  if (value.length > MAX_PARTICIPANTS) {
    errors.push(`participants: ${MAX_PARTICIPANTS.toLocaleString()}件を超えるデータは読み込めません。`)
  }

  const seenIds = new Set<string>()
  const participants: Participant[] = []
  value.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`participants[${index}]: オブジェクトが必要です。`)
      return
    }

    const id = textValue(item.id)
    const displayName = textValue(item.displayName)
    const createdAtValue = item.createdAt
    const createdAt = createdAtValue === null || createdAtValue === undefined || createdAtValue === ''
      ? null
      : textValue(createdAtValue)

    if (!id) {
      errors.push(`participants[${index}].id: 空でない文字列が必要です。`)
    } else if (seenIds.has(id)) {
      errors.push(`participants[${index}].id: ID「${id}」が重複しています。`)
    } else {
      seenIds.add(id)
    }

    if (!displayName) {
      errors.push(`participants[${index}].displayName: 空でない表示名が必要です。`)
    }

    if (createdAtValue !== null && createdAtValue !== undefined && createdAtValue !== '' && !createdAt) {
      errors.push(`participants[${index}].createdAt: YYYY-MM-DD形式の日付が必要です。`)
    } else if (createdAt && !isValidDateString(createdAt)) {
      errors.push(`participants[${index}].createdAt:「${createdAt}」は有効なYYYY-MM-DD日付ではありません。`)
    }

    if (id && displayName && !seenIds.has(`${id}__invalid`)) {
      participants.push({ id, displayName, createdAt })
    }
  })

  // The duplicate check above should not result in duplicate records entering the graph.
  const uniqueParticipants = [...new Map(participants.map((participant) => [participant.id, participant])).values()]
  return uniqueParticipants
}

function validateEdges(value: unknown, participants: Participant[], errors: string[]): Edge[] {
  if (!Array.isArray(value)) {
    errors.push('edges: 配列が必要です。')
    return []
  }
  if (value.length > MAX_EDGES) {
    errors.push(`edges: ${MAX_EDGES.toLocaleString()}件を超えるデータは読み込めません。`)
  }

  const participantIds = new Set(participants.map((participant) => participant.id))
  const edges: Edge[] = []
  const seenEdges = new Set<string>()
  value.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`edges[${index}]: オブジェクトが必要です。`)
      return
    }
    const source = textValue(item.source)
    const target = textValue(item.target)
    if (!source || !target) {
      errors.push(`edges[${index}]: source と target の両方に空でないIDが必要です。`)
      return
    }
    if (!participantIds.has(source)) {
      errors.push(`edges[${index}].source: 未知の参加者ID「${source}」です。`)
      return
    }

    // Edge-only IDs represent anonymous connection nodes. This permits a graph to
    // describe connections without turning those connections into candidate people.
    const edgeKey = `${source}\u0000${target}`
    if (!seenEdges.has(edgeKey)) {
      seenEdges.add(edgeKey)
      edges.push({ source, target })
    }
  })
  return edges
}

export function validateDataset(value: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!isRecord(value)) {
    return invalidResult(['データ全体: JSONオブジェクトが必要です。'])
  }

  const datasetName = textValue(value.datasetName)
  if (!datasetName) {
    errors.push('datasetName: 空でない文字列が必要です。')
  }
  if (datasetName && datasetName.length > 100) {
    errors.push('datasetName: 100文字以内で指定してください。')
  }

  const consent = validateConsent(value.consent, errors)
  const participants = validateParticipants(value.participants, errors)
  const referenceId = textValue(value.referenceId)
  if (!referenceId) {
    errors.push('referenceId: 参照ノードのIDが必要です。')
  } else if (!participants.some((participant) => participant.id === referenceId)) {
    errors.push(`referenceId: 未知の参加者ID「${referenceId}」です。`)
  }

  const edges = validateEdges(value.edges, participants, errors)
  if (edges.length === 0 && participants.length > 0) {
    warnings.push('接続データがないため、共通接続を使った結果は表示されません。')
  }

  if (errors.length > 0 || !datasetName || !consent || !referenceId) {
    return invalidResult(errors, warnings)
  }

  const dataset: LinkScopeDataset = {
    datasetName,
    consent,
    referenceId,
    participants,
    edges,
  }
  return {
    valid: true,
    dataset,
    errors: [],
    warnings,
    stats: getDatasetStats(dataset),
  }
}

export function parseJsonText(text: string): ValidationResult {
  if (text.trim().length === 0) {
    return invalidResult(['JSONファイルが空です。'])
  }

  try {
    return validateDataset(JSON.parse(text) as unknown)
  } catch {
    return invalidResult(['JSONの形式が正しくありません。UTF-8のJSONオブジェクトを指定してください。'])
  }
}

export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    const nextCharacter = text[index + 1]

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        field += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (character === ',' && !inQuotes) {
      row.push(field)
      field = ''
    } else if ((character === '\n' || character === '\r') && !inQuotes) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1
      }
      row.push(field)
      if (row.some((value) => value.trim() !== '')) {
        rows.push(row)
      }
      row = []
      field = ''
    } else {
      field += character
    }
  }

  if (inQuotes) {
    throw new Error('CSVの引用符が閉じられていません。')
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    if (row.some((value) => value.trim() !== '')) {
      rows.push(row)
    }
  }

  return rows
}

export function parseCsvText(text: string, fileName = 'participants.csv'): ValidationResult {
  if (text.trim().length === 0) {
    return invalidResult(['CSVファイルが空です。'])
  }

  let rows: string[][]
  try {
    rows = parseCsvRows(text)
  } catch (error) {
    return invalidResult([error instanceof Error ? error.message : 'CSVの形式が正しくありません。'])
  }

  if (rows.length < 2) {
    return invalidResult(['CSVにはヘッダーと1件以上のデータ行が必要です。'])
  }

  const header = rows[0].map((value, index) => (index === 0 ? value.replace(/^\uFEFF/, '') : value).trim())
  const requiredColumns = ['id', 'displayName', 'createdAt', 'connections']
  const missingColumns = requiredColumns.filter((column) => !header.includes(column))
  if (missingColumns.length > 0) {
    return invalidResult([`CSVの必須列が不足しています: ${missingColumns.join(', ')}。`])
  }

  const duplicateColumns = header.filter((column, index) => column && header.indexOf(column) !== index)
  if (duplicateColumns.length > 0) {
    return invalidResult([`CSVの列名が重複しています: ${[...new Set(duplicateColumns)].join(', ')}。`])
  }

  const indices = Object.fromEntries(requiredColumns.map((column) => [column, header.indexOf(column)])) as Record<string, number>
  const rawParticipants: Participant[] = []
  const rawConnections: string[][] = []
  const errors: string[] = []
  const seenIds = new Set<string>()

  rows.slice(1).forEach((row, rowIndex) => {
    const line = rowIndex + 2
    const id = textValue(row[indices.id])
    const displayName = textValue(row[indices.displayName])
    const createdAt = textValue(row[indices.createdAt])
    const connectionText = row[indices.connections]?.trim() ?? ''

    if (!id) {
      errors.push(`CSV ${line}行目: id が空です。`)
    } else if (seenIds.has(id)) {
      errors.push(`CSV ${line}行目: ID「${id}」が重複しています。`)
    } else {
      seenIds.add(id)
    }
    if (!displayName) {
      errors.push(`CSV ${line}行目: displayName が空です。`)
    }
    if (createdAt && !isValidDateString(createdAt)) {
      errors.push(`CSV ${line}行目: createdAt「${createdAt}」は有効なYYYY-MM-DD日付ではありません。`)
    }

    if (id && displayName && !rawParticipants.some((participant) => participant.id === id)) {
      rawParticipants.push({ id, displayName, createdAt: createdAt || null })
      rawConnections.push(connectionText ? connectionText.split('|').map((connection) => connection.trim()).filter(Boolean) : [])
    }
  })

  if (rawParticipants.length === 0) {
    errors.push('CSVに有効なデータ行がありません。')
  }
  if (rawParticipants.length > MAX_PARTICIPANTS) {
    errors.push(`CSVは${MAX_PARTICIPANTS.toLocaleString()}件以内にしてください。`)
  }
  if (errors.length > 0) {
    return invalidResult(errors)
  }

  const edges: Edge[] = []
  rawParticipants.forEach((participant, index) => {
    for (const connection of rawConnections[index] ?? []) {
      edges.push({ source: participant.id, target: connection })
    }
  })

  const dataset: LinkScopeDataset = {
    datasetName: fileName.replace(/\.[^.]+$/, '') || 'csv-dataset',
    consent: { confirmed: false, scope: 'all-participants' },
    referenceId: rawParticipants[0].id,
    participants: rawParticipants,
    edges,
  }
  const result = validateDataset(dataset)
  return {
    ...result,
    warnings: ['CSVでは先頭行を参照ノードとして扱います。', ...result.warnings],
  }
}

export function parseDatasetInput(
  text: string,
  format: 'json' | 'csv',
  fileName?: string,
): ParsedFileResult {
  const result = format === 'json' ? parseJsonText(text) : parseCsvText(text, fileName)
  return { ...result, fileName, format }
}

export async function parseDatasetFile(file: File): Promise<ParsedFileResult> {
  if (file.size > MAX_FILE_BYTES) {
    return {
      ...invalidResult([`ファイルサイズが上限（${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB）を超えています。`]),
      fileName: file.name,
    }
  }

  const extension = file.name.toLowerCase().split('.').pop()
  if (extension !== 'json' && extension !== 'csv') {
    return {
      ...invalidResult(['JSONまたはCSVファイルを選択してください。']),
      fileName: file.name,
    }
  }

  try {
    return parseDatasetInput(await file.text(), extension, file.name)
  } catch {
    return {
      ...invalidResult(['ファイルを読み込めませんでした。内容を確認してください。']),
      fileName: file.name,
      format: extension,
    }
  }
}

