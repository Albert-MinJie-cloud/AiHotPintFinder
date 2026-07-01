import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

/**
 * @swagger
 * /api/overview/stats:
 *   get:
 *     summary: 获取概览统计指标
 *     description: 返回仪表盘顶部的 4 张 KPI 卡片数据，包含环比变化百分比。
 *     tags: [Overview]
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_hotspots:
 *                   type: integer
 *                   description: 今日热点总数
 *                 total_change_percent:
 *                   type: integer
 *                   description: 较昨日变化百分比
 *                 new_today:
 *                   type: integer
 *                   description: 今日新增话题数
 *                 new_change_percent:
 *                   type: integer
 *                   description: 新增话题较昨日变化百分比
 *                 avg_sentiment:
 *                   type: number
 *                   description: 平均情感指数 (0-100)
 *                 sentiment_change:
 *                   type: integer
 *                   description: 情感指数较昨日变化百分比
 *                 active_sources:
 *                   type: integer
 *                   description: 活跃数据源数量
 *                 sources_status:
 *                   type: string
 *                   enum: [stable, warning]
 *                   description: 数据源健康状态
 */
router.get('/stats', (_req: Request, res: Response) => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);

  // Total hotspots today
  const totalHotspots = db.prepare(`
    SELECT COUNT(*) as count FROM hot_spots
    WHERE date(detected_at) = ?
  `).get(today) as any;

  // Total hotspots yesterday
  const totalYesterday = db.prepare(`
    SELECT COUNT(*) as count FROM hot_spots
    WHERE date(detected_at) = ?
  `).get(yesterday) as any;

  // New hotspots today (first detection)
  const newToday = db.prepare(`
    SELECT COUNT(*) as count FROM hot_spots
    WHERE date(detected_at) = ?
  `).get(today) as any;

  // New hotspots yesterday
  const newYesterday = db.prepare(`
    SELECT COUNT(*) as count FROM hot_spots
    WHERE date(detected_at) = ?
  `).get(yesterday) as any;

  // Average sentiment today
  const avgSentiment = db.prepare(`
    SELECT AVG(sentiment_score) as avg_score FROM hot_spots
    WHERE date(detected_at) = ? AND sentiment_score > 0
  `).get(today) as any;

  // Average sentiment yesterday
  const avgSentimentYesterday = db.prepare(`
    SELECT AVG(sentiment_score) as avg_score FROM hot_spots
    WHERE date(detected_at) = ? AND sentiment_score > 0
  `).get(yesterday) as any;

  // Active data sources (distinct platforms that have data today)
  const activeSources = db.prepare(`
    SELECT COUNT(DISTINCT source) as count FROM hot_spots
    WHERE date(detected_at) = ? AND source != ''
  `).get(today) as any;

  // All-time source count for stability check
  const allTimeSources = db.prepare(`
    SELECT COUNT(DISTINCT source) as count FROM hot_spots WHERE source != ''
  `).get() as any;

  const calcPercent = (current: number, previous: number): number => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  res.json({
    total_hotspots: totalHotspots.count || 0,
    total_change_percent: calcPercent(totalHotspots.count || 0, totalYesterday.count || 0),
    new_today: newToday.count || 0,
    new_change_percent: calcPercent(newToday.count || 0, newYesterday.count || 0),
    avg_sentiment: Math.round((avgSentiment.avg_score || 50) * 10) / 10,
    sentiment_change: calcPercent(
      Math.round(avgSentiment.avg_score || 50),
      Math.round(avgSentimentYesterday.avg_score || 50)
    ),
    active_sources: activeSources.count || 0,
    sources_status: (activeSources.count || 0) >= (allTimeSources.count || 1) * 0.5 ? 'stable' : 'warning',
  });
});

/**
 * @swagger
 * /api/overview/trends:
 *   get:
 *     summary: 获取热点趋势数据
 *     description: 返回指定日期的逐小时热点热度趋势，用于折线图。
 *     tags: [Overview]
 *     parameters:
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: string
 *         description: 逗号分隔的关键词列表，不传则取前 5 个活跃词
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: 目标日期，默认今天
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 keywords:
 *                   type: array
 *                   items:
 *                     type: string
 *                 data:
 *                   type: array
 *                   description: 24 小时的趋势数据点
 */
router.get('/trends', (req: Request, res: Response) => {
  const { keywords, date } = req.query;
  const targetDate = (date as string) || new Date().toISOString().slice(0, 10);

  let kwList: string[] = [];
  if (keywords) {
    kwList = (keywords as string).split(',').map(k => k.trim()).filter(Boolean);
  }

  // Get top 5 active keywords if none specified
  if (kwList.length === 0) {
    const topKeywords = db.prepare(`
      SELECT keyword FROM keywords WHERE is_active = 1 ORDER BY created_at ASC LIMIT 5
    `).all() as any[];
    kwList = topKeywords.map((k: any) => k.keyword);
  }

  // Build hourly series (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

  // For each keyword, get hourly volume
  const trendData = hours.map(hour => {
    const point: any = { hour: `${hour}:00` };
    for (const kw of kwList) {
      const row = db.prepare(`
        SELECT SUM(volume) as total FROM historical_volume
        WHERE keyword_id = (SELECT id FROM keywords WHERE keyword = ?)
        AND recorded_date = ? AND recorded_hour = ?
      `).get(kw, targetDate, parseInt(hour)) as any;
      point[kw] = row?.total || 0;
    }
    return point;
  });

  res.json({ keywords: kwList, data: trendData });
});

/**
 * @swagger
 * /api/overview/categories:
 *   get:
 *     summary: 获取热点分类分布
 *     description: 返回今日各分类的热点数量及占比，用于环形图。
 *     tags: [Overview]
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       value:
 *                         type: integer
 *                       color:
 *                         type: string
 *                         description: 十六进制颜色值
 *                 total:
 *                   type: integer
 *                   description: 所有分类热点总数
 */
router.get('/categories', (_req: Request, res: Response) => {
  const today = new Date().toISOString().slice(0, 10);

  const rows = db.prepare(`
    SELECT 
      CASE 
        WHEN category = '' OR category IS NULL THEN '其他'
        ELSE category 
      END as name,
      COUNT(*) as value
    FROM hot_spots
    WHERE date(detected_at) = ?
    GROUP BY name
    ORDER BY value DESC
  `).all(today) as any[];

  const colorMap: Record<string, string> = {
    '科技': '#00d4ff',
    '娱乐': '#ff6a00',
    '财经': '#00ff41',
    '民生': '#ff0044',
    '其他': '#c0c0c0',
  };

  const categories = rows.map(r => ({
    name: r.name,
    value: r.value,
    color: colorMap[r.name] || '#666666',
  }));

  const total = categories.reduce((sum, c) => sum + c.value, 0);

  res.json({ categories, total });
});

export default router;
