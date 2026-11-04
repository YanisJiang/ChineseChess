import { end } from './bookUtil'
import type { StudyLine } from './types'

/** 残局样例 2 课 */
export const ENDGAME_LINES: StudyLine[] = [
  {
    id: 'end-bing-zhuijiang',
    phase: 'endgame',
    title: '低兵逼将',
    summary: '单兵对将：中兵逐步逼近，体会残局进兵节奏。',
    startFen: '4k4/9/9/9/4P4/9/9/9/9/4K4 w',
    root: {
      comment: '红中兵对黑将。目标：进兵限制将门。',
      moves: [
        {
          uci: 'e5-e6',
          main: true,
          label: '兵五进一',
          benefit: '兵靠近对方，压缩将的活动空间。',
          next: {
            moves: [
              {
                uci: 'e9-d9',
                main: true,
                label: '将5平4',
                benefit: '躲向一侧。',
                next: {
                  moves: [
                    {
                      uci: 'e6-e7',
                      main: true,
                      label: '兵五进一',
                      benefit: '继续跟进，残局要敢进兵。',
                      next: end('低兵逼将入门完成。可自行续演。'),
                    },
                  ],
                },
              },
              {
                uci: 'e9-f9',
                label: '将5平6',
                benefit: '另一侧躲避，道理相同。',
                next: end(),
              },
            ],
          },
        },
      ],
    },
  },
  {
    id: 'end-che-jianjiang',
    phase: 'endgame',
    title: '车控将门',
    summary: '单车对将：用车进逼，体会车的直线控制。',
    startFen: '4k4/9/9/9/9/9/9/9/4R4/4K4 w',
    root: {
      comment: '红车对黑将。车可沿线将军或限制将位。',
      moves: [
        {
          uci: 'e1-e8',
          main: true,
          label: '车五进七',
          benefit: '进车叫将，逼将离中。',
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
                      uci: 'e8-d8',
                      main: true,
                      label: '车五平六',
                      benefit: '跟将平车，继续控制。',
                      next: end('车控将门入门完成。'),
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          uci: 'e1-e2',
          label: '车五进一',
          benefit: '也可缓进一步再攻。',
          next: end(),
        },
      ],
    },
  },
]
