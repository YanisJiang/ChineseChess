/**
 * 中炮对屏风马短谱网：多段短谱接力，可走完红/黑/和三路示范。
 * 谱名不剧透结果；车一平二后黑三选分叉（三课同 startFen）。
 */
import { lineFromPath } from './lineFromPath'
import type { StudyLine, StudyPhase } from './types'

/** 共用至「车一平二」后（黑走） */
export const PINGFENG_SHARED = [
  'h2-e2',
  'h9-g7',
  'b0-c2',
  'b9-c7',
  'h0-g2',
  'g6-g5',
  'e2-e6',
  'g7-e6',
  'e3-e4',
  'f9-e8',
  'g3-g4',
  'g5-g4',
  'i0-h0',
] as const

export const PINGFENG_RED_TAIL = [
  'g4-g3',
  'b2-b6',
  'g3-g2',
  'a0-a1',
  'g2-g1',
  'a1-g1',
  'a6-a5',
  'c0-e2',
  'a5-a4',
  'a3-a4',
  'a9-a4',
  'h0-h4',
  'a4-e4',
  'h4-e4',
  'c6-c5',
  'g1-h1',
  'c5-c4',
  'c3-c4',
  'e6-f8',
  'b6-c6',
  'i6-i5',
  'c6-c9',
] as const

export const PINGFENG_BLACK_TAIL = [
  'h7-g7',
  'e4-e5',
  'e6-f8',
  'e5-d5',
  'g4-g3',
  'd5-c5',
  'g3-g2',
  'c5-b5',
  'b7-b2',
  'b5-a5',
  'g2-g1',
  'a5-b5',
  'g7-g0',
  'h0-g0',
  'g1-g0',
  'b5-a5',
  'g0-f0',
  'e0-e1',
  'a6-a5',
  'i3-i4',
  'i9-h9',
  'i4-i5',
  'h9-h1',
] as const

export const PINGFENG_DRAW_TAIL = [
  'h7-i7',
  'a0-a1',
  'g4-g3',
  'g2-i1',
  'i7-i3',
  'c0-e2',
  'i3-c3',
  'd0-e1',
  'c3-d3',
  'e0-d0',
  'd3-f3',
  'd0-e0',
  'f3-d3',
  'e0-d0',
  'd3-f3',
  'd0-e0',
  'f3-d3',
] as const

const HUB = 4 // 分叉枢纽课各含尾段前 4 半着

function continueTail(opts: {
  idPrefix: string
  shared: readonly string[]
  tail: readonly string[]
  hubSize: number
  chunkSizes: number[]
  titles: string[]
  summaries: string[]
  midChunks: number
}): StudyLine[] {
  const rest = [...opts.tail.slice(opts.hubSize)]
  const fullForSlice = [...opts.shared, ...opts.tail.slice(0, opts.hubSize), ...rest]
  // slice 整条，但丢掉「shared+hub」之前的假想段——改为只 slice rest，prefix=shared+hub
  const lines: StudyLine[] = []
  let offset = 0
  const sizes = [...opts.chunkSizes]
  for (let i = 0; i < sizes.length; i++) {
    const size = i === sizes.length - 1 ? rest.length - offset : sizes[i]!
    const prefix = [
      ...opts.shared,
      ...opts.tail.slice(0, opts.hubSize),
      ...rest.slice(0, offset),
    ]
    const plies = rest.slice(offset, offset + size).map((uci) => ({
      uci,
      benefit: '示范续着，体会节奏。',
      main: true as const,
    }))
    if (plies.length === 0) break
    const phase: StudyPhase = i < opts.midChunks ? 'middlegame' : 'endgame'
    lines.push(
      lineFromPath({
        id: `${opts.idPrefix}-${i + 2}`,
        phase,
        title: opts.titles[i] ?? `续段${i + 2}`,
        summary: opts.summaries[i] ?? '示范续着。',
        prefix,
        plies,
        endComment:
          i === sizes.length - 1 ? '本段示范走完。' : '本段告一段落，可转谱续走。',
      }),
    )
    offset += size
  }
  return lines
}

