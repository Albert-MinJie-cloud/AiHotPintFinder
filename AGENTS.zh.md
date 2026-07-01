# 仓库指南

## 项目结构与模块组织

Monorepo 包含两个独立项目：`backend/`（Express + TypeScript + SQLite + Socket.IO）和 `frontend/`（React 18 + Vite + TypeScript + Tailwind CSS）。

后端 (`backend/src/`)：`index.ts`, `db.ts`, `routes/` (overview/keywords/hotspots/config/scrape), `services/` (scraper/deepseek/scheduler/mailer/trends), `socket.ts`。

前端 (`frontend/src/`)：`main.tsx` / `App.tsx`（React Router 入口），`components/layout/`（AppShell/Sidebar/TopBar），`components/overview/`（MetricCards/TrendChart/CategoryDonut/LiveHotList），`pages/`（OverviewPage/KeywordsPage/ConfigPage），`hooks/useSocket.ts`，`types/index.ts`。

## 构建、测试与开发命令

```bash
cd backend && npm run dev   # 端口 3001
cd frontend && npm run dev  # 端口 5173
```

| 命令            | 位置        | 说明                 |
| --------------- | ----------- | -------------------- |
| `npm run dev`   | `backend/`  | `tsx watch` 热重载   |
| `npm run build` | `backend/`  | TypeScript → `dist/` |
| `npm run dev`   | `frontend/` | Vite 开发服务器      |
| `npm run build` | `frontend/` | 类型检查 + 生产构建  |
| `npm run lint`  | `frontend/` | ESLint               |

未配置测试框架，建议后续引入 Vitest。

## 架构概览

三页面 SPA（`/`, `/keywords`, `/config`），React Router 路由，Express 后端，Socket.IO 实时推送。

**数据流水线**（定时任务 + AI）：

1. `scheduler.ts` 每 30 分钟采集，每日凌晨 2 点计算趋势
2. `scraper.ts` 调用 DeepSeek AI，提取分类/平台/相关性/情感分
3. 结果验证、评分后存入 SQLite，同步记录历史检索量
4. 新热点 Socket.IO 推送 + Nodemailer 邮件告警（QQ SMTP）

**核心依赖**：`react-router-dom`, `recharts`, `lucide-react`, `tailwindcss`；`express`, `better-sqlite3`, `socket.io`, `node-cron`, `nodemailer`, `axios`。

## 设计规范

## 编码风格

TypeScript strict 模式；ESLint flat config（前端）；组件 PascalCase，hook `use` 前缀，页面在 `pages/`；API `snake_case`，Socket.IO `camelCase`；2 空格缩进；`font-mono` / `font-display`。

## 环境配置

```bash
cp backend/.env.example backend/.env
```

必填：`DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `PORT`(3001), `FRONTEND_URL`。

## 数据库

SQLite WAL 模式：`keywords`、`hot_spots`（含 category/platform/trend/sentiment）、`notifications`、`historical_volume`（30 天数据）、`config`（键值配置）。
