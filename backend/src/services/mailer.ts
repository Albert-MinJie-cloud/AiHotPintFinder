import nodemailer from 'nodemailer';

/**
 * Send a test email via QQ SMTP to verify configuration
 */
export async function sendTestEmail(
  smtpUser: string,
  smtpPass: string,
  recipientEmails: string
): Promise<void> {
  const transport = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const recipients = recipientEmails.split(',').map(e => e.trim()).filter(Boolean);

  await transport.sendMail({
    from: `"Sentinel Monitor" <${smtpUser}>`,
    to: recipients.join(', '),
    subject: '[Sentinel] 邮件配置测试',
    text: '这是一封测试邮件，您的 Sentinel 热点监控邮件告警配置已生效。',
    html: `
      <div style="font-family: monospace; padding: 20px; background: #0a0a0f; color: #c0c0c0;">
        <h2 style="color: #00ff41;">SENTINEL // 配置确认</h2>
        <p>您的邮件告警配置已成功生效。</p>
        <p style="color: #00d4ff;">当监控关键词出现异动时，系统将自动发送告警通知。</p>
        <hr style="border-color: #2a2a3e;" />
        <p style="font-size: 12px; color: #666;">Sentinel Hotspot Monitor</p>
      </div>
    `,
  });

  transport.close();
}

/**
 * Send an alert email for a hot spot detection
 */
export async function sendAlertEmail(
  smtpUser: string,
  smtpPass: string,
  recipientEmails: string,
  keyword: string,
  title: string,
  hotScore: number
): Promise<void> {
  const transport = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const recipients = recipientEmails.split(',').map(e => e.trim()).filter(Boolean);

  await transport.sendMail({
    from: `"Sentinel Alert" <${smtpUser}>`,
    to: recipients.join(', '),
    subject: `[Sentinel 告警] "${keyword}" 出现热点 — 热度 ${hotScore}`,
    text: `关键词"${keyword}"出现新热点：${title}\n热度指数：${hotScore}`,
    html: `
      <div style="font-family: monospace; padding: 20px; background: #0a0a0f; color: #c0c0c0;">
        <h2 style="color: #ff0044;">⚠ SENTINEL ALERT</h2>
        <p>监控关键词 <strong style="color: #00ff41;">${keyword}</strong> 出现新热点：</p>
        <h3 style="color: #00d4ff;">${title}</h3>
        <p>热度指数：<span style="color: #ff6a00; font-size: 20px;">${hotScore}</span></p>
        <hr style="border-color: #2a2a3e;" />
        <p style="font-size: 12px; color: #666;">Sentinel Hotspot Monitor</p>
      </div>
    `,
  });

  transport.close();
}
