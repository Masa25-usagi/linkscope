import type { AnalysisProgressEvent, OnlineAnalysisResult } from '../types'

const API_BASE = '/api'

/**
 * バックエンドにサブ垢分析をリクエストし、SSEで進捗を受信する
 */
export async function analyzeTarget(
  targetScreenName: string,
  onProgress: (event: AnalysisProgressEvent) => void,
  signal?: AbortSignal,
): Promise<OnlineAnalysisResult> {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_screen_name: targetScreenName }),
    signal,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`サーバーエラー (${response.status}): ${text || response.statusText}`)
  }

  if (!response.body) {
    throw new Error('レスポンスボディがありません。')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let finalResult: OnlineAnalysisResult | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const jsonStr = line.slice(6).trim()
      if (!jsonStr || jsonStr === '[DONE]') continue

      try {
        const event = JSON.parse(jsonStr) as AnalysisProgressEvent
        onProgress(event)

        if (event.stage === 'error') {
          throw new Error(event.message)
        }

        if (event.stage === 'complete' && event.data) {
          finalResult = {
            target: event.data.target!,
            closeFriends: event.data.close_friends ?? [],
            candidates: event.data.candidates ?? [],
          }
        }
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message !== jsonStr) {
          throw parseError
        }
        // JSON parse error は無視して次の行へ
      }
    }
  }

  if (!finalResult) {
    throw new Error('分析結果を受信できませんでした。')
  }

  return finalResult
}

/**
 * バックエンドのヘルスチェック
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, { method: 'GET' })
    return response.ok
  } catch {
    return false
  }
}
