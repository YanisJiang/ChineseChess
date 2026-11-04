import { end } from './bookUtil'
import type { StudyLine } from './types'

/** 中局样例 2 课 */
export const MIDDLEGAME_LINES: StudyLine[] = [
  {
    id: 'mid-paoda-zhongbing',
    phase: 'middlegame',
    title: '中炮打中兵',
    summary: '屏风马成型后，红炮打中兵争先——常见中局手段。',
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
    title: '横车占肋',
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
                      next: end('横车占肋入门完成。'),
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
