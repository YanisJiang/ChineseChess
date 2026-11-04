import type { BookNode, Opening } from './types'

/** 叶节点：本线学完 */
function end(comment?: string): BookNode {
  return {
    comment: comment ?? '本线告一段落，可重学或换谱。',
    moves: [],
  }
}

/**
 * V1 样例：两条开局入门主线（后续可扩到 8～15）。
 * 着法均为引擎坐标 uci，已按合法着编写。
 */
export const OPENINGS: Opening[] = [
  {
    id: 'zhongpao-pingfeng',
    title: '中炮对屏风马',
    summary: '红摆中炮抢中路，黑双马护中兵，最常见的开局对抗。',
    root: {
      comment: '开局：红方可选择中炮、进马或挺兵。本谱学中炮正变。',
      moves: [
        {
          uci: 'h2-e2',
          main: true,
          label: '炮二平五',
          benefit: '炮镇中路，瞄准黑中兵与将门，先手取势。',
          next: {
            comment: '黑方常见应以屏风马或顺/列炮。',
            moves: [
              {
                uci: 'h9-g7',
                main: true,
                label: '马8进7',
                benefit: '跳马护中兵，准备开局成屏风马，稳健。',
                next: {
                  comment: '红继续动马，疏通子力。',
                  moves: [
                    {
                      uci: 'b0-c2',
                      main: true,
                      label: '马二进三',
                      benefit: '右马出动，支援中路并准备出车。',
                      next: {
                        moves: [
                          {
                            uci: 'b9-c7',
                            main: true,
                            label: '马2进3',
                            benefit: '双马成形，中兵有根，屏风马成型。',
                            next: {
                              moves: [
                                {
                                  uci: 'h0-g2',
                                  main: true,
                                  label: '马八进七',
                                  benefit: '左马跟上，双马对称，利于出横车或挺兵。',
                                  next: {
                                    moves: [
                                      {
                                        uci: 'g6-g5',
                                        main: true,
                                        label: '兵7进1',
                                        benefit: '挺兵活马，并限制红方右马活动空间。',
                                        next: end(
                                          '屏风马基本阵型已立。可重学或换「顺炮」对比。',
                                        ),
                                      },
                                      {
                                        uci: 'c6-c5',
                                        label: '兵3进1',
                                        benefit: '另一侧挺兵，同样活马，略偏对右翼。',
                                        next: end(),
                                      },
                                    ],
                                  },
                                },
                                {
                                  uci: 'g3-g4',
                                  label: '兵七进一',
                                  benefit: '先挺兵争先，再决定进哪一匹马。',
                                  next: end('变着：先挺兵的节奏，可自行对照主线。'),
                                },
                              ],
                            },
                          },
                          {
                            uci: 'g6-g5',
                            label: '兵7进1',
                            benefit: '先挺兵再跳马，也可，但双马成形稍慢。',
                            next: end(),
                          },
                        ],
                      },
                    },
                    {
                      uci: 'h0-g2',
                      label: '马八进七',
                      benefit: '先出左马，也常见；注意与右马的配合。',
                      next: {
                        moves: [
                          {
                            uci: 'b9-c7',
                            main: true,
                            label: '马2进3',
                            benefit: '补齐屏风，中路有根。',
                            next: end('先跳左马的变例到此。'),
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                uci: 'b9-c7',
                label: '马2进3',
                benefit: '先跳右马，也可形成屏风，只是次序不同。',
                next: end('先跳右马的次序，可与主线对照。'),
              },
              {
                uci: 'h7-e7',
                label: '炮8平5',
                benefit: '对攻意味更浓，转成顺炮，另见「顺炮」谱。',
                next: end('已转入顺炮意图，建议改选顺炮谱细学。'),
              },
            ],
          },
        },
      ],
    },
  },
  {
    id: 'shunpao',
    title: '顺炮',
    summary: '黑也架中炮对打，对攻速度快，适合体会主动开炮的味道。',
    root: {
      comment: '红仍先中炮，黑顺架中炮对攻。',
      moves: [
        {
          uci: 'h2-e2',
          main: true,
          label: '炮二平五',
          benefit: '同样抢中路，迫使黑方表态。',
          next: {
            moves: [
              {
                uci: 'h7-e7',
                main: true,
                label: '炮8平5',
                benefit: '顺炮对攻，子力对称，比拼谁先出车抢线。',
                next: {
                  moves: [
                    {
                      uci: 'b0-c2',
                      main: true,
                      label: '马二进三',
                      benefit: '出马护中炮，并准备出右车。',
                      next: {
                        moves: [
                          {
                            uci: 'h9-g7',
                            main: true,
                            label: '马8进7',
                            benefit: '跳马护炮，顺炮横车或直车的基础。',
                            next: {
                              moves: [
                                {
                                  uci: 'i0-i1',
                                  main: true,
                                  label: '车九进一',
                                  benefit: '横车启动，准备过宫或平肋助攻，顺炮典型节奏。',
                                  next: end(
                                    '顺炮横车起手完成。可重学，或回去对比屏风马。',
                                  ),
                                },
                                {
                                  uci: 'h0-g2',
                                  label: '马八进七',
                                  benefit: '先跳左马也稳，但横车出手稍慢。',
                                  next: end(),
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
            ],
          },
        },
      ],
    },
  },
]

export function getOpening(id: string): Opening | undefined {
  return OPENINGS.find((o) => o.id === id)
}
