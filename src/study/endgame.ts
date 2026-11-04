import { end } from './bookUtil'
import type { StudyLine } from './types'

/**
 * 残局约 8 课：以开局杀到后的实战截段为主；孤子教学构图最多 2 课作独立补。
 */
export const ENDGAME_LINES: StudyLine[] = [
  // end-duima-tingbing / 屏风续段 → src/study/pingfengWeb.ts
  // —— 实战截段（开局延伸）——
  {
    id: 'end-leidao-jinche',
    phase: 'endgame',
    title: '肋车进逼',
    summary: '屏风右横车占肋、黑车9平8后，红可进车或挺中兵紧逼。',
    startFen:
      'r1bak1br1/4a4/1cn3nc1/p1p1p3p/6p2/9/P1P1P1P1P/1CN1C1N2/3R5/R1BAKAB2 w',
    root: {
      comment: '红车在肋道，黑已平车。体会残局段进车节奏。',
      moves: [
        {
          uci: 'd1-d7',
          main: true,
          label: '车六进六',
          benefit: '进车压马，施加压力。',
          next: {
            moves: [
              {
                      uci: 'c7-b9',
                      main: true,
                      label: '马3退2',
                      benefit: '退马暂避。',
                next: {
                  moves: [
                    {
                      uci: 'e3-e4',
                      main: true,
                      label: '兵五进一',
                      benefit: '中兵跟上助攻。',
                      next: end('肋车进逼入门完成。'),
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          uci: 'e3-e4',
          label: '兵五进一',
          benefit: '也可先挺中兵。',
          next: end(),
        },
      ],
    },
  },
  {
    id: 'end-shunpao-paoda',
    phase: 'endgame',
    title: '顺炮肋车打兵',
    summary: '顺炮横车平肋、黑补士后，红可打中兵转入残局争夺。',
    startFen:
      'rnbak1b1r/4a4/1c2c1n2/p1p1p3p/6p2/9/P1P1P1P1P/1CN1C4/3R5/R1BAKABN1 w',
    root: {
      comment: '肋车在位。可打中兵或出马。',
      moves: [
        {
          uci: 'e2-e6',
          main: true,
          label: '炮五进四',
          benefit: '打中兵得实利，残局常用手段。',
          next: {
            moves: [
              {
                uci: 'g7-e6',
                main: true,
                label: '马7进5',
                benefit: '兑炮消势。',
                next: {
                  moves: [
                    {
                      uci: 'h0-g2',
                      main: true,
                      label: '马二进三',
                      benefit: '出马巩固，准备续攻。',
                      next: end('顺炮肋车打兵入门完成。'),
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          uci: 'h0-g2',
          label: '马二进三',
          benefit: '也可先出马。',
          next: end(),
        },
      ],
    },
  },
  {
    id: 'end-liepao-zhongbing',
    phase: 'endgame',
    title: '列炮挺中兵',
    summary: '列炮双方出马后，红挺中兵对攻——中残常见节奏。',
    startFen:
      'r1bakab1r/9/2n1c1nc1/p1p1p1p1p/9/9/P1P1P1P1P/1CN1C1N2/9/R1BAKAB1R w',
    root: {
      comment: '列手炮阵型已立。挺中兵打开对攻。',
      moves: [
        {
          uci: 'e3-e4',
          main: true,
          label: '兵五进一',
          benefit: '中兵挺进，对攻意味浓。',
          next: {
            moves: [
              {
                uci: 'e6-e5',
                main: true,
                label: '兵5进1',
                benefit: '对挺中卒。',
                next: {
                  moves: [
                    {
                      uci: 'i0-i1',
                      main: true,
                      label: '车一进一',
                      benefit: '起横车配合中攻。',
                      next: end('列炮挺中兵入门完成。'),
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          uci: 'i0-i1',
          label: '车一进一',
          benefit: '也可先起横车。',
          next: end(),
        },
      ],
    },
  },
  {
    id: 'end-zubipao-chuma',
    phase: 'endgame',
    title: '卒底炮出马',
    summary: '仙人指路对卒底炮后，红出马巩固并准备对攻。',
    startFen:
      'r1bakabnr/9/2n3cc1/p1p1p1p1p/9/6P2/P1P1P3P/1C2C4/9/RNBAKABNR w',
    root: {
      comment: '黑卒底炮瞄三线。红先出马护中。',
      moves: [
        {
          uci: 'b0-c2',
          main: true,
          label: '马八进七',
          benefit: '出马护中炮，兼顾左翼。',
          next: {
            moves: [
              {
                uci: 'h9-i7',
                main: true,
                label: '马8进9',
                benefit: '边马出动（7路有己方炮）。',
                next: {
                  moves: [
                    {
                      uci: 'h0-g2',
                      main: true,
                      label: '马二进三',
                      benefit: '双马成形，进入中残运筹。',
                      next: end('卒底炮出马入门完成。'),
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          uci: 'h0-g2',
          label: '马二进三',
          benefit: '也可先出右马。',
          next: end(),
        },
      ],
    },
  },
  {
    id: 'end-guogong-chuma',
    phase: 'endgame',
    title: '过宫炮出马',
    summary: '过宫炮骨架后出右马，转入稳健中残缠斗。',
    startFen:
      'rnbakab1r/9/1c4nc1/p1p1p3p/6p2/9/P1P1P1P1P/1CNC5/9/R1BAKABNR w',
    root: {
      comment: '炮已过宫，黑挺7卒。红出马完善阵型。',
      moves: [
        {
          uci: 'h0-g2',
          main: true,
          label: '马二进三',
          benefit: '右马出动，配合过宫炮。',
          next: {
            moves: [
              {
                uci: 'b9-c7',
                main: true,
                label: '马2进3',
                benefit: '出马。',
                next: {
                  moves: [
                    {
                      uci: 'i0-i1',
                      main: true,
                      label: '车一进一',
                      benefit: '起横车，准备平肋或巡河。',
                      next: end('过宫炮出马入门完成。'),
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          uci: 'g3-g4',
          label: '兵三进一',
          benefit: '也可先挺兵。',
          next: end(),
        },
      ],
    },
  },
  // —— 独立经典（孤子教学，≤2）——
  {
    id: 'end-che-jianjiang',
    phase: 'endgame',
    title: '车控将门',
    summary: '单车对将：先平车叫将，再跟将控线（经典补课）。',
    startFen: '4k4/9/9/9/9/9/9/9/3R5/5K3 w',
    root: {
      comment: '红车在六路，黑将在中路，尚未将军。先平车叫将。',
      moves: [
        {
          uci: 'd1-e1',
          main: true,
          label: '车六平五',
          benefit: '平中叫将，逼将离中。',
          next: {
            moves: [
              {
                uci: 'e9-d9',
                main: true,
                label: '将5平4',
                benefit: '避将。',
                next: {
                  moves: [
                    {
                      uci: 'e1-d1',
                      main: true,
                      label: '车五平六',
                      benefit: '跟将平车，继续控制将门。',
                      next: end('车控将门入门完成。'),
                    },
                    {
                      uci: 'e1-e8',
                      label: '车五进七',
                      benefit: '也可进车贴将紧逼。',
                      next: end(),
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          uci: 'd1-d2',
          label: '车六进一',
          benefit: '也可先抬车再攻。',
          next: end(),
        },
      ],
    },
  },
  {
    id: 'end-paobing',
    phase: 'endgame',
    title: '炮兵巧胜',
    summary: '炮兵对将：炮控线、兵逼近（经典补课）。',
    startFen: '3k5/9/4C4/9/4P4/9/9/9/9/5K3 w',
    root: {
      comment: '红中炮中兵对黑将。先推兵，再平炮跟将。',
      moves: [
        {
          uci: 'e5-e6',
          main: true,
          label: '兵五进一',
          benefit: '兵靠近，增强压力。',
          next: {
            moves: [
              {
                uci: 'd9-e9',
                main: true,
                label: '将4平5',
                benefit: '回中暂避。',
                next: {
                  moves: [
                    {
                      uci: 'e7-d7',
                      main: true,
                      label: '炮五平六',
                      benefit: '炮转移控肋，继续限制将门。',
                      next: end('炮兵配合入门完成。'),
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  },
]
