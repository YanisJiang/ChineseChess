/**
 * 中炮对屏风马短谱网：共用前缀 + 枢纽短分支。
 * 已去掉为凑终局的送吃/凑杀/凑和尾巴；终局等谱面增多后再自然衔接。
 */
import { lineFromPath } from './lineFromPath'
import type { StudyLine } from './types'

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

export const PINGFENG_WEB_LINES: StudyLine[] = [
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
  /** 枢纽：平炮压马 / 边炮短计划，不走无计划下卒送吃 */
  lineFromPath({
    id: 'mid-pingfeng-pingchehou',
    phase: 'middlegame',
    title: '屏风平车后',
    summary: '车一平二后，黑可平炮压马或平边炮——择一续走。',
    prefix: [...PINGFENG_SHARED],
    plies: [
      { uci: 'h7-g7', benefit: '平炮瞄马，压迫红右翼。', main: true },
      { uci: 'e4-e5', benefit: '中兵抢渡。' },
      { uci: 'e6-f8', benefit: '退马腾挪，保持弹性。' },
      { uci: 'e5-d5', benefit: '兵线平移，继续施压。' },
    ],
    endComment: '平炮压肋段完成，可转谱。',
    rootAlts: [
      {
        ply: { uci: 'h7-i7', benefit: '平边炮，另辟攻击路线。' },
        continuation: [
          { uci: 'a0-a1', benefit: '起横车应对。' },
          { uci: 'g4-g3', benefit: '卒下沉牵制，配合边炮。' },
          { uci: 'g2-i1', benefit: '退马避锋。' },
        ],
        endComment: '边炮骑河段完成，可转谱。',
      },
    ],
  }),
]

export const PINGFENG_PATHS = {
  shared: [...PINGFENG_SHARED],
  /** 枢纽主线：平炮压马短支 */
  hubMain: [...PINGFENG_SHARED, 'h7-g7', 'e4-e5', 'e6-f8', 'e5-d5'],
  /** 枢纽变着：边炮短支 */
  hubEdge: [...PINGFENG_SHARED, 'h7-i7', 'a0-a1', 'g4-g3', 'g2-i1'],
}
