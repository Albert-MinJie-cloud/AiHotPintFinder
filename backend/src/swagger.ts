import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sentinel — AI Hotspot Monitor API',
      version: '1.0.0',
      description: `
实时热点监控系统后端 API。

## 功能模块

- **概览** — 仪表盘统计数据、趋势图、分类分布
- **搜索词** — 关键词的增删改查与启停控制
- **热点** — 热点列表、最近热点、聚合摘要、通知管理
- **配置** — 邮件告警 SMTP 配置、测试邮件发送
- **采集** — 手动触发 AI 采集任务

## 认证

当前版本无认证机制。所有接口可直接调用。
      `.trim(),
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: '本地开发服务器',
      },
    ],
    tags: [
      { name: 'Overview', description: '概览仪表盘数据' },
      { name: 'Keywords', description: '搜索词 CRUD' },
      { name: 'Hotspots', description: '热点数据与通知' },
      { name: 'Config', description: '通知配置' },
      { name: 'Scrape', description: '采集触发' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
