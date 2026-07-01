import { Router, Request, Response } from "express";
import db from "../db";
import { sendTestEmail } from "../services/mailer";

const router = Router();

/**
 * @swagger
 * /api/config/notifications:
 *   get:
 *     summary: 读取通知配置
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email_enabled:
 *                   type: string
 *                   enum: ['0', '1']
 *                 smtp_host:
 *                   type: string
 *                 smtp_port:
 *                   type: string
 *                 smtp_user:
 *                   type: string
 *                 smtp_pass:
 *                   type: string
 *                 recipient_emails:
 *                   type: string
 *                 alert_threshold:
 *                   type: string
 *                 alert_frequency:
 *                   type: string
 *   put:
 *     summary: 保存通知配置
 *     tags: [Config]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email_enabled:
 *                 type: string
 *               smtp_host:
 *                 type: string
 *               smtp_port:
 *                 type: string
 *               smtp_user:
 *                 type: string
 *               smtp_pass:
 *                 type: string
 *               recipient_emails:
 *                 type: string
 *               alert_threshold:
 *                 type: string
 *               alert_frequency:
 *                 type: string
 *     responses:
 *       200:
 *         description: 保存成功
 */
router.get("/notifications", (_req: Request, res: Response) => {
  const rows = db
    .prepare("SELECT key, value FROM config WHERE key LIKE ?")
    .all("email_%") as any[];
  const config: Record<string, string> = {};
  for (const r of rows) {
    config[r.key] = r.value;
  }
  res.json({
    email_enabled: config.email_enabled || "0",
    smtp_host: config.smtp_host || "smtp.qq.com",
    smtp_port: config.smtp_port || "465",
    smtp_user: config.smtp_user || "",
    smtp_pass: config.smtp_pass || "",
    recipient_emails: config.recipient_emails || "",
    alert_threshold: config.alert_threshold || "1000000",
    alert_frequency: config.alert_frequency || "once_per_hotspot",
  });
});

router.put("/notifications", (req: Request, res: Response) => {
  const fields = [
    "email_enabled",
    "smtp_host",
    "smtp_port",
    "smtp_user",
    "smtp_pass",
    "recipient_emails",
    "alert_threshold",
    "alert_frequency",
  ];

  const upsert = db.prepare(
    "INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)",
  );

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      upsert.run(field, String(req.body[field]));
    }
  }

  res.json({ success: true });
});

/**
 * @swagger
 * /api/config/notifications/test:
 *   post:
 *     summary: 发送测试邮件
 *     tags: [Config]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - smtp_user
 *               - smtp_pass
 *               - recipient_emails
 *             properties:
 *               smtp_user:
 *                 type: string
 *               smtp_pass:
 *                 type: string
 *               recipient_emails:
 *                 type: string
 *     responses:
 *       200:
 *         description: 发送成功
 *       400:
 *         description: 参数缺失
 *       500:
 *         description: 发送失败
 */
router.post("/notifications/test", async (req: Request, res: Response) => {
  try {
    const { smtp_user, smtp_pass, recipient_emails } = req.body;
    if (!smtp_user || !smtp_pass || !recipient_emails) {
      return res
        .status(400)
        .json({ error: "Missing SMTP user, password, or recipient emails" });
    }
    await sendTestEmail(smtp_user, smtp_pass, recipient_emails);
    res.json({ success: true, message: "测试邮件已发送" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "邮件发送失败" });
  }
});

export default router;
