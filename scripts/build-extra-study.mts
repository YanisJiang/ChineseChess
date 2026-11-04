/**
 * 从 raw 路径生成并校验三份扩展包，写回 src/study/extra*.ts
 */
import { writeFileSync } from 'node:fs'
import {
  applyMoveOnBoard,
  coordToSquare,
  createInitialBoard,
} from '../src/engine/board'
import { boardToFen } from '../src/engine/fen'
import { generateLegalMoves } from '../src/engine/moves'
import type { Side } from '../src/engine/types'
import { PINGFENG_SHARED } from '../src/study/pingfengWeb'

const PF = [...PINGFENG_SHARED]

type Ply = { uci: string; benefit: string }
type RawLine = {
  id: string
  title: string
  summary: string
  prefix: string[]
  plies: Ply[]
  endComment: string
}

function assertPath(id: string, prefix: string[], plies: Ply[]) {
  let board = createInitialBoard()
  let side: Side = 'red'
  for (const step of [...prefix, ...plies.map((p) => p.uci)]) {
    const [fs, ts] = step.split('-')
    const from = coordToSquare(fs!)
    const to = coordToSquare(ts!)
    if (from === null || to === null) throw new Error(`${id}: bad ${step}`)
    const ok = generateLegalMoves(board, side).some(
      (m) => m.from === from && m.to === to,
    )
    if (!ok) {
      throw new Error(
        `${id}: illegal ${step} @ ${boardToFen(board, side)} side=${side}`,
      )
    }
    board = applyMoveOnBoard(board, from, to)
    side = side === 'red' ? 'black' : 'red'
  }
}

function emitPack(
  phase: 'opening' | 'middlegame' | 'endgame',
  exportName: string,
  helper: string,
  lines: RawLine[],
  header: string,
): string {
  for (const L of lines) assertPath(L.id, L.prefix, L.plies)

  const body = lines
    .map((L) => {
      const plies = L.plies
        .map(
          (p, i) =>
            `      { uci: '${p.uci}', benefit: '${p.benefit}'${i === 0 ? ', main: true' : ''} },`,
        )
        .join('\n')
      if (phase === 'opening') {
        return `  ${helper}(
    '${L.id}',
    '${L.title}',
    '${L.summary}',
    [
${plies}
    ],
    '${L.endComment}',
  ),`
      }
      const prefix = L.prefix.map((u) => `      '${u}',`).join('\n')
      return `  ${helper}(
    '${L.id}',
    '${L.title}',
    '${L.summary}',
    [
${prefix}
    ],
    [
${plies}
    ],
    '${L.endComment}',
  ),`
    })
    .join('\n')

  if (phase === 'opening') {
    return `${header}
import { lineFromPath } from './lineFromPath'
import type { StudyLine } from './types'

function ${helper}(
  id: string,
  title: string,
  summary: string,
  plies: { uci: string; benefit: string; main?: boolean }[],
  endComment: string,
): StudyLine {
  return lineFromPath({
    id,
    phase: 'opening',
    title,
    summary,
    prefix: [],
    plies: plies.map((p, i) => ({ ...p, main: p.main ?? i === 0 })),
    endComment,
  })
}

export const ${exportName}: StudyLine[] = [
${body}
]
`
  }

  return `${header}
import { lineFromPath } from './lineFromPath'
import type { StudyLine } from './types'

function ${helper}(
  id: string,
  title: string,
  summary: string,
  prefix: string[],
  plies: { uci: string; benefit: string; main?: boolean }[],
  endComment: string,
): StudyLine {
  return lineFromPath({
    id,
    phase: '${phase}',
    title,
    summary,
    prefix,
    plies: plies.map((p, i) => ({ ...p, main: p.main ?? i === 0 })),
    endComment,
  })
}

export const ${exportName}: StudyLine[] = [
${body}
]
`
}

const b = (uci: string, benefit: string): Ply => ({ uci, benefit })

