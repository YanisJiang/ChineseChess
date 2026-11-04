import { end } from './bookUtil'
import type { StudyLine } from './types'

/** 残局样例（约 4 课） */
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
    summary: '单车对将：先平车叫将，再跟将控线。',
    // 车在肋道、帅偏一侧，避免开课前已将军或将帅对面
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
    id: 'end-shuangbing',
    phase: 'endgame',
    title: '双兵逼宫',
    summary: '双兵对将：两路推进，体会残局分进合击。',
    startFen: '4k4/9/9/9/3P1P3/9/9/9/9/5K3 w',
    root: {
      comment: '红双兵对黑将。先推进一兵，再跟另一兵。',
      moves: [
        {
          uci: 'd5-d6',
          main: true,
          label: '兵六进一',
          benefit: '先推进一路兵，压缩将位。',
          next: {
            moves: [
              {
                uci: 'e9-d9',
                main: true,
                label: '将5平4',
                benefit: '靠近来兵一侧。',
                next: {
                  moves: [
                    {
                      uci: 'f5-f6',
                      main: true,
                      label: '兵四进一',
                      benefit: '另一路兵跟上，形成夹击。',
                      next: end('双兵逼宫入门完成。'),
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          uci: 'f5-f6',
          label: '兵四进一',
          benefit: '也可先推另一侧。',
          next: end(),
        },
      ],
    },
  },
  {
    id: 'end-paobing',
    phase: 'endgame',
    title: '炮兵巧胜',
    summary: '炮兵对将：炮控线、兵逼近，体会残局配合。',
    // 将偏肋，避免开课即被中炮将军
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