const sharedAndHub: StudyLine[] = [
  lineFromPath({
    id: 'mid-paoda-zhongbing',
    phase: 'middlegame',
    title: '中炮打中兵',
    summary: '屏风成型后打中兵兑马，转入中局争夺。',
    prefix: ['h2-e2', 'h9-g7', 'b0-c2', 'b9-c7', 'h0-g2', 'g6-g5'],
    plies: [
      { uci: 'e2-e6', benefit: '打中兵得实利，逼黑应对。', main: true },
      { uci: 'g7-e6', benefit: '兑掉恶炮，稳住中路。' },
      { uci: 'e3-e4', benefit: '中兵跟上，继续争中路。' },
      { uci: 'f9-e8', benefit: '补士固防。' },
    ],
    endComment: '兑马补士完成，可转谱续走。',
    rootAlts: [
      {
        ply: { uci: 'c3-c4', benefit: '不急打兵，先挺七兵扩地。' },
        endComment: '缓攻变着。',
      },
    ],
  }),
  lineFromPath({
    id: 'end-duima-tingbing',
    phase: 'endgame',
    title: '兑马后续挺兵',
    summary: '兑马后挺三兵、平车，局面开始分叉。',
    prefix: [
      'h2-e2',
      'h9-g7',
      'b0-c2',
      'b9-c7',
      'h0-g2',
      'g6-g5',
      'e2-e6',
      'g7-e6',
      'e3-e4',
      'f9-e8',
    ],
    plies: [
      { uci: 'g3-g4', benefit: '挺兵活马，扩大右翼。', main: true },
      { uci: 'g5-g4', benefit: '对兑，保持均势。' },
      { uci: 'i0-h0', benefit: '平车瞄炮，打开后续选择。' },
    ],
    endComment: '平车后黑有多方向可选，注意转谱。',
    rootAlts: [
      {
        ply: { uci: 'g2-e3', benefit: '也可跳盘头马争中。' },
        endComment: '盘马变着。',
      },
    ],
  }),
  /** 枢纽：一课三方向，避免同 FEN 多课被字典序锁死和向 */
  lineFromPath({
    id: 'mid-pingfeng-pingchehou',
    phase: 'middlegame',
    title: '屏风平车后',
    summary: '车一平二后，黑可对兵、平炮或边炮——三向择一续走。',
    prefix: [...PINGFENG_SHARED],
    plies: [
      { uci: 'g4-g3', benefit: '继续挺卒，试探红方应手。', main: true },
      { uci: 'b2-b6', benefit: '升炮压马，争夺主动。' },
      { uci: 'g3-g2', benefit: '卒继续下沉。' },
      { uci: 'a0-a1', benefit: '起横车，准备捉卒。' },
    ],
    endComment: '对兵争先段完成，可转谱。',
    rootAlts: [
      {
        ply: { uci: 'h7-g7', benefit: '平炮瞄马，压迫红右翼。' },
        continuation: [
          { uci: 'e4-e5', benefit: '中兵抢渡。' },
          { uci: 'e6-f8', benefit: '退马腾挪，保持弹性。' },
          { uci: 'e5-d5', benefit: '兵线平移，继续施压。' },
        ],
        endComment: '平炮压肋段完成，可转谱。',
      },
      {
        ply: { uci: 'h7-i7', benefit: '平边炮，另辟攻击路线。' },
        continuation: [
          { uci: 'a0-a1', benefit: '起横车应对。' },
          { uci: 'g4-g3', benefit: '卒下沉牵制。' },
          { uci: 'g2-i1', benefit: '退马避锋。' },
        ],
        endComment: '边炮骑河段完成，可转谱。',
      },
    ],
  }),
]

const redLines = continueTail({
  idPrefix: 'pf-red',
  shared: PINGFENG_SHARED,
  tail: PINGFENG_RED_TAIL,
  hubSize: HUB,
  chunkSizes: [5, 5, 5, 99],
  midChunks: 2,
  titles: ['下卒出车', '巡河兑车', '渡兵缠斗', '沉底取势'],
  summaries: [
    '卒入肋与红出车捉拿。',
    '边线兑车，局面简化。',
    '双兵渡河，子力纠缠。',
    '沉炮底线，示范收束。',
  ],
})

const blackLines = continueTail({
  idPrefix: 'pf-black',
  shared: PINGFENG_SHARED,
  tail: PINGFENG_BLACK_TAIL,
  hubSize: HUB,
  chunkSizes: [4, 4, 4, 4, 99],
  midChunks: 2,
  titles: ['退马腾挪', '炮打中兵', '沉底兑车', '小卒近身', '肋车入局'],
  summaries: [
    '退马与兵线纠缠。',
    '炮击中路，打开对攻。',
    '沉底兑车，简化子力。',
    '小卒近帅，收紧空间。',
    '肋车入局，示范收束。',
  ],
})

const drawLines = continueTail({
  idPrefix: 'pf-draw',
  shared: PINGFENG_SHARED,
  tail: PINGFENG_DRAW_TAIL,
  hubSize: HUB,
  chunkSizes: [4, 4, 99],
  midChunks: 1,
  titles: ['炮巡河沿', '将门往返', '局面循环'],
  summaries: [
    '边炮巡河，双方补棋。',
    '将门与炮位往返试探。',
    '局面重复，示范收束。',
  ],
})

export const PINGFENG_WEB_LINES: StudyLine[] = [
  ...sharedAndHub,
  ...redLines,
  ...blackLines,
  ...drawLines,
]

export const PINGFENG_PATHS = {
  shared: [...PINGFENG_SHARED],
  red: [...PINGFENG_SHARED, ...PINGFENG_RED_TAIL],
  black: [...PINGFENG_SHARED, ...PINGFENG_BLACK_TAIL],
  draw: [...PINGFENG_SHARED, ...PINGFENG_DRAW_TAIL],
}
