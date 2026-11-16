# 中国象棋

浏览器里可玩的中国象棋：自带规则引擎、热座双人、人机对战、学棋与陪练跟谱。技术栈为 Vite + React + TypeScript。

仓库：<https://github.com/YanisJiang/ChineseChess>

## 功能

- **热座双人**：同机轮流执红执黑
- **人机**：可选电脑执红/黑与难度；可选开局谱着提示
- **学棋**：按开局 / 中局 / 残局课谱练习（各阶段课量较充足）
- **陪练跟谱**：按谱走子，离谱后可按局面转谱或改人机
- **棋盘**：格点落子、走子动画、将死/困毙等结果判定
- **局面串**：导入 / 导出 FEN；可导出棋谱文本
- **布局**：宽屏侧栏；手机竖屏底栏着法 +「更多」收纳设置（不单独适配横屏）

## 环境要求

- Node.js 18+（建议 LTS）
- 包管理：npm

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开终端提示的本地地址（一般为 `http://127.0.0.1:5173/`）。

其它命令：

```bash
npm test          # 单测（vitest）
npm run build     # 类型检查 + 生产构建
npm run preview   # 预览构建产物
```

## 目录结构（简要）

```
src/
  engine/     # 棋规、局面、着法生成与校验
  ai/         # 搜索与 Web Worker 人机
  study/      # 学棋 / 陪练课谱与局面索引
  record/     # 中文着法与导出
  ui/         # 棋盘与面板组件
  App.tsx     # 模式切换与主界面
```

## 说明

- 课谱数据在 `src/study/`；加谱或改谱时请遵守仓库内学棋谱质量约定（见 `.cursor/skills/study-line-quality`）。
- 对话开发用的 `conv/...` git 标签多为本地回退点，默认未推送到远端。

## License

私有练习项目（`package.json` 中 `"private": true`）。若需开源协议，可再补 LICENSE。
