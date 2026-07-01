import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

/**
 * @swagger
 * /api/hotspots:
 *   get:
 *     summary: 获取热点列表
 *     description: 支持按关键词、平台和数据源筛选，按检测时间倒序排列。
 *     tags: [Hotspots]
 *     parameters:
 *       - in: query
 *         name: keyword_id
 *         schema:
 *           type: string
 *         description: 按关键词 ID 精确过滤
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 按关键词名称模糊匹配（支持部分匹配）
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *         description: 按数据来源平台过滤，支持逗号分隔多个值（如 "小红书,微博,Twitter"）
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 返回条数上限
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/', (req: Request, res: Response) => {
  const { keyword_id, keyword, platform, limit } = req.query;

  let query = `
    SELECT h.*, k.keyword
    FROM hot_spots h
    JOIN keywords k ON h.keyword_id = k.id
  `;
  const params: any[] = [];
  const conditions: string[] = [];

  // Filter by keyword ID (exact match)
  if (keyword_id) {
    conditions.push('h.keyword_id = ?');
    params.push(keyword_id);
  }

  // Filter by keyword name (fuzzy match)
  if (keyword) {
    conditions.push('k.keyword LIKE ?');
    params.push(`%${keyword}%`);
  }

  // Filter by platform — supports comma-separated values like "小红书,微博,Twitter"
  if (platform) {
    const platforms = (platform as string)
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    if (platforms.length > 0) {
      const placeholders = platforms.map(() => '?').join(', ');
      conditions.push(`h.platform IN (${placeholders})`);
      params.push(...platforms);
    }
  }

  if (conditions.length > 0) {
    query += 'WHERE ' + conditions.join(' AND ') + ' ';
  }

  query += 'ORDER BY h.detected_at DESC ';
  query += 'LIMIT ?';
  params.push(Number(limit) || 50);

  const hotSpots = db.prepare(query).all(...params);
  res.json(hotSpots);
});

/**
 * @swagger
 * /api/hotspots/recent:
 *   get:
 *     summary: 获取最近 24 小时热点
 *     tags: [Hotspots]
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/recent', (_req: Request, res: Response) => {
  const hotSpots = db.prepare(`
    SELECT h.*, k.keyword
    FROM hot_spots h
    JOIN keywords k ON h.keyword_id = k.id
    WHERE h.detected_at >= datetime('now', '-1 day')
    ORDER BY h.detected_at DESC
  `).all();
  res.json(hotSpots);
});

/**
 * @swagger
 * /api/hotspots/summary:
 *   get:
 *     summary: 获取热点聚合摘要
 *     description: 按关键词分组统计热点数量、平均热度分数和最新检测时间。
 *     tags: [Hotspots]
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/summary', (_req: Request, res: Response) => {
  const summary = db.prepare(`
    SELECT
      k.id as keyword_id,
      k.keyword,
      COUNT(h.id) as total_count,
      AVG(h.hot_score) as avg_hot_score,
      MAX(h.detected_at) as latest_detected
    FROM keywords k
    LEFT JOIN hot_spots h ON k.id = h.keyword_id
    GROUP BY k.id
    ORDER BY latest_detected DESC
  `).all();
  res.json(summary);
});

/**
 * @swagger
 * /api/hotspots/notifications:
 *   get:
 *     summary: 获取通知列表
 *     tags: [Hotspots]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 返回条数上限
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/notifications', (req: Request, res: Response) => {
  const { limit } = req.query;
  const notifications = db.prepare(`
    SELECT n.*, k.keyword, h.title as hot_spot_title
    FROM notifications n
    JOIN keywords k ON n.keyword_id = k.id
    LEFT JOIN hot_spots h ON n.hot_spot_id = h.id
    ORDER BY n.created_at DESC
    LIMIT ?
  `).all(Number(limit) || 50);
  res.json(notifications);
});

/**
 * @swagger
 * /api/hotspots/notifications/read-all:
 *   patch:
 *     summary: 标记所有通知为已读
 *     tags: [Hotspots]
 *     responses:
 *       200:
 *         description: 成功
 */
router.patch('/notifications/read-all', (_req: Request, res: Response) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE is_read = 0').run();
  res.json({ success: true });
});

export default router;
