import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { emitKeywordUpdate, emitNotification } from '../socket';

const router = Router();

/**
 * @swagger
 * /api/keywords:
 *   get:
 *     summary: 获取所有搜索词
 *     tags: [Keywords]
 *     responses:
 *       200:
 *         description: 搜索词列表（按创建时间倒序）
 *   post:
 *     summary: 添加搜索词
 *     tags: [Keywords]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - keyword
 *             properties:
 *               keyword:
 *                 type: string
 *                 description: 搜索词内容
 *               scope:
 *                 type: string
 *                 description: 搜索范围（可选）
 *               category:
 *                 type: string
 *                 description: 分类标签（可选，默认"综合"）
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 关键词不能为空
 *       409:
 *         description: 关键词已存在
 */
router.get('/', (_req: Request, res: Response) => {
  const keywords = db.prepare('SELECT * FROM keywords ORDER BY created_at DESC').all();
  res.json(keywords);
});

router.post('/', (req: Request, res: Response) => {
  const { keyword, scope, category } = req.body;
  if (!keyword || !keyword.trim()) {
    return res.status(400).json({ error: 'Keyword is required' });
  }

  const id = uuidv4();
  try {
    db.prepare(
      'INSERT INTO keywords (id, keyword, scope, category) VALUES (?, ?, ?, ?)'
    ).run(id, keyword.trim(), scope || '', category || '综合');

    const newKeyword = db.prepare('SELECT * FROM keywords WHERE id = ?').get(id);
    emitKeywordUpdate(newKeyword);
    res.status(201).json(newKeyword);
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Keyword already exists' });
    }
    console.error('[Keywords] Create error:', error);
    res.status(500).json({ error: 'Failed to create keyword' });
  }
});

/**
 * @swagger
 * /api/keywords/{id}:
 *   delete:
 *     summary: 删除搜索词（同时删除关联的热点和通知）
 *     tags: [Keywords]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 搜索词不存在
 */
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const keyword = db.prepare('SELECT id FROM keywords WHERE id = ?').get(id);
    if (!keyword) {
      return res.status(404).json({ error: 'Keyword not found' });
    }

    const deleteAll = db.transaction(() => {
      // Notifications linked via hot_spots
      db.prepare(`
        DELETE FROM notifications
        WHERE hot_spot_id IN (SELECT id FROM hot_spots WHERE keyword_id = ?)
      `).run(id);
      // Notifications linked directly to the keyword
      db.prepare('DELETE FROM notifications WHERE keyword_id = ?').run(id);
      // Hot spots
      db.prepare('DELETE FROM hot_spots WHERE keyword_id = ?').run(id);
      // Historical volume records
      db.prepare('DELETE FROM historical_volume WHERE keyword_id = ?').run(id);
      // The keyword itself
      db.prepare('DELETE FROM keywords WHERE id = ?').run(id);
    });

    deleteAll();

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Keywords] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete keyword' });
  }
});

/**
 * @swagger
 * /api/keywords/{id}/toggle:
 *   patch:
 *     summary: 切换搜索词启用/停用状态
 *     tags: [Keywords]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 切换成功
 *       404:
 *         description: 搜索词不存在
 */
router.patch('/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const keyword = db.prepare('SELECT * FROM keywords WHERE id = ?').get(id) as any;
  if (!keyword) {
    return res.status(404).json({ error: 'Keyword not found' });
  }

  const newStatus = keyword.is_active ? 0 : 1;
  db.prepare('UPDATE keywords SET is_active = ? WHERE id = ?').run(newStatus, id);
  const updated = db.prepare('SELECT * FROM keywords WHERE id = ?').get(id);
  emitKeywordUpdate(updated);
  res.json(updated);
});

/**
 * @swagger
 * /api/keywords/toggle-all:
 *   patch:
 *     summary: 一键开启全部搜索词
 *     tags: [Keywords]
 *     responses:
 *       200:
 *         description: 操作成功
 */
router.patch('/toggle-all', (_req: Request, res: Response) => {
  db.prepare('UPDATE keywords SET is_active = 1 WHERE is_active = 0').run();
  const keywords = db.prepare('SELECT * FROM keywords ORDER BY created_at DESC').all();
  res.json({ success: true, keywords });
});

export default router;