const openings: RawLine[] = [
  {
    id: 'op-guoheche',
    title: '中炮过河车',
    summary: '中炮出马平车后进车过河，压迫黑马，典型急攻节奏。',
    prefix: [],
    plies: [
      b('h2-e2', '炮镇中路，先手取势。'),
      b('h9-g7', '跳马护中，准备成屏风。'),
      b('h0-g2', '出右马，为右车让路。'),
      b('b9-c7', '双马成形。'),
      b('i0-h0', '平车盯炮，启动右翼。'),
      b('g6-g5', '挺卒活马，限制红马。'),
      b('h0-h6', '车过河压马，形成过河车攻势。'),
    ],
    endComment: '中炮过河车骨架完成，可转谱续攻或换学其它变例。',
  },
  {
    id: 'op-wuliu-pao',
    title: '五六炮',
    summary: '中炮后平六路炮，控肋兼顾士角，稳健多变。',
    prefix: [],
    plies: [
      b('h2-e2', '中炮抢中。'),
      b('h9-g7', '跳马护中。'),
      b('b2-d2', '炮平六路，瞄准肋道与士角。'),
      b('b9-c7', '出马均衡。'),
      b('b0-c2', '左马跟上，支援中炮。'),
      b('g6-g5', '挺卒活马。'),
      b('h0-g2', '右马出动，阵型完整。'),
    ],
    endComment: '五六炮基本阵型立住。',
  },
  {
    id: 'op-wuqi-pao',
    title: '五七炮',
    summary: '中炮后平七路炮，瞄准黑马与卒林，常见攻屏风手段。',
    prefix: [],
    plies: [
      b('h2-e2', '中炮。'),
      b('h9-g7', '跳马。'),
      b('b2-c2', '炮平七，瞄马盯卒。'),
      b('b9-c7', '出马护中。'),
      b('b0-a2', '边马出动，配合七路炮。'),
      b('a9-a8', '起横车，常见应手。'),
      b('h0-g2', '右马跟上，完善子力。'),
    ],
    endComment: '五七炮对抗骨架完成。',
  },
  {
    id: 'op-xunhe-pao',
    title: '中炮巡河炮',
    summary: '中炮出马后升巡河炮，保护中兵并支援挺三兵。',
    prefix: [],
    plies: [
      b('h2-e2', '中炮。'),
      b('h9-g7', '跳马。'),
      b('b0-c2', '出左马。'),
      b('b9-c7', '对称出马。'),
      b('b2-b4', '炮巡河，护中兵、助挺兵。'),
      b('a9-a8', '起横车应对。'),
      b('g3-g4', '挺三兵，巡河炮护根。'),
    ],
    endComment: '中炮巡河炮计划告一段落。',
  },
  {
    id: 'op-qilu-ma',
    title: '中炮七路马',
    summary: '中炮后跳七路马，加强中路与左翼联动。',
    prefix: [],
    plies: [
      b('h2-e2', '中炮。'),
      b('h9-g7', '跳马。'),
      b('b0-c2', '七路马出动。'),
      b('b9-c7', '出马。'),
      b('c3-c4', '挺七兵，活马扩地。'),
      b('g6-g5', '对挺。'),
      b('h0-g2', '右马跟上。'),
    ],
    endComment: '中炮七路马骨架完成。',
  },
  {
    id: 'op-shunpao-zhiche',
    title: '顺炮直车',
    summary: '顺炮后出直车，抢出子速度，对攻意味浓。',
    prefix: [],
    plies: [
      b('h2-e2', '中炮。'),
      b('h7-e7', '顺炮对打。'),
      b('h0-g2', '出右马。'),
      b('h9-g7', '跳马护炮。'),
      b('i0-h0', '直车平出，威胁黑炮。'),
      b('g6-g5', '挺卒挡车。'),
      b('b0-c2', '左马出动，完善阵型。'),
    ],
    endComment: '顺炮直车起手完成。',
  },
  {
    id: 'op-shunpao-huanche',
    title: '顺炮横车',
    summary: '顺炮起横车再平肋，争夺肋道主动。',
    prefix: [],
    plies: [
      b('h2-e2', '中炮。'),
      b('h7-e7', '顺炮。'),
      b('b0-c2', '出马护中。'),
      b('h9-g7', '跳马。'),
      b('i0-i1', '起横车。'),
      b('a9-a8', '黑也起横车对抢。'),
      b('i1-d1', '横车平肋，占线争先。'),
    ],
    endComment: '顺炮横车占肋完成。',
  },
  {
    id: 'op-liepao-zhiche',
    title: '列炮直车',
    summary: '列手炮后出直车，加快对攻节奏。',
    prefix: [],
    plies: [
      b('h2-e2', '中炮。'),
      b('b7-e7', '列手炮对打。'),
      b('h0-g2', '出右马。'),
      b('b9-c7', '出马护炮。'),
      b('i0-h0', '直车出动。'),
      b('h9-g7', '左马跟上。'),
      b('b0-c2', '左马完善阵型。'),
    ],
    endComment: '列炮直车骨架完成。',
  },
  {
    id: 'op-zuozhongpao',
    title: '左中炮',
    summary: '先平左中炮，布局镜像，练习左右对称计划。',
    prefix: [],
    plies: [
      b('b2-e2', '左炮平中，抢中路。'),
      b('b9-c7', '跳马护中。'),
      b('b0-c2', '出左马。'),
      b('h9-g7', '右马跟上。'),
      b('a0-b0', '平车护炮，疏通左翼。'),
      b('g6-g5', '挺卒。'),
      b('h0-g2', '右马出动。'),
    ],
    endComment: '左中炮基本阵型完成。',
  },
  {
    id: 'op-bianma',
    title: '边马局',
    summary: '先跳边马再定阵，偏柔和的出子次序。',
    prefix: [],
    plies: [
      b('b0-a2', '跳边马，保留中路弹性。'),
      b('h9-g7', '对出马。'),
      b('h2-e2', '转中炮，边马支援侧翼。'),
      b('b9-c7', '出马护中。'),
      b('h0-g2', '右马跟上。'),
      b('g6-g5', '挺卒活马。'),
      b('i0-h0', '出车，阵型成型。'),
    ],
    endComment: '边马转中炮骨架完成。',
  },
  {
    id: 'op-jingou-pao',
    title: '金钩炮',
    summary: '炮平边、出马让路后落底，形成金钩结构。',
    prefix: [],
    plies: [
      b('h2-i2', '炮平边，金钩炮起手。'),
      b('h9-g7', '正常出马。'),
      b('h0-g2', '出马，为落底炮腾挪底线。'),
      b('b9-c7', '出马。'),
      b('i0-h0', '出车让出边线落点。'),
      b('g6-g5', '挺卒。'),
      b('i2-i0', '落底炮，金钩成形。'),
    ],
    endComment: '金钩炮入门骨架完成。',
  },
  {
    id: 'op-shijiao-zhuanzhong',
    title: '士角炮转中炮',
    summary: '先士角炮试探，再转中炮争中路。',
    prefix: [],
    plies: [
      b('h2-f2', '炮平士角，试探应手。'),
      b('h9-g7', '跳马。'),
      b('f2-e2', '转中炮，转入常规争夺。'),
      b('b9-c7', '出马护中。'),
      b('b0-c2', '出马。'),
      b('g6-g5', '挺卒。'),
      b('h0-g2', '右马跟上。'),
    ],
    endComment: '士角炮转中炮完成。',
  },
  {
    id: 'op-duibing-feixiang',
    title: '对兵转飞相',
    summary: '互挺三兵后飞相，走柔式对兵结构。',
    prefix: [],
    plies: [
      b('g3-g4', '挺三兵争先。'),
      b('g6-g5', '对挺。'),
      b('g0-e2', '飞相固中。'),
      b('h9-g7', '出马。'),
      b('b0-c2', '出马。'),
      b('b9-c7', '对称出马。'),
      b('h0-g2', '右马完善阵型。'),
    ],
    endComment: '对兵飞相骨架完成。',
  },
  {
    id: 'op-pingfeng-hengche',
    title: '屏风右横车',
    summary: '屏风成型后起右横车，准备平肋抢先。',
    prefix: [],
    plies: [
      b('h2-e2', '中炮。'),
      b('h9-g7', '跳马。'),
      b('b0-c2', '出马。'),
      b('b9-c7', '屏风成形。'),
      b('h0-g2', '右马。'),
      b('g6-g5', '挺卒。'),
      b('i0-i1', '起右横车，准备平肋。'),
    ],
    endComment: '屏风右横车启动完成。',
  },
  {
    id: 'op-zhongpao-bubing',
    title: '中炮补中兵',
    summary: '中炮后先挺中兵，加强中路厚度。',
    prefix: [],
    plies: [
      b('h2-e2', '中炮。'),
      b('h9-g7', '跳马。'),
      b('e3-e4', '挺中兵，增强中炮威慑。'),
      b('b9-c7', '出马。'),
      b('b0-c2', '出马护兵。'),
      b('g6-g5', '挺卒争先。'),
      b('h0-g2', '右马出动。'),
    ],
    endComment: '中炮补中兵计划告一段落。',
  },
]

