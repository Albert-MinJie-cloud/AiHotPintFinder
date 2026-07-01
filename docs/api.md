# Sentinel API 接口文档

> **Base URL**: `http://localhost:3001`  
> **Swagger UI**: `http://localhost:3001/api-docs`  
> 更新时间: 2026-07-01

---

## 目录

1. [健康检查](#1-健康检查)
2. [概览数据](#2-概览数据)
3. [搜索词管理](#3-搜索词管理)
4. [热点数据](#4-热点数据)
5. [通知配置](#5-通知配置)
6. [采集触发](#6-采集触发)
7. [数据源架构](#7-数据源架构)
8. [Socket.IO 实时事件](#8-socketio-实时事件)
9. [通用约定](#9-通用约定)

---

## 1. 健康检查

### `GET /api/health`

**响应 `200`**

```json
{
  "status": "ok",
  "timestamp": "2026-07-01T12:00:00.000Z"
}
```

---

## 2. 概览数据

### `GET /api/overview/stats`

获取仪表盘顶部 KPI 卡片数据（含环比变化）。

**响应 `200`**

```json
{
  "total_hotspots": 128,
  "total_change_percent": 12,
  "new_today": 45,
  "new_change_percent": 5,
  "avg_sentiment": 62.3,
  "sentiment_change": -2,
  "active_sources": 8,
  "sources_status": "stable"
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `total_hotspots` | `number` | 今日热点总数 |
| `total_change_percent` | `number` | 较昨日变化(%) |
| `new_today` | `number` | 今日新增话题数 |
| `new_change_percent` | `number` | 新增较昨日变化(%) |
| `avg_sentiment` | `number` | 平均情感指数 (0-100) |
| `sentiment_change` | `number` | 情感指数较昨日变化(%) |
| `active_sources` | `number` | 活跃数据源数 |
| `sources_status` | `"stable" \| "warning"` | 健康状态 |

---

### `GET /api/overview/trends`

逐小时热度趋势（折线图）。

**参数**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `keywords` | `string` | 否 | 逗号分隔的关键词列表，默认取前5个活跃词 |
| `date` | `string` | 否 | `YYYY-MM-DD`，默认今天 |

**响应 `200`**

```json
{
  "keywords": ["固态电池", "AI大模型"],
  "data": [
    { "hour": "08:00", "固态电池": 1250000, "AI大模型": 2100000 },
    { "hour": "09:00", "固态电池": 1380000, "AI大模型": 2450000 }
  ]
}
```

---

### `GET /api/overview/categories`

热点分类分布（环形图）。

**响应 `200`**

```json
{
  "categories": [
    { "name": "科技", "value": 45, "color": "#00d4ff" },
    { "name": "财经", "value": 32, "color": "#00ff41" },
    { "name": "娱乐", "value": 28, "color": "#ff6a00" },
    { "name": "民生", "value": 18, "color": "#ff0044" },
    { "name": "其他", "value": 5, "color": "#c0c0c0" }
  ],
  "total": 128
}
```

---

## 3. 搜索词管理

### `GET /api/keywords`

获取所有搜索词（按创建时间倒序）。

**响应 `200`**

```json
[
  {
    "id": "uuid-1",
    "keyword": "固态电池",
    "scope": "科技",
    "category": "新能源",
    "is_active": 1,
    "created_at": "2024-10-25 08:00:00",
    "last_checked_at": "2026-07-01 10:30:00"
  }
]
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | 唯一标识 |
| `keyword` | `string` | 搜索词 |
| `scope` | `string` | 搜索范围（可为空） |
| `category` | `string` | 分类标签（默认 `"综合"`） |
| `is_active` | `number` | `1`=监控中 `0`=已暂停 |
| `created_at` | `string` | 创建时间 |
| `last_checked_at` | `string \| null` | 最近采集时间 |

---

### `POST /api/keywords`

添加搜索词。

**请求体**

```json
{
  "keyword": "固态电池",
  "scope": "科技",
  "category": "新能源"
}
```

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `keyword` | `string` | 是 | — | 搜索词内容 |
| `scope` | `string` | 否 | `""` | 搜索范围 |
| `category` | `string` | 否 | `"综合"` | 分类标签 |

**响应 `201`** — 返回新创建的 Keyword 对象。  
**错误**: `400`（关键词为空）、`409`（已存在）

---

### `DELETE /api/keywords/:id`

删除搜索词，同时删除关联的热点和通知。

**路径参数**: `id` (string) — 搜索词 ID

**响应 `200`**: `{ "success": true }`  
**错误**: `404`

---

### `PATCH /api/keywords/:id/toggle`

切换启用/停用。

**路径参数**: `id` (string)

**响应 `200`** — 更新后的 Keyword 对象。  
**错误**: `404`

---

### `PATCH /api/keywords/toggle-all`

一键开启全部。

**响应 `200`**: `{ "success": true, "keywords": [...] }`

---

## 4. 热点数据

### `GET /api/hotspots`

获取热点列表，支持多维度筛选。

**查询参数**

| 参数 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|
| `keyword_id` | `string` | 否 | 按关键词 ID 精确匹配 | `?keyword_id=uuid-1` |
| `keyword` | `string` | 否 | 按关键词名称模糊搜索 | `?keyword=电池` |
| `platform` | `string` | 否 | 按数据来源平台筛选，逗号分隔多值 | `?platform=知乎,微博,掘金` |
| `limit` | `number` | 否 | 返回条数上限，默认 50 | `?limit=20` |

各筛选条件之间为 AND 关系。`platform` 支持 IN 查询，逗号分隔的多个值之间为 OR 关系。

**示例请求**

```
GET /api/hotspots?keyword=电池&platform=知乎,微博&limit=20
```

**响应 `200`**

```json
[
  {
    "id": "uuid-spot-1",
    "keyword_id": "uuid-1",
    "keyword": "固态电池",
    "title": "宁德时代发布固态电池量产计划",
    "url": "https://example.com/news/1",
    "source": "知乎热榜",
    "summary": "AI 生成的摘要...",
    "content": "原始正文...",
    "is_authentic": 1,
    "authenticity_score": 0.95,
    "authenticity_reason": "来源可信",
    "hot_score": 85.5,
    "detected_at": "2026-07-01 10:30:00",
    "is_notified": 1,
    "category": "科技",
    "platform": "知乎",
    "trend": "上升",
    "relevance_score": 92,
    "sentiment_score": 68
  }
]
```

**关键字段说明**

| 字段 | 类型 | 说明 |
|---|---|---|
| `source` | `string` | 数据源名称，如 `"知乎热榜"`、`"微博热搜"`、`"掘金热榜"`、`"Web Search"` |
| `platform` | `string` | 平台名称，如 `"知乎"`、`"微博"`、`"掘金"`、`"DuckDuckGo"` |
| `is_authentic` | `0 \| 1` | AI 真实性校验结果 |
| `hot_score` | `number` | 热度 0-100（越高越热） |
| `trend` | `string` | `"新晋"` / `"上升"` / `"下降"` / `"稳定"` / `""` |
| `category` | `string` | `"科技"` / `"娱乐"` / `"财经"` / `"民生"` / `"其他"` / `""` |
| `relevance_score` | `number` | 与关键词相关性 0-100 |
| `sentiment_score` | `number` | 情感指数 0-100（50=中性） |

---

### `GET /api/hotspots/recent`

最近 24 小时热点，格式同 `GET /api/hotspots`。

**响应 `200`** — 按 `detected_at` 倒序排列。

---

### `GET /api/hotspots/summary`

按关键词分组的聚合摘要。

**响应 `200`**

```json
[
  {
    "keyword_id": "uuid-1",
    "keyword": "固态电池",
    "total_count": 15,
    "avg_hot_score": 72.3,
    "latest_detected": "2026-07-01 10:30:00"
  }
]
```

---

### `GET /api/hotspots/notifications`

通知列表。

**参数**: `limit` (number, 默认 50)

**响应 `200`**

```json
[
  {
    "id": "uuid-notif-1",
    "hot_spot_id": "uuid-spot-1",
    "keyword_id": "uuid-1",
    "keyword": "固态电池",
    "hot_spot_title": "宁德时代发布固态电池量产计划",
    "message": "🔥 Hot spot detected: 宁德时代... (score: 85)",
    "is_read": 0,
    "created_at": "2026-07-01 10:30:05"
  }
]
```

---

### `PATCH /api/hotspots/notifications/read-all`

标记全部通知为已读。

**响应 `200`**: `{ "success": true }`

---

## 5. 通知配置

### `GET /api/config/notifications`

**响应 `200`**

```json
{
  "email_enabled": "1",
  "smtp_host": "smtp.qq.com",
  "smtp_port": "465",
  "smtp_user": "alert@qq.com",
  "smtp_pass": "",
  "recipient_emails": "team@company.com",
  "alert_threshold": "1000000",
  "alert_frequency": "once_per_hotspot"
}
```

> `smtp_pass` 返回空字符串（脱敏），仅 PUT 时传入。

| 字段 | 类型 | 说明 |
|---|---|---|
| `email_enabled` | `"0" \| "1"` | 是否启用 |
| `alert_frequency` | `"once_per_hotspot" \| "once_per_hour" \| "always"` | 告警频率 |

---

### `PUT /api/config/notifications`

保存配置。请求体字段同 GET 响应，只需传需要更新的字段。

**响应 `200`**: `{ "success": true }`

---

### `POST /api/config/notifications/test`

发送测试邮件。

**请求体**

```json
{
  "smtp_user": "alert@qq.com",
  "smtp_pass": "your-auth-code",
  "recipient_emails": "team@company.com"
}
```

**响应 `200`**: `{ "success": true, "message": "测试邮件已发送" }`  
**错误**: `400`（参数缺失）、`500`（发送失败）

---

## 6. 采集触发

### `POST /api/scrape`

触发全量采集：对所有已启用的搜索词执行多源数据采集 + AI 分析。

**数据管道**

```
scraper.ts
  └─ collector.ts (并行采集 4 个源)
       ├─ 知乎热榜 → 关键词标题匹配
       ├─ 微博热搜 → 关键词匹配热搜词
       ├─ 掘金热榜 → 关键词匹配标题/简介
       └─ Web Search → DuckDuckGo HTML → Bing 兜底
  └─ DeepSeek AI → 真实性校验
  └─ DeepSeek AI → 热度评分/分类/情感分析
  └─ SQLite 存储 → Socket.IO 推送
```

**响应 `200`**: `{ "success": true, "message": "Collection triggered for all active keywords" }`  
**错误**: `500`

---

### `POST /api/scrape/:id`

触发指定搜索词的独立采集。

**路径参数**: `id` (string)

**响应 `200`**: `{ "success": true, "message": "Collection triggered for keyword uuid-1" }`  
**错误**: `500`

---

## 7. 数据源架构

当前配置了 4 个并行数据源，采集时同时发起请求，结果按标题去重后合并。

| 源名称 | 适配器 | 平台 | 接口类型 | 门槛 |
|---|---|---|---|---|
| Web Search | `web-search.ts` | DuckDuckGo → Bing | HTML 抓取 | 零门槛 |
| 知乎热榜 | `zhihu.ts` | 知乎 | 公开 JSON API | 零门槛 |
| 微博热搜 | `weibo.ts` | 微博 | AJAX JSON 接口 | 零门槛 |
| 掘金热榜 | `juejin.ts` | 掘金 | 公开 JSON API | 零门槛 |

**添加新数据源**

实现 `SourceAdapter` 接口并注册到 `collector.ts` 的 `SOURCES` 数组即可：

```ts
// 1. 实现接口
const myAdapter: SourceAdapter = {
  name: '我的源',
  async fetchResults(keyword: string): Promise<RawSearchResult[]> { ... }
};

// 2. 注册到 collector.ts
const SOURCES = [ webSearchAdapter, zhihuAdapter, weiboAdapter, juejinAdapter, myAdapter ];
```

---

## 8. Socket.IO 实时事件

前端通过 WebSocket 接收以下事件：

| 事件 | 触发时机 | 负载 |
|---|---|---|
| `notification` | 新热点 score≥60 | `{ id, keyword, title, message, isAuthentic, hotScore, createdAt }` |
| `hotSpots:update` | 某关键词热点更新 | `{ keyword, hotSpots: HotSpot[] }` |
| `keyword:update` | 关键词增/删/改 | 无负载，前端调用 `GET /api/keywords` 刷新 |

**`notification` 事件负载**

```ts
interface SocketNotification {
  id: string;
  keyword: string;
  title: string;
  message: string;
  isAuthentic: boolean;
  hotScore: number;
  createdAt: string;
}
```

**`hotSpots:update` 事件负载**

```ts
interface HotSpotsUpdatePayload {
  keyword: string;
  hotSpots: HotSpot[];  // 结构同 GET /api/hotspots 的元素
}
```

---

## 9. 通用约定

- 所有响应为 `application/json`
- 时间格式：SQLite datetime `"YYYY-MM-DD HH:mm:ss"`
- 布尔值用 `number` 类型 (`0` / `1`)，非 boolean
- RESTful: GET 查询 / POST 创建 / PUT 全量更新 / PATCH 部分更新 / DELETE 删除
