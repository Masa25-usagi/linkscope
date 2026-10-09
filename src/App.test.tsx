import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

describe('LinkScope application flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps analysis disabled until a dataset and explicit consent are present', async () => {
    const user = userEvent.setup()
    render(<App />)

    const analyzeButton = screen.getByRole('button', { name: '分析を実行' })
    const consent = screen.getByRole('checkbox', { name: '対象者全員から分析への明示的な同意を得ています' })
    expect(analyzeButton).toBeDisabled()
    expect(consent).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'サンプルを読み込む' }))
    expect(consent).toBeEnabled()
    expect(analyzeButton).toBeDisabled()
    expect(screen.getByText('対象者全員の明示的な同意を確認してください。')).toBeInTheDocument()

    await user.click(consent)
    expect(analyzeButton).toBeEnabled()
    expect(screen.getByText('同意確認済み。ブラウザ内で解析します。')).toBeInTheDocument()
  })

  it('runs the sample analysis, synchronizes selection, and renders the network and score breakdown', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'サンプルを読み込む' }))
    await user.click(screen.getByRole('checkbox', { name: '対象者全員から分析への明示的な同意を得ています' }))
    await user.click(screen.getByRole('button', { name: '分析を実行' }))

    expect(screen.getByText('3件の候補を分析しました。類似度は同一性の確率ではありません。')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /participant_07/ })).toBeInTheDocument()
    expect(screen.getByText('選択中:')).toBeInTheDocument()
    expect(screen.getByText('participant_07', { selector: '.selected-summary strong' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /participant_07と参照ノードの匿名ネットワーク/ })).toBeInTheDocument()
    expect(screen.getByText('共通接続', { selector: '.breakdown-label span' })).toBeInTheDocument()

    const candidate12Radio = screen.getByRole('radio', { name: 'participant_12を選択' })
    await user.click(candidate12Radio)
    expect(candidate12Radio).toBeChecked()
    expect(screen.getByText('participant_12', { selector: '.selected-summary strong' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /participant_12と参照ノードの匿名ネットワーク/ })).toBeInTheDocument()
  })

  it('filters visible candidates and resets the in-memory analysis state', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'サンプルを読み込む' }))
    await user.click(screen.getByRole('checkbox', { name: '対象者全員から分析への明示的な同意を得ています' }))
    await user.click(screen.getByRole('button', { name: '分析を実行' }))

    const search = screen.getByRole('textbox', { name: '候補IDまたは表示名を検索' })
    await user.type(search, 'participant_21')
    expect(screen.getByRole('row', { name: /participant_21/ })).toBeInTheDocument()
    expect(screen.queryByRole('row', { name: /participant_07/ })).not.toBeInTheDocument()
    expect(screen.getByText('1 / 3 件')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '最初から' }))
    expect(screen.getByRole('button', { name: '分析を実行' })).toBeDisabled()
    expect(screen.getByText('分析前です')).toBeInTheDocument()
    expect(screen.queryByText('synthetic-consented-demo')).not.toBeInTheDocument()
  })

  it('accepts a valid JSON file and shows a concrete parser error for an invalid file', async () => {
    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByLabelText('JSON / CSV ファイルを選択')
    const validContents = JSON.stringify({
        datasetName: 'file-dataset',
        consent: { confirmed: true, scope: 'all-participants' },
        referenceId: 'ref',
        participants: [{ id: 'ref', displayName: 'Reference', createdAt: '2024-01-01' }],
        edges: [],
      })
    const valid = new File([validContents], 'dataset.json', { type: 'application/json' })
    Object.defineProperty(valid, 'text', { configurable: true, value: async () => validContents })
    await user.upload(input, valid)
    expect(await screen.findByText('file-dataset')).toBeInTheDocument()
    expect(screen.getByText('接続データがないため、共通接続を使った結果は表示されません。')).toBeInTheDocument()

    const invalid = new File(['{oops'], 'broken.json', { type: 'application/json' })
    Object.defineProperty(invalid, 'text', { configurable: true, value: async () => '{oops' })
    await user.upload(input, invalid)
    expect(await screen.findByText('broken.json')).toBeInTheDocument()
    expect(screen.getByText('JSONの形式が正しくありません。UTF-8のJSONオブジェクトを指定してください。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '分析を実行' })).toBeDisabled()
  })

  it('exports JSON from the selected result without sending the input elsewhere', async () => {
    const user = userEvent.setup()
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn() })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:linkscope')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'サンプルを読み込む' }))
    await user.click(screen.getByRole('checkbox', { name: '対象者全員から分析への明示的な同意を得ています' }))
    await user.click(screen.getByRole('button', { name: '分析を実行' }))
    await user.click(screen.getByRole('button', { name: '結果をJSONで保存' }))

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(anchorClick).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:linkscope')
    expect(screen.getByText('結果をJSONファイルとして保存しました。')).toBeInTheDocument()

    const exportRegion = screen.getByRole('region', { name: 'エクスポート' })
    expect(within(exportRegion).getByText('入力データと分析結果は外部へ送信されません。')).toBeInTheDocument()
  })
})
