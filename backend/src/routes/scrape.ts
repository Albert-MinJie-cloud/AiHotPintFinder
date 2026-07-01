import { Router, Request, Response } from 'express';
import { collectAllKeywords, collectForKeyword } from '../services/scraper';

const router = Router();

/**
 * @swagger
 * /api/scrape:
 *   post:
 *     summary: 触发全量采集
 *     description: 对所有已启用的搜索词执行 AI 采集任务。
 *     tags: [Scrape]
 *     responses:
 *       200:
 *         description: 采集已触发
 *       500:
 *         description: 采集失败
 */
router.post('/', async (_req: Request, res: Response) => {
  try {
    await collectAllKeywords();
    res.json({ success: true, message: 'Collection triggered for all active keywords' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Collection failed' });
  }
});

/**
 * @swagger
 * /api/scrape/{id}:
 *   post:
 *     summary: 触发单个搜索词采集
 *     tags: [Scrape]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜索词 ID
 *     responses:
 *       200:
 *         description: 采集已触发
 *       500:
 *         description: 采集失败
 */
router.post('/:id', async (req: Request, res: Response) => {
  try {
    await collectForKeyword(req.params.id);
    res.json({ success: true, message: `Collection triggered for keyword ${req.params.id}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Collection failed' });
  }
});

export default router;