/** 中局：prefix 偶数手（黑刚走完）则红先；奇数则黑先。均已对拍。 */
const mids: RawLine[] = [
  {
    id: 'mid-pf-pingpao-xuhe',
    title: '平炮后续巡河',
    summary: '屏风平炮压马后，黑起横车，红升巡河炮再对抢肋道。',
    prefix: [...PF, 'h7-g7', 'e4-e5', 'e6-f8', 'e5-d5', 'a9-a8'],
    plies: [
      b('b2-b4', '升巡河炮，护中兵并支援出车。'),
      b('a8-d8', '车平肋试探。'),
      b('a0-a1', '红起横车争夺肋道。'),
      b('f8-e6', '马跃中，加强中路弹性。'),
      b('a1-d1', '对肋护马，稳住阵脚。'),
    ],
    endComment: '平炮后巡河争夺告一段落。',
  },
  {
    id: 'mid-pf-bianpao-chuche',
    title: '边炮后续出车',
    summary: '屏风边炮短支后，黑起横车，红平车盯边炮施压。',
    prefix: [...PF, 'h7-i7', 'a0-a1', 'g4-g3', 'g2-i1', 'a9-a8'],
    plies: [
      b('h0-h4', '升车巡河，盯边炮并支援中路。'),
      b('i7-i3', '边炮巡河，保持牵制。'),
      b('a1-d1', '横车平肋，争夺肋道。'),
      b('a8-d8', '对肋。'),
      b('b2-b4', '炮巡河，巩固阵型。'),
    ],
    endComment: '边炮后出车计划告一段落。',
  },
  {
    id: 'mid-paoda-buchi',
    title: '打兵后补仕',
    summary: '中炮打中兵兑马后，红补仕巩固再出车。',
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
      b('d0-e1', '补仕固防，巩固将门。'),
      b('a9-a8', '起横车，准备平肋。'),
      b('i0-h0', '出直车，两边呼应。'),
      b('a8-d8', '车平肋道争先。'),
      b('h0-h4', '升巡河车，支援中兵。'),
    ],
    endComment: '打兵后补仕出车完成。',
  },
  {
    id: 'mid-shunpao-zhongbing',
    title: '顺炮挺中兵',
    summary: '顺炮横车占肋、黑起横车后，红挺中兵打开对攻。',
    prefix: ['h2-e2', 'h7-e7', 'b0-c2', 'h9-g7', 'i0-i1', 'a9-a8', 'i1-d1', 'a8-d8'],
    plies: [
      b('e3-e4', '挺中兵，配合肋车攻中。'),
      b('g6-g5', '挺卒争先。'),
      b('h0-g2', '出马，准备盘头或保兵。'),
      b('g5-g4', '冲卒打开线路。'),
      b('g2-e3', '马盘中路，加强中攻。'),
    ],
    endComment: '顺炮挺中兵对攻段完成。',
  },
  {
    id: 'mid-liepao-duigong',
    title: '列炮对攻挺兵',
    summary: '列炮起横车后黑补士，红挺中兵加速对攻。',
    prefix: ['h2-e2', 'b7-e7', 'h0-g2', 'b9-c7', 'i0-i1', 'f9-e8', 'i1-d1', 'h9-g7'],
    plies: [
      b('e3-e4', '挺中兵抢攻。'),
      b('e6-e5', '对挺中卒。'),
      b('b0-c2', '出马支援。'),
      b('a9-a8', '起横车。'),
      b('g3-g4', '挺三兵，两边开花。'),
    ],
    endComment: '列炮对攻挺兵段完成。',
  },
  {
    id: 'mid-xianren-chuche',
    title: '仙人指路出车',
    summary: '仙人指路转中炮出马后，黑起横车，红平车展开。',
    prefix: ['g3-g4', 'g6-g5', 'h2-e2', 'h9-g7', 'b0-c2', 'b9-c7', 'h0-g2', 'a9-a8'],
    plies: [
      b('i0-h0', '平车瞄炮，转入中局争夺。'),
      b('a8-d8', '车平肋。'),
      b('c3-c4', '挺七兵活马。'),
      b('g5-g4', '冲兑三兵。'),
      b('b2-b4', '炮巡河，巩固阵型。'),
    ],
    endComment: '仙人指路出车中局段完成。',
  },
  {
    id: 'mid-feixiang-tingbing',
    title: '飞相挺三兵',
    summary: '飞相出马挺三兵后，黑兑卒打开三路线。',
    prefix: ['g0-e2', 'g6-g5', 'b0-c2', 'h9-g7', 'h0-g2', 'b9-c7', 'g3-g4'],
    plies: [
      b('g5-g4', '兑卒，打开三路线。'),
      b('i0-h0', '出车，准备捉卒或占线。'),
      b('h7-i7', '平边炮牵制。'),
      b('b2-b4', '炮巡河，护中并支援。'),
      b('i7-i3', '炮巡河，保持压力。'),
    ],
    endComment: '飞相挺兵中局段完成。',
  },
  {
    id: 'mid-guogong-pingche',
    title: '过宫炮平车',
    summary: '过宫炮出马起横车后，黑起横车，红平肋争夺。',
    prefix: ['h2-d2', 'h9-g7', 'b0-c2', 'g6-g5', 'h0-g2', 'b9-c7', 'i0-i1', 'a9-a8'],
    plies: [
      b('i1-d1', '横车平肋，配合过宫炮。'),
      b('a8-d8', '黑车也对肋。'),
      b('g3-g4', '挺兵争先。'),
      b('g5-g4', '对兑。'),
      b('e3-e4', '挺中兵，加强中路厚度。'),
    ],
    endComment: '过宫炮平车占肋完成。',
  },
  {
    id: 'mid-shijiao-chuziche',
    title: '士角炮出子',
    summary: '士角炮后出马挺兵，黑起横车，红出车转入中局。',
    prefix: ['h2-f2', 'h9-g7', 'b0-c2', 'b9-c7', 'g3-g4', 'g6-g5', 'h0-g2', 'a9-a8'],
    plies: [
      b('i0-h0', '出车，士角炮阵展开。'),
      b('a8-d8', '车平肋。'),
      b('f2-e2', '转中炮加强中路。'),
      b('g5-g4', '冲兑三兵。'),
      b('c3-c4', '挺七兵，两翼发展。'),
    ],
    endComment: '士角炮出子转中局完成。',
  },
  {
    id: 'mid-fangong-tingqi',
    title: '反宫马挺七兵',
    summary: '中炮对反宫马后挺七兵，黑挺卒对抢空间。',
    prefix: ['h2-e2', 'b9-c7', 'b0-c2', 'a9-a8', 'h0-g2', 'h9-g7', 'c3-c4'],
    plies: [
      b('g6-g5', '挺卒对抢空间。'),
      b('i0-h0', '出车瞄炮。'),
      b('a8-d8', '车占肋道。'),
      b('b2-b4', '炮巡河支援。'),
      b('c7-e8', '马跃士角，疏通肋道。'),
    ],
    endComment: '反宫马挺七兵中局段完成。',
  },
  {
    id: 'mid-sanbuhu-jinche',
    title: '三步虎进车',
    summary: '三步虎平车后，黑起横车，红升巡河调整进攻。',
    prefix: ['h2-e2', 'h9-g7', 'h0-g2', 'b9-c7', 'i0-h0', 'g6-g5', 'b0-c2', 'a9-a8'],
    plies: [
      b('h0-h4', '升巡河车，灵活攻守。'),
      b('a8-d8', '占肋。'),
      b('g3-g4', '兑三兵争先。'),
      b('g5-g4', '对兑。'),
      b('h4-g4', '车吃卒，占据河沿要点。'),
    ],
    endComment: '三步虎巡河车段完成。',
  },
  {
    id: 'mid-dantima-hengche',
    title: '单提马横车占肋',
    summary: '单提马起横车后平肋，红也对肋争夺。',
    prefix: ['h2-e2', 'b9-c7', 'b0-c2', 'a9-a8', 'h0-g2', 'a8-d8', 'i0-i1', 'h9-g7'],
    plies: [
      b('i1-d1', '红车也对肋，争夺肋道。'),
      b('g6-g5', '挺卒争先。'),
      b('g3-g4', '对挺。'),
      b('g5-g4', '兑卒。'),
      b('b2-b4', '炮巡河巩固。'),
    ],
    endComment: '单提马横车占肋完成。',
  },
  {
    id: 'mid-zubipao-ya',
    title: '卒底炮压马',
    summary: '仙人指路对卒底炮后，黑起横车，红出车压迫。',
    prefix: ['g3-g4', 'h7-g7', 'h2-e2', 'b9-c7', 'b0-c2', 'h9-i7', 'h0-g2', 'a9-a8'],
    plies: [
      b('i0-h0', '出车瞄卒底炮。'),
      b('a8-d8', '车平肋。'),
      b('c3-c4', '挺七兵争空间。'),
      b('i6-i5', '挺边卒活马。'),
      b('b2-b4', '炮巡河，两边呼应。'),
    ],
    endComment: '卒底炮压马出车段完成。',
  },
  {
    id: 'mid-qima-zhongpao-kai',
    title: '起马转中炮展开',
    summary: '起马对兵后转中炮，黑起横车，红出车进入中局。',
    prefix: ['b0-c2', 'h9-g7', 'g3-g4', 'g6-g5', 'h2-e2', 'b9-c7', 'h0-g2', 'a9-a8'],
    plies: [
      b('i0-h0', '出车，转入中局争夺。'),
      b('a8-d8', '占肋。'),
      b('c3-c4', '挺七兵。'),
      b('g5-g4', '冲兑。'),
      b('b2-b4', '炮巡河，巩固阵型。'),
    ],
    endComment: '起马转中炮中局展开完成。',
  },
  {
    id: 'mid-jinbing-zhuanzhong',
    title: '进兵转中炮出车',
    summary: '进兵局转中炮后，黑起横车，红平车进入中局。',
    prefix: ['c3-c4', 'c6-c5', 'h2-e2', 'h9-g7', 'b0-c2', 'b9-c7', 'h0-g2', 'a9-a8'],
    plies: [
      b('i0-h0', '出车展开。'),
      b('a8-d8', '车占肋。'),
      b('g3-g4', '挺三兵两翼并进。'),
      b('g6-g5', '对挺。'),
      b('b2-b4', '炮巡河。'),
    ],
    endComment: '进兵转中炮出车完成。',
  },
  {
    id: 'mid-pingfeng-paodaqi',
    title: '屏风七兵争先',
    summary: '屏风成型后红挺七兵，黑对挺，进入中局纠缠。',
    prefix: ['h2-e2', 'h9-g7', 'b0-c2', 'b9-c7', 'h0-g2', 'g6-g5', 'c3-c4'],
    plies: [
      b('c6-c5', '对挺三卒，保持均势。'),
      b('i0-h0', '出车。'),
      b('a9-a8', '起横车。'),
      b('b2-b4', '炮巡河。'),
      b('a8-d8', '占肋争先。'),
    ],
    endComment: '屏风七兵争先段完成。',
  },
  {
    id: 'mid-wuliu-kaiju',
    title: '五六炮出车',
    summary: '五六炮阵型后，黑起横车，红出车准备运子。',
    prefix: ['h2-e2', 'h9-g7', 'b2-d2', 'b9-c7', 'b0-c2', 'g6-g5', 'h0-g2', 'a9-a8'],
    plies: [
      b('i0-h0', '出车瞄炮。'),
      b('a8-d8', '占肋。'),
      b('g3-g4', '挺兵。'),
      b('g5-g4', '对兑。'),
      b('h0-h4', '升巡河车，控制河沿。'),
    ],
    endComment: '五六炮出车中局段完成。',
  },
  {
    id: 'mid-wuqi-kaiju',
    title: '五七炮巡河',
    summary: '五七炮后，黑起横车，红升巡河炮支援。',
    prefix: ['h2-e2', 'h9-g7', 'b2-c2', 'b9-c7', 'b0-a2', 'a9-a8', 'h0-g2', 'a8-d8'],
    plies: [
      b('c3-c4', '挺七兵，活边马并支援七路炮。'),
      b('g6-g5', '挺卒。'),
      b('i0-h0', '出直车。'),
      b('g5-g4', '冲卒争先。'),
      b('g3-g4', '对兑打开线路。'),
    ],
    endComment: '五七炮巡河段完成。',
  },
  {
    id: 'mid-guohe-shengche',
    title: '过河车升巡河',
    summary: '过河车后黑马跃避，红车退巡河调整节奏。',
    prefix: ['h2-e2', 'h9-g7', 'h0-g2', 'b9-c7', 'i0-h0', 'g6-g5', 'h0-h6'],
    plies: [
      b('a9-a8', '起横车，避开过河车锋芒。'),
      b('h6-h4', '车退巡河，保持压力又防反击。'),
      b('a8-d8', '占肋对抢。'),
      b('b0-c2', '出马支援。'),
      b('g7-e8', '马腾挪，疏通内线。'),
    ],
    endComment: '过河车调整巡河段完成。',
  },
  {
    id: 'mid-xunhe-duibing',
    title: '巡河炮兑三兵',
    summary: '巡河炮护根下兑三兵，打开右翼。',
    prefix: ['h2-e2', 'h9-g7', 'b0-c2', 'b9-c7', 'b2-b4', 'a9-a8', 'g3-g4'],
    plies: [
      b('g6-g5', '对挺，接受兑兵。'),
      b('g4-g5', '兑卒，打开线路。'),
      b('a8-d8', '车占肋，保持对攻。'),
      b('h0-g2', '出马完善右翼。'),
      b('d8-d2', '下二路骚扰，转入中局纠缠。'),
    ],
    endComment: '巡河炮兑三兵段完成。',
  },
  {
    id: 'mid-pingfeng-zuoche',
    title: '屏风左车巡河',
    summary: '屏风后起左横车，黑补士，红升巡河支援。',
    prefix: ['h2-e2', 'h9-g7', 'b0-c2', 'b9-c7', 'h0-g2', 'g6-g5', 'a0-a1', 'f9-e8'],
    plies: [
      b('a1-d1', '左横车平肋，支援中路。'),
      b('a9-a8', '黑起横车对抢。'),
      b('g3-g4', '兑三兵。'),
      b('g5-g4', '对兑。'),
      b('i0-h0', '右车出动，两翼呼应。'),
    ],
    endComment: '屏风左车巡河段完成。',
  },
]

