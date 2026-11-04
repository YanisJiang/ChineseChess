import {
  defaultRecordBasename,
  downloadText,
  recordToJson,
  recordToTxt,
  type GameRecord,
} from '../record/exportGame'

type Props = {
  record: GameRecord
  onClose: () => void
  onCopied: (what: string) => void
}

export function ExportPanel({ record, onClose, onCopied }: Props) {
  const txt = recordToTxt(record)
  const json = recordToJson(record)
  const base = defaultRecordBasename()

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard?.writeText(text)
      onCopied(`已复制${label}`)
    } catch {
      onCopied(`复制${label}失败`)
    }
  }

  return (
    <section className="export-panel">
      <div className="row export-panel-head">
        <h2>导出棋谱</h2>
        <button type="button" onClick={onClose}>
          关闭
        </button>
      </div>
      <p className="hint">可预览、复制或分别下载 txt / json。</p>
      <textarea className="export-preview" readOnly value={txt} rows={12} />
      <div className="btn-row">
        <button type="button" onClick={() => void copy(txt, '文本谱')}>
          复制 txt
        </button>
        <button type="button" onClick={() => void copy(json, 'JSON')}>
          复制 json
        </button>
        <button
          type="button"
          onClick={() => downloadText(`${base}.txt`, txt)}
        >
          下载 txt
        </button>
        <button
          type="button"
          onClick={() => downloadText(`${base}.json`, json)}
        >
          下载 json
        </button>
      </div>
    </section>
  )
}
