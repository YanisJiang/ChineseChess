import { end } from './bookUtil'
import type { StudyLine } from './types'

/**
 * 中局约 8 课：以开局延伸实战局面为主（多子），便于陪练 FEN/一手进谱挂上。
 */
export const MIDDLEGAME_LINES: StudyLine[] = [
  {
    id: 'mid-paoda-zhongbing',
    phase: 'middlegame',
    title: '中炮打中兵',
    summary: '中炮对屏风成型后，红炮打中兵争先——常见中局手段。',
    // 开局：炮二平五…兵7进1
    startFen:
      'r1bakab1r/9/1cn3nc1/p1p1p3p/6p2/9/P1P1P1P1P/1CN1C1N2/9/R1BAKAB1R w',
    root: {
      comment: '双方已成中炮对屏风。可打中兵先手，也可挺兵缓攻。',
      moves: [
        {
          uci: 'e2-e6',
          main: true,
          label: '炮五进四',
          benefit: '打中兵得实利，并逼黑应对。',
          next: {
            comment: '黑常弃还一马换炮。',
            moves: [
              {
                uci: 'g7-e6',
                main: true,
                label: '马7进5',
                benefit: '兑掉恶炮，稳住中路。',
                next: {
                  moves: [
                    {
                      uci: 'e3-e4',
                      main: true,
                      label: '兵五进一',
                      benefit: '中兵跟上，继续争中路空间。',
                      next: end('打中兵兑换后的典型续着到此。'),
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          uci: 'c3-c4',
          label: '兵七进一',
          benefit: '不急打兵，先挺兵扩地。',
          next: end('缓攻挺兵变着。'),
        },
      ],
    },
  },
  {
    id: 'mid-hengche-leidao',
    phase: 'middlegame',
    title: '顺炮横车占肋',
    summary: '顺炮结构中，红起横车再平肋——典型中局计划。',
    startFen:
      'rnbakab1r/9/1c2c1n2/p1p1p1p1p/9/9/P1P1P1P1P/1CN1C4/9/R1BAKABNR w',
    root: {
      comment: '顺炮双方出子后，红可起右横车抢肋道。',
      moves: [
        {
          uci: 'i0-i1',
          main: true,
          label: '车一进一',
          benefit: '横车启动，准备平肋或过宫。',
          next: {
            moves: [
              {
                uci: 'g6-g5',
                main: true,
                label: '兵7进1',
                benefit: '挺兵活马，常见应着。',
                next: {
                  moves: [
                    {
                      uci: 'i1-d1',
                      main: true,
                      label: '车一平六',
                      benefit: '占肋道，瞄准黑士角与将门。',
                      next: end('顺炮横车占肋入门完成。'),
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
    id: 'mid-xunhe-che',
    phase: 'middlegame',
    title: '屏风左横车',
    summary: '屏风成型后，红起左横车再平肋——常见中局抢先手段。',
    startFen:
      'r1bakab1r/9/1cn3nc1/p1p1p1p1p/9/9/P1P1P1P1P/1CN1C4/9/R1BAKABNR w',
    root: {
      comment: '中炮对屏风，双方双马已出。可起横车占肋。',
      moves: [
        {
          uci: 'a0-a1',
          main: true,
          label: '车九进一',
          benefit: '左车抬头，准备平肋。',
          next: {
            moves: [
              {
                uci: 'f9-e8',
                main: true,
                label: '士6进5',
                benefit: '补士固防，常见。',
                next: {
                  moves: [
                    {
                      uci: 'a1-d1',
                      main: true,
                      label: '车九平六',
                      benefit: '占肋道，瞄准士角与将门。',
                      next: end('屏风左横车入门完成。'),
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
          benefit: '也可先挺兵再出车。',
          next: end(),
        },
      ],
    },
  },
  {
    id: 'mid-pao-huan-ma',
    phase: 'middlegame',
    title: '盘头马争中',
    summary: '顺炮后挺中兵、出马再跳盘头马——常见中局构想。',
    startFen:
      'rnbakab1r/9/1c2c1n2/p1p1p1p1p/9/9/P1P1P1P1P/1CN1C4/9/R1BAKABNR w',
    root: {
      comment: '顺炮左马已出。先挺中兵，再出右马跳盘头。',
      moves: [
        {
          uci: 'e3-e4',
          main: true,
          label: '兵五进一',
          benefit: '挺中兵，为盘头马开路。',
          next: {
            moves: [
              {
                uci: 'b9-c7',
                main: true,
                label: '马2进3',
                benefit: '出马发展。',
                next: {
                  moves: [
                    {
                      uci: 'h0-g2',
                      main: true,
                      label: '马二进三',
                      benefit: '出右马。',
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
                                  uci: 'g2-e3',
                                  main: true,
                                  label: '马三进五',
                                  benefit: '马盘中路，争先取势。',
                                  next: end('盘头马争中入门完成。'),
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
          uci: 'i0-i1',
          label: '车一进一',
          benefit: '也可先起横车。',
          next: end(),
        },
      ],
    },
  },
  {
    id: 'mid-pingfeng-bing3',
    phase: 'middlegame',
    title: '屏风挺三兵',
    summary: '屏风成型后先挺三兵扩地，再决定出车或打兵。',
    startFen:
      'r1bakab1r/9/1cn3nc1/p1p1p3p/6p2/9/P1P1P1P1P/1CN1C1N2/9/R1BAKAB1R w',
    root: {
      comment: '中炮对屏风、黑已挺7卒。红可先挺三兵争先。',
      moves: [
        {
          uci: 'g3-g4',
          main: true,
          label: '兵三进一',
          benefit: '兑卒活马，开拓右翼。',
          next: {
            moves: [
              {
                uci: 'g5-g4',
                main: true,
                label: '兵7进1',
                benefit: '对兑，保持均势。',
                next: {
                  moves: [
                    {
                      uci: 'i0-i1',
                      main: true,
                      label: '车一进一',
                      benefit: '兑兵后再起横车，节奏稳健。',
                      next: end('屏风挺三兵入门完成。'),
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          uci: 'i0-h0',
          label: '车一平二',
          benefit: '也可先平车瞄炮。',
          next: end(),
        },
      ],
    },
  },
  {
    id: 'mid-liepao-chuche',
    phase: 'middlegame',
    title: '列炮起横车',
    summary: '中炮对列炮双马后，红起右横车抢先出车。',
    // 炮二平五 炮2平5 马八进七 马2进3 马二进三 马8进7
    startFen:
      'r1bakab1r/9/2n1c1nc1/p1p1p1p1p/9/9/P1P1P1P1P/1CN1C1N2/9/R1BAKAB1R w',
    root: {
      comment: '列手炮双方马已出。红可起横车或挺中兵。',
      moves: [
        {
          uci: 'i0-i1',
          main: true,
          label: '车一进一',
          benefit: '横车启动，列炮常见抢先手段。',
          next: {
            moves: [
              {
                uci: 'f9-e8',
                main: true,
                label: '士6进5',
                benefit: '补士固防。',
                next: {
                  moves: [
                    {
                      uci: 'i1-d1',
                      main: true,
                      label: '车一平六',
                      benefit: '平肋占线，准备进攻。',
                      next: end('列炮起横车入门完成。'),
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
          benefit: '也可先挺中兵对攻。',
          next: end(),
        },
      ],
    },
  },
  {
    id: 'mid-xianren-fazhan',
    phase: 'middlegame',
    title: '仙人指路转中炮',
    summary: '仙人指路转中炮后，红出马完成开局向中局过渡。',
    startFen:
      'rnbakab1r/9/1c4nc1/p1p1p3p/6p2/6P2/P1P1P3P/1C2C4/9/RNBAKABNR w',
    root: {
      comment: '已挺三兵并摆中炮，黑马护中。继续出马。',
      moves: [
        {
          uci: 'b0-c2',
          main: true,
          label: '马八进七',
          benefit: '左马出动，护中炮并准备出车。',
          next: {
            moves: [
              {
                uci: 'b9-c7',
                main: true,
                label: '马2进3',
                benefit: '出马均衡。',
                next: {
                  moves: [
                    {
                      uci: 'h0-g2',
                      main: true,
                      label: '马二进三',
                      benefit: '双马成形，转入中局。',
                      next: end('仙人指路转中炮发展完成。'),
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
    id: 'mid-feixiang-fazhan',
    phase: 'middlegame',
    title: '飞相出马',
    summary: '飞相局起手后出马挺兵，保持弹性阵型。',
    // 相三进五 兵7进1 马八进七 马8进7
    startFen:
      'rnbakab1r/9/1c4nc1/p1p1p3p/6p2/9/P1P1P1P1P/1CN1B2C1/9/R1BAKA1NR w',
    root: {
      comment: '飞相后双方出马。红可跳右马或挺兵。',
      moves: [
        {
          uci: 'h0-g2',
          main: true,
          label: '马二进三',
          benefit: '右马出动，阵型完整。',
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
                      uci: 'g3-g4',
                      main: true,
                      label: '兵三进一',
                      benefit: '挺兵争先，飞相常见后续。',
                      next: end('飞相出马入门完成。'),
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
]