const ends: RawLine[] = [
  {
    id: 'end-pf-pingpao-jianhua',
    title: '平炮后兑子简化',
    summary: '屏风平炮争持后，黑起横车，红升炮寻求兑子简化。',
    prefix: [...PF, 'h7-g7', 'e4-e5', 'e6-f8', 'e5-d5', 'a9-a8'],
    plies: [
      b('b2-b6', '升炮压迫，逼兑或让对方变阵。'),
      b('a8-d8', '车占肋，寻求兑子或对攻。'),
      b('a0-a1', '起横车对抢。'),
      b('f8-e6', '马跃中，加强弹性。'),
      b('a1-d1', '对肋，转入残局运子。'),
    ],
    endComment: '平炮后兑子简化段完成。',
  },
  {
    id: 'end-duima-chuche',
    title: '兑马后出车占线',
    summary: '屏风平车后，黑平炮，红升巡河车控制河沿。',
    prefix: [...PF, 'h7-g7'],
    plies: [
      b('h0-h4', '升巡河车，控制河沿。'),
      b('a9-a8', '起横车。'),
      b('a0-a1', '红起横车对抢。'),
      b('a8-d8', '占肋。'),
      b('a1-d1', '对肋，残局兑车或占线。'),
    ],
    endComment: '兑马后出车占线段完成。',
  },
  {
    id: 'end-shunpao-duiche',
    title: '顺炮肋车兑车',
    summary: '顺炮占肋后兑车简化，练习残局前的兑子判断。',
    prefix: ['h2-e2', 'h7-e7', 'b0-c2', 'h9-g7', 'i0-i1', 'a9-a8', 'i1-d1', 'a8-d8'],
    plies: [
      b('d1-d8', '兑车，简化局面。'),
      b('g7-e8', '退马或马跃腾挪，转入少车。'),
      b('h0-g2', '出马，完善残局阵型。'),
      b('g6-g5', '挺卒争先。'),
      b('g3-g4', '对挺，打开线路。'),
    ],
    endComment: '顺炮肋车兑车段完成。',
  },
  {
    id: 'end-liepao-bingxian',
    title: '列炮兵线纠缠',
    summary: '列炮出子后挺中兵，练习残局前兵形接触。',
    prefix: [
      'h2-e2',
      'b7-e7',
      'h0-g2',
      'b9-c7',
      'i0-i1',
      'h9-g7',
      'i1-d1',
      'a9-a8',
    ],
    plies: [
      b('e3-e4', '挺中兵，打开中线。'),
      b('e6-e5', '对挺中卒。'),
      b('e4-e5', '冲兑中兵，简化中路。'),
      b('c7-e6', '马跃中，占据兑后要点。'),
      b('b0-c2', '出左马，进入残局运子。'),
    ],
    endComment: '列炮兵线纠缠段完成。',
  },
  {
    id: 'end-xianren-duibing',
    title: '仙人指路兑兵残段',
    summary: '仙人指路兑三兵后，黑炮吃卒，双方简化右翼。',
    prefix: ['g3-g4', 'g6-g5', 'h2-e2', 'h9-g7', 'b0-c2', 'b9-c7', 'g4-g5'],
    plies: [
      b('a9-a8', '起横车，保持均势弹性。'),
      b('h0-g2', '出马。'),
      b('a8-d8', '车占肋。'),
      b('i0-h0', '出车对抢。'),
      b('d8-d2', '下二路转入残局纠缠。'),
    ],
    endComment: '仙人指路兑兵残段完成。',
  },
  {
    id: 'end-feixiang-jianhua',
    title: '飞相兑马简化',
    summary: '飞相结构兑卒后，马炮交换进入少马残局。',
    prefix: ['g0-e2', 'g6-g5', 'b0-c2', 'h9-g7', 'h0-g2', 'b9-c7', 'g3-g4'],
    plies: [
      b('g5-g4', '兑卒。'),
      b('i0-h0', '出车捉卒争先。'),
      b('h7-i7', '平边炮牵制。'),
      b('b2-b4', '炮巡河巩固。'),
      b('a9-a8', '起横车，进入残局运子。'),
    ],
    endComment: '飞相兑马简化段完成。',
  },
  {
    id: 'end-guogong-duipao',
    title: '过宫炮兑车',
    summary: '过宫炮双方占肋后兑车，转入少车残局。',
    prefix: ['h2-d2', 'h9-g7', 'b0-c2', 'g6-g5', 'h0-g2', 'b9-c7', 'i0-i1', 'a9-a8'],
    plies: [
      b('i1-d1', '车占肋。'),
      b('a8-d8', '对肋。'),
      b('e3-e4', '挺中兵，加强中路。'),
      b('g5-g4', '冲卒争先。'),
      b('g2-e3', '马盘中，转入残局运子。'),
    ],
    endComment: '过宫炮兑车残段完成。',
  },
  {
    id: 'end-paoda-bingxing',
    title: '打兵后兵形整理',
    summary: '打中兵兑马后兑三兵，整理右翼兵形。',
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
      'g3-g4',
      'g5-g4',
      'i0-h0',
      'a9-a8',
    ],
    plies: [
      b('h0-h4', '升巡河车，整理右翼。'),
      b('a8-d8', '占肋。'),
      b('e4-e5', '冲中兵，扩大空间。'),
      b('d8-d2', '下二路骚扰。'),
      b('b2-b4', '炮巡河，转入残局纠缠。'),
    ],
    endComment: '打兵后兵形整理完成。',
  },
  {
    id: 'end-qilu-bingdu',
    title: '七兵渡河',
    summary: '中炮七兵争先后渡河，练习兵过河手段。',
    prefix: [
      'h2-e2',
      'h9-g7',
      'b0-c2',
      'b9-c7',
      'h0-g2',
      'g6-g5',
      'c3-c4',
      'c6-c5',
      'i0-h0',
      'a9-a8',
    ],
    plies: [
      b('c4-c5', '冲七兵渡河争先。'),
      b('a8-d8', '车占肋牵制。'),
      b('c5-c6', '兵继续深入，制造压力。'),
      b('c7-e8', '马腾挪避兵锋。'),
      b('b2-b4', '炮巡河保护渡河兵。'),
    ],
    endComment: '七兵渡河段完成。',
  },
  {
    id: 'end-sanbing-duihe',
    title: '三兵兑河',
    summary: '挺三兵兑卒后，黑炮兑马，红横车捉炮争河沿。',
    prefix: [
      'h2-e2',
      'h9-g7',
      'b0-c2',
      'b9-c7',
      'h0-g2',
      'g6-g5',
      'g3-g4',
      'g5-g4',
      'i0-i1',
      'a9-a8',
    ],
    plies: [
      b('b2-b4', '炮巡河，护中并支援兑兵后局面。'),
      b('a8-d8', '车占肋对抢。'),
      b('i1-d1', '横车平肋。'),
      b('d8-d2', '下二路骚扰。'),
      b('e3-e4', '挺中兵，稳住残局。'),
    ],
    endComment: '三兵兑河段完成。',
  },
  {
    id: 'end-shijiao-jianhua',
    title: '士角炮兑子',
    summary: '士角炮出马兑卒后，炮马交换转入少马残局。',
    prefix: ['h2-f2', 'h9-g7', 'b0-c2', 'b9-c7', 'h0-g2', 'g6-g5', 'g3-g4'],
    plies: [
      b('g5-g4', '兑卒。'),
      b('i0-h0', '出车捉卒。'),
      b('a9-a8', '起横车。'),
      b('f2-e2', '士角炮转中，加强中路。'),
      b('a8-d8', '占肋转入残局。'),
    ],
    endComment: '士角炮兑子残段完成。',
  },
  {
    id: 'end-fangong-duima',
    title: '反宫马兑炮',
    summary: '反宫马结构后打中兵兑马，转入残局运子。',
    prefix: ['h2-e2', 'b9-c7', 'h0-g2', 'a9-a8', 'b0-c2', 'h9-g7', 'i0-h0', 'a8-d8'],
    plies: [
      b('e2-e6', '打中兵兑马，争实利。'),
      b('g7-e6', '马兑炮。'),
      b('h0-h4', '升巡河车，控制河沿。'),
      b('d8-d2', '下二路骚扰。'),
      b('a0-a1', '起横车支援。'),
    ],
    endComment: '反宫马兑炮残段完成。',
  },
  {
    id: 'end-jinbing-duiche',
    title: '进兵局兑车',
    summary: '进兵局出马后双方占肋，红出中炮转入残局运子。',
    prefix: ['c3-c4', 'h9-g7', 'b0-c2', 'b9-c7', 'h0-g2', 'a9-a8', 'a0-a1', 'a8-d8'],
    plies: [
      b('a1-d1', '对肋。'),
      b('d8-d2', '下二路压马，寻求兑子或骚扰。'),
      b('g3-g4', '挺三兵，打开右翼。'),
      b('g6-g5', '对挺活马。'),
      b('b2-b4', '炮巡河，避开下二路车锋。'),
    ],
    endComment: '进兵局肋车残段完成。',
  },
  {
    id: 'end-qima-bingxing',
    title: '起马局兵形',
    summary: '起马局兑卒后整理兵形，转入残局节奏。',
    prefix: ['h0-g2', 'h9-g7', 'g3-g4', 'g6-g5', 'g4-g5', 'a9-a8', 'b0-c2', 'b9-c7'],
    plies: [
      b('i0-h0', '出车占线。'),
      b('a8-d8', '占肋。'),
      b('e3-e4', '挺中兵，加强中路。'),
      b('g7-e8', '马腾挪。'),
      b('b2-b4', '炮巡河，控制河沿。'),
    ],
    endComment: '起马局兵形整理完成。',
  },
  {
    id: 'end-dantima-duihe',
    title: '单提马兑河',
    summary: '单提马挺边卒后兑三兵，练习河沿控制。',
    prefix: ['h2-e2', 'h9-i7', 'b0-c2', 'i6-i5', 'h0-g2', 'b9-c7', 'g3-g4', 'g6-g5'],
    plies: [
      b('g4-g5', '冲三兵兑卒。'),
      b('a9-a8', '起横车保持弹性。'),
      b('i0-h0', '出车占线。'),
      b('a8-d8', '占肋。'),
      b('h0-h4', '车升河，争夺主动。'),
    ],
    endComment: '单提马兑河段完成。',
  },
  {
    id: 'end-wuliu-jianhua',
    title: '五六炮简化',
    summary: '五六炮出车占肋后，黑兑六路炮简化。',
    prefix: [
      'h2-e2',
      'h9-g7',
      'b2-d2',
      'b9-c7',
      'b0-c2',
      'g6-g5',
      'h0-g2',
      'a9-a8',
      'i0-h0',
      'a8-d8',
    ],
    plies: [
      b('h0-h4', '升巡河车护中。'),
      b('d8-d2', '兑六路炮，简化。'),
      b('a0-a1', '起横车，保持弹性。'),
      b('g5-g4', '冲卒争先。'),
      b('e3-e4', '挺中兵，整理中路。'),
    ],
    endComment: '五六炮简化段完成。',
  },
  {
    id: 'end-wuqi-bingdu',
    title: '五七炮兵渡',
    summary: '五七炮后七兵渡河，练习过河兵手段。',
    prefix: [
      'h2-e2',
      'h9-g7',
      'b2-c2',
      'b9-c7',
      'b0-a2',
      'a9-a8',
      'h0-g2',
      'a8-d8',
      'c3-c4',
      'g6-g5',
    ],
    plies: [
      b('c4-c5', '冲七兵争先。'),
      b('c6-c5', '对兑。'),
      b('i0-h0', '出车，保持压力。'),
      b('d8-d2', '车下二路对攻。'),
      b('a0-b0', '车保，稳住阵脚。'),
    ],
    endComment: '五七炮兵渡段完成。',
  },
  {
    id: 'end-xunhepao-duizi',
    title: '巡河炮兑子',
    summary: '巡河炮挺兵后兑马，转入残局。',
    prefix: [
      'h2-e2',
      'h9-g7',
      'b0-c2',
      'b9-c7',
      'b2-b4',
      'g6-g5',
      'g3-g4',
      'g5-g4',
      'h0-g2',
      'a9-a8',
    ],
    plies: [
      b('i0-h0', '出车占线。'),
      b('a8-d8', '占肋。'),
      b('h0-h4', '升巡河车。'),
      b('d8-d2', '下二路骚扰。'),
      b('e3-e4', '挺中兵，稳住残局。'),
    ],
    endComment: '巡河炮兑子残段完成。',
  },
  {
    id: 'end-pingfeng-hengche',
    title: '屏风横车残段',
    summary: '屏风起横车占肋后，进车与挺兵转入紧凑残局。',
    prefix: [...PF, 'a9-a8', 'a0-a1', 'a8-d8', 'a1-d1', 'h7-g7'],
    plies: [
      b('d1-d7', '进车压马，施加压力。'),
      b('c7-b9', '退马暂避。'),
      b('e4-e5', '中兵跟上助攻。'),
      b('b9-a7', '马跳边，疏通底线。'),
      b('b2-b4', '炮巡河，稳住残局。'),
    ],
    endComment: '屏风横车残段完成。',
  },
  {
    id: 'end-liepao-duima',
    title: '列炮兑马简化',
    summary: '列炮出车后兑兵，练习残局前简化判断。',
    prefix: [
      'h2-e2',
      'b7-e7',
      'h0-g2',
      'b9-c7',
      'i0-h0',
      'h9-g7',
      'b0-c2',
      'a9-a8',
      'h0-h4',
      'a8-d8',
    ],
    plies: [
      b('g3-g4', '挺三兵争先。'),
      b('g6-g5', '对挺。'),
      b('g4-g5', '冲兑。'),
      b('d8-d2', '下二路对攻。'),
      b('e3-e4', '挺中兵，争夺主动。'),
    ],
    endComment: '列炮兑马简化段完成。',
  },
  {
    id: 'end-xianren-chuche',
    title: '仙人指路出车残',
    summary: '仙人指路出马后双方占肋，兑车进入少车残局。',
    prefix: ['g3-g4', 'h9-g7', 'h2-e2', 'b9-c7', 'b0-c2', 'a9-a8', 'h0-g2', 'a8-d8'],
    plies: [
      b('i0-i1', '起横车。'),
      b('d8-d2', '车下二路压马。'),
      b('i1-d1', '对肋保马。'),
      b('d2-d1', '兑车。'),
      b('a0-a1', '起另一车，进入少车运筹。'),
    ],
    endComment: '仙人指路出车残段完成。',
  },
  {
    id: 'end-feixiang-chuche',
    title: '飞相出车残段',
    summary: '飞相出马后出车占线，练习稳健残局节奏。',
    prefix: ['g0-e2', 'h9-g7', 'b0-c2', 'b9-c7', 'h0-g2', 'a9-a8', 'g3-g4', 'g6-g5'],
    plies: [
      b('i0-h0', '出直车。'),
      b('a8-d8', '占肋。'),
      b('b2-b4', '炮巡河。'),
      b('g5-g4', '冲卒兑兵。'),
      b('a0-a1', '起横车，控制肋道。'),
    ],
    endComment: '飞相出车残段完成。',
  },
]

const openSrc = emitPack(
  'opening',
  'EXTRA_OPENING_LINES',
  'op',
  openings,
  '/**\n * 开局扩展包：凑满 30 课。一律 lineFromPath，主线展全设想，无「也可」空支。\n */',
)
const midSrc = emitPack(
  'middlegame',
  'EXTRA_MIDDLEGAME_LINES',
  'mid',
  mids,
  '/**\n * 中局扩展包：凑满 30 课。prefix 推局面，plies 展全短计划。\n */',
)
const endSrc = emitPack(
  'endgame',
  'EXTRA_ENDGAME_LINES',
  'eg',
  ends,
  '/**\n * 残局扩展包：凑满 30 课。实战截段为主；不硬凑杀/凑和。\n */',
)

writeFileSync('src/study/extraOpenings.ts', openSrc)
writeFileSync('src/study/extraMiddlegame.ts', midSrc)
writeFileSync('src/study/extraEndgame.ts', endSrc)
console.log('OK openings', openings.length, 'mids', mids.length, 'ends', ends.length)
