import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import swaggerUi from 'swagger-ui-express';
import { initDatabase } from './db';
import { initSocket } from './socket';
import { startScheduler, triggerImmediateCollection } from './services/scheduler';
import { swaggerSpec } from './swagger';
import keywordsRouter from './routes/keywords';
import hotspotsRouter from './routes/hotspots';
import overviewRouter from './routes/overview';
import configRouter from './routes/config';
import scrapeRouter from './routes/scrape';

// Initialize database
initDatabase();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Initialize Socket.io
initSocket(server);

// Swagger API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Sentinel API Docs',
}));

// Routes
app.use('/api/keywords', keywordsRouter);
app.use('/api/hotspots', hotspotsRouter);
app.use('/api/overview', overviewRouter);
app.use('/api/config', configRouter);
app.use('/api/scrape', scrapeRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`\n  🛰️  Sentinel Backend running on http://localhost:${PORT}`);
  console.log(`  📖 API Docs available at http://localhost:${PORT}/api-docs`);
  console.log(`  📡 WebSocket server ready`);
  console.log(`  🤖 DeepSeek AI connected\n`);

  startScheduler('*/30 * * * *');

  setTimeout(async () => {
    console.log('[Startup] Running initial collection...');
    try {
      await triggerImmediateCollection();
    } catch (error) {
      console.error('[Startup] Initial collection error:', error);
    }
  }, 10000);
});
