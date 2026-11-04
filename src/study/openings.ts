import { end } from './bookUtil'
import type { StudyLine } from './types'

/** 开局入门包（约 15 条） */
export const OPENING_LINES: StudyLine[] = [
  {
    id: 'zhongpao-pingfeng',
    phase: 'opening',
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
                      label: '马八进七',
                      benefit: '左马出动，支援中路并准备出车。',
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
                                  label: '马二进三',
                                  benefit: '右马跟上，双马对称，利于出横车或挺兵。',
                                  next: {
                                    moves: [
                                      {
                                        uci: 'g6-g5',
                                        main: true,
                                        label: '兵7进1',
                                        benefit: '挺兵活马，并限制红方右马活动空间。',
                                        next: end(
                                          '屏风马基本阵型已立。可转谱续走中局，或重学/换谱。',
                                        ),
                                      },
                                      {
                                        uci: 'c6-c5',
                                        label: '兵3进1',
                                        benefit: '另一侧挺兵，同样活马。',
                                        next: end(),
                                      },
                                    ],
                                  },
                                },
                                {
                                  uci: 'g3-g4',
                                  label: '兵三进一',
                                  benefit: '先挺兵争先，再决定进哪一匹马。',
                                  next: end('变着：先挺兵的节奏。'),
                                },
                              ],
                            },
                          },
                          {
                            uci: 'g6-g5',
                            label: '兵7进1',
                            benefit: '先挺兵再跳马，也可。',
                            next: end(),
                          },
                        ],
                      },
                    },
                    {
                      uci: 'h0-g2',
                      label: '马二进三',
                      benefit: '先出右马，也常见。',
                      next: {
                        moves: [
                          {
                            uci: 'b9-c7',
                            main: true,
                            label: '马2进3',
                            benefit: '补齐屏风。',
                            next: end('先跳右马的变例到此。'),
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
                benefit: '先跳右马，次序不同。',
                next: end(),
              },
              {
                uci: 'h7-e7',
                label: '炮8平5',
                benefit: '转顺炮，另见「顺炮」谱。',
                next: end('建议改选顺炮谱细学。'),
              },
            ],
          },
        },
      ],
    },
  },
  {
    id: 'shunpao',
    phase: 'opening',
    title: '顺炮',
    summary: '黑也架中炮对打，对攻速度快。',
    root: {
      comment: '红中炮，黑顺架中炮对攻。',
      moves: [
        {
          uci: 'h2-e2',
          main: true,
          label: '炮二平五',
          benefit: '抢中路，迫使黑方表态。',
          next: {
            moves: [
              {
                uci: 'h7-e7',
                main: true,
                label: '炮8平5',
                benefit: '顺炮对攻，比拼出车抢线。',
                next: {
                  moves: [
                    {
                      uci: 'b0-c2',
                      main: true,
                      label: '马八进七',
                      benefit: '出马护中炮，准备出左车。',
                      next: {
                        moves: [
                          {
                            uci: 'h9-g7',
                            main: true,
                            label: '马8进7',
                            benefit: '跳马护炮。',
                            next: {
                              moves: [
                                {
                                  uci: 'i0-i1',
                                  main: true,
                                  label: '车一进一',
                                  benefit: '右横车启动，顺炮典型节奏。',
                                  next: end('顺炮横车起手完成。'),
                                },
                                {
                                  uci: 'h0-g2',
                                  label: '马二进三',
                                  benefit: '先跳右马也稳。',
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
  {
    id: 'liepao',
    phase: 'opening',
    title: '中炮对列炮',
    summary: '黑用另一侧中炮对打（列手炮），对攻更尖锐。',
    root: {
      comment: '红中炮后，黑架右中炮列打。',
      moves: [
        {
          uci: 'h2-e2',
          main: true,
          label: '炮二平五',
          benefit: '抢中路。',
          next: {
            moves: [
              {
                uci: 'b7-e7',
                main: true,
                label: '炮2平5',
                benefit: '列手炮对攻，子力不对称。',
                next: {
                  moves: [
                    {
                      uci: 'b0-c2',
                      main: true,
                      label: '马八进七',
                      benefit: '出马护中。',
                      next: {
                        moves: [
                          {
                            uci: 'b9-c7',
                            main: true,
                            label: '马2进3',
                            benefit: '出马护炮。',
                            next: {
                              moves: [
                                {
                                  uci: 'h0-g2',
                                  main: true,
                                  label: '马二进三',
                                  benefit: '双马出动。',
                                  next: end('列炮对抗骨架已立。'),
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
  {
    id: 'xianren-zhilu',
    phase: 'opening',
    title: '仙人指路',
    summary: '红先挺三兵，可转中炮或飞相，灵活多变。',
    root: {
      comment: '仙人指路：先挺兵观察黑方。',
      moves: [
        {
          uci: 'g3-g4',
          main: true,
          label: '兵三进一',
          benefit: '活马争先，保留多种计划。',
          next: {
            moves: [
              {
                uci: 'g6-g5',
                main: true,
                label: '兵7进1',
                benefit: '对挺，稳健。',
                next: {
                  moves: [
                    {
                      uci: 'h2-e2',
                      main: true,
                      label: '炮二平五',
                      benefit: '转中炮。',
                      next: {
                        moves: [
                          {
                            uci: 'h9-g7',
                            main: true,
                            label: '马8进7',
                            benefit: '跳马护中。',
                            next: end('仙人指路转中炮入门完成。'),
                          },
                        ],
                      },
                    },
                    {
                      uci: 'g0-e2',
                      label: '相三进五',
                      benefit: '飞相走柔式对兵。',
                      next: end('对兵飞相变例到此。'),
                    },
                  ],
                },
              },
              {
                uci: 'h7-e7',
                label: '炮8平5',
                benefit: '黑直接还中炮，转入对攻节奏。',
                next: {
                  moves: [
                    {
                      uci: 'b0-c2',
                      main: true,
                      label: '马八进七',
                      benefit: '出马护中，承接对攻。',
                      next: end('仙人指路遇还中炮：出马护中完成，可转顺/列炮专谱。'),
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
  {
    id: 'feixiang',
    phase: 'opening',
    title: '飞相局',
    summary: '红先飞相，先手柔和，练阵型。',
    root: {
      comment: '飞相局：先补中相。',
      moves: [
        {
          uci: 'g0-e2',
          main: true,
          label: '相三进五',
          benefit: '先固中防，再徐图进取。',
          next: {
            moves: [
              {
                uci: 'g6-g5',
                main: true,
                label: '兵7进1',
                benefit: '挺兵活马。',
                next: {
                  moves: [
                    {
                      uci: 'b0-c2',
                      main: true,
                      label: '马八进七',
                      benefit: '出马，保持弹性。',
                      next: {
                        moves: [
                          {
                            uci: 'h9-g7',
                            main: true,
                            label: '马8进7',
                            benefit: '对称发展。',
                            next: end('飞相起手骨架完成。'),
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
  {
    id: 'qima',
    phase: 'opening',
    title: '起马局',
    summary: '红先跳马，不急架炮。',
    root: {
      comment: '起马局：先出马再定阵。',
      moves: [
        {
          uci: 'b0-c2',
          main: true,
          label: '马八进七',
          benefit: '先出左马。',
          next: {
            moves: [
              {
                uci: 'h9-g7',
                main: true,
                label: '马8进7',
                benefit: '对起马。',
                next: {
                  moves: [
                    {
                      uci: 'g3-g4',
                      main: true,
                      label: '兵三进一',
                      benefit: '挺兵活右马。',
                      next: {
                        moves: [
                          {
                            uci: 'g6-g5',
                            main: true,
                            label: '兵7进1',
                            benefit: '对挺。',
                            next: end('起马对兵入门完成。'),
                          },
                        ],
                      },
                    },
                    {
                      uci: 'h2-e2',
                      label: '炮二平五',
                      benefit: '转中炮，打开中路攻势。',
                      next: {
                        moves: [
                          {
                            uci: 'b9-c7',
                            main: true,
                            label: '马2进3',
                            benefit: '出马护中，承接中炮压力（屏风向）。',
                            next: end('起马转中炮后出马护中完成。'),
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
  {
    id: 'guogong-pao',
    phase: 'opening',
    title: '过宫炮',
    summary: '红炮过宫，偏稳健缠斗。',
    root: {
      comment: '过宫炮：炮二平六。',
      moves: [
        {
          uci: 'h2-d2',
          main: true,
          label: '炮二平六',
          benefit: '炮过宫控制肋线，伺机攻士角。',
          next: {
            moves: [
              {
                uci: 'h9-g7',
                main: true,
                label: '马8进7',
                benefit: '正常出子。',
                next: {
                  moves: [
                    {
                      uci: 'b0-c2',
                      main: true,
                      label: '马八进七',
                      benefit: '出马配合过宫炮。',
                      next: {
                        moves: [
                          {
                            uci: 'g6-g5',
                            main: true,
                            label: '兵7进1',
                            benefit: '挺兵活马。',
                            next: end('过宫炮入门完成。'),
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
  {
    id: 'shijiao-pao',
    phase: 'opening',
    title: '士角炮',
    summary: '红炮平七瞄士角，现代常见布局。',
    root: {
      comment: '士角炮：炮八平七。',
      moves: [
        {
          uci: 'b2-c2',
          main: true,
          label: '炮八平七',
          benefit: '炮踞士角，压制黑右马并支援挺兵。',
          next: {
            moves: [
              {
                uci: 'h9-g7',
                main: true,
                label: '马8进7',
                benefit: '先出左马。',
                next: {
                  moves: [
                    {
                      uci: 'b0-a2',
                      main: true,
                      label: '马八进九',
                      benefit: '边马出动，配合士角炮。',
                      next: {
                        moves: [
                          {
                            uci: 'g6-g5',
                            main: true,
                            label: '兵7进1',
                            benefit: '挺兵。',
                            next: end('士角炮入门完成。'),
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
  {
    id: 'fangongma',
    phase: 'opening',
    title: '中炮对反宫马',
    summary: '黑跳里马护中，用反宫马对抗中炮。',
    root: {
      comment: '红中炮，黑走反宫马（马2进3再炮2平4一类）。',
      moves: [
        {
          uci: 'h2-e2',
          main: true,
          label: '炮二平五',
          benefit: '抢中路。',
          next: {
            moves: [
              {
                uci: 'b7-d7',
                main: true,
                label: '炮2平4',
                benefit: '先平士角炮，再跳马成反宫马。',
                next: {
                  moves: [
                    {
                      uci: 'b0-c2',
                      main: true,
                      label: '马八进七',
                      benefit: '出马。',
                      next: {
                        moves: [
                          {
                            uci: 'b9-c7',
                            main: true,
                            label: '马2进3',
                            benefit: '马进3路，反宫马成形。',
                            next: {
                              moves: [
                                {
                                  uci: 'h0-g2',
                                  main: true,
                                  label: '马二进三',
                                  benefit: '双马出动。',
                                  next: end('反宫马对抗入门完成。'),
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
  {
    id: 'zhongpao-sanbing',
    phase: 'opening',
    title: '中炮进三兵',
    summary: '中炮后先挺三兵，加快右翼节奏。',
    root: {
      comment: '中炮后进三兵，常见攻屏风手段之一。',
      moves: [
        {
          uci: 'h2-e2',
          main: true,
          label: '炮二平五',
          benefit: '中炮。',
          next: {
            moves: [
              {
                uci: 'h9-g7',
                main: true,
                label: '马8进7',
                benefit: '屏风意图。',
                next: {
                  moves: [
                    {
                      uci: 'g3-g4',
                      main: true,
                      label: '兵三进一',
                      benefit: '先挺兵争右翼空间。',
                      next: {
                        moves: [
                          {
                            uci: 'b9-c7',
                            main: true,
                            label: '马2进3',
                            benefit: '双马成形。',
                            next: {
                              moves: [
                                {
                                  uci: 'h0-g2',
                                  main: true,
                                  label: '马二进三',
                                  benefit: '马跟兵后，阵型协调。',
                                  next: end('中炮进三兵入门完成。'),
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
  {
    id: 'jinbing',
    phase: 'opening',
    title: '进兵局（对兵）',
    summary: '双方互挺三/七兵，再决定中炮或飞相。',
    root: {
      comment: '进兵局：红兵三进一，黑对挺。',
      moves: [
        {
          uci: 'g3-g4',
          main: true,
          label: '兵三进一',
          benefit: '挺兵。',
          next: {
            moves: [
              {
                uci: 'c6-c5',
                main: true,
                label: '兵3进1',
                benefit: '对挺另一侧，交错争先。',
                next: {
                  moves: [
                    {
                      uci: 'h2-e2',
                      main: true,
                      label: '炮二平五',
                      benefit: '转中炮。',
                      next: {
                        moves: [
                          {
                            uci: 'h9-g7',
                            main: true,
                            label: '马8进7',
                            benefit: '出马。',
                            next: end('进兵转中炮入门完成。'),
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                uci: 'g6-g5',
                label: '兵7进1',
                benefit: '同线对挺；细变见「仙人指路」谱。',
                next: end('转指：对称对挺请改学仙人指路。'),
              },
            ],
          },
        },
      ],
    },
  },
  {
    id: 'zhongpao-qibing',
    phase: 'opening',
    title: '中炮进七兵',
    summary: '中炮后先挺七兵，争左翼空间，常见攻屏风手段。',
    root: {
      comment: '中炮进七兵：先扩左翼再出马。',
      moves: [
        {
          uci: 'h2-e2',
          main: true,
          label: '炮二平五',
          benefit: '抢中路。',
          next: {
            moves: [
              {
                uci: 'h9-g7',
                main: true,
                label: '马8进7',
                benefit: '屏风意图。',
                next: {
                  moves: [
                    {
                      uci: 'c3-c4',
                      main: true,
                      label: '兵七进一',
                      benefit: '挺七兵争左翼，并活左马。',
                      next: {
                        moves: [
                          {
                            uci: 'b9-c7',
                            main: true,
                            label: '马2进3',
                            benefit: '双马成形。',
                            next: {
                              moves: [
                                {
                                  uci: 'b0-c2',
                                  main: true,
                                  label: '马八进七',
                                  benefit: '马跟兵后，阵型协调。',
                                  next: end('中炮进七兵入门完成。'),
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
  {
    id: 'sanbuhu',
    phase: 'opening',
    title: '中炮三步虎',
    summary: '中炮后出马再平车，三步内右车出动，节奏快。',
    root: {
      comment: '三步虎：炮、马、车快速出动。',
      moves: [
        {
          uci: 'h2-e2',
          main: true,
          label: '炮二平五',
          benefit: '中炮。',
          next: {
            moves: [
              {
                uci: 'h9-g7',
                main: true,
                label: '马8进7',
                benefit: '跳马。',
                next: {
                  moves: [
                    {
                      uci: 'h0-g2',
                      main: true,
                      label: '马二进三',
                      benefit: '出右马，为出车让路。',
                      next: {
                        moves: [
                          {
                            uci: 'b9-c7',
                            main: true,
                            label: '马2进3',
                            benefit: '对称出马。',
                            next: {
                              moves: [
                                {
                                  uci: 'i0-h0',
                                  main: true,
                                  label: '车一平二',
                                  benefit: '右车出动，三步虎成形。',
                                  next: end('中炮三步虎入门完成。'),
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
  {
    id: 'dantima',
    phase: 'opening',
    title: '中炮对单提马',
    summary: '黑只跳一侧马护中，阵型与屏风马不同。',
    root: {
      comment: '黑单提马：先马2进3，暂不跳左马。',
      moves: [
        {
          uci: 'h2-e2',
          main: true,
          label: '炮二平五',
          benefit: '抢中路。',
          next: {
            moves: [
              {
                uci: 'b9-c7',
                main: true,
                label: '马2进3',
                benefit: '单提右马护中兵。',
                next: {
                  moves: [
                    {
                      uci: 'b0-c2',
                      main: true,
                      label: '马八进七',
                      benefit: '出马。',
                      next: {
                        moves: [
                          {
                            uci: 'a9-a8',
                            main: true,
                            label: '车1进1',
                            benefit: '起横车，单提马常见续着。',
                            next: {
                              moves: [
                                {
                                  uci: 'h0-g2',
                                  main: true,
                                  label: '马二进三',
                                  benefit: '双马出动。',
                                  next: end('单提马对抗入门完成。'),
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
  {
    id: 'xianren-zubipao',
    phase: 'opening',
    title: '仙人指路对卒底炮',
    summary: '红挺三兵，黑平炮到7路瞄底，对攻意味浓。',
    root: {
      comment: '仙人指路后，黑卒底炮（炮2平7）对攻。',
      moves: [
        {
          uci: 'g3-g4',
          main: true,
          label: '兵三进一',
          benefit: '挺兵。',
          next: {
            moves: [
              {
                uci: 'b7-g7',
                main: true,
                label: '炮2平7',
                benefit: '卒底炮瞄红三路线，对攻。',
                next: {
                  moves: [
                    {
                      uci: 'h2-e2',
                      main: true,
                      label: '炮二平五',
                      benefit: '转中炮对攻。',
                      next: {
                        moves: [
                          {
                            uci: 'b9-c7',
                            main: true,
                            label: '马2进3',
                            benefit: '出马发展右翼。',
                            next: end('仙人指路对卒底炮入门完成。'),
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
