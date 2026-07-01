import cron from 'node-cron';
import { collectAllKeywords } from './scraper';
import { calculateTrends } from './trends';

let hotSpotTask: cron.ScheduledTask | null = null;
let trendTask: cron.ScheduledTask | null = null;

export function startScheduler(cronExpression = '*/30 * * * *'): void {
  if (hotSpotTask) {
    stopScheduler();
  }

  console.log(`[Scheduler] Starting hot spot collection: "${cronExpression}"`);
  hotSpotTask = cron.schedule(cronExpression, async () => {
    console.log('[Scheduler] Cron triggered - collecting hot spots...');
    try {
      await collectAllKeywords();
    } catch (error) {
      console.error('[Scheduler] Collection error:', error);
    }
  });

  // Daily trend calculation at 2:00 AM
  console.log('[Scheduler] Starting daily trend calculation: "0 2 * * *"');
  trendTask = cron.schedule('0 2 * * *', () => {
    console.log('[Scheduler] Daily trend calculation triggered');
    try {
      calculateTrends();
    } catch (error) {
      console.error('[Scheduler] Trend calculation error:', error);
    }
  });

  console.log('[Scheduler] Started successfully');
}

export function stopScheduler(): void {
  if (hotSpotTask) {
    hotSpotTask.stop();
    hotSpotTask = null;
  }
  if (trendTask) {
    trendTask.stop();
    trendTask = null;
  }
  console.log('[Scheduler] Stopped');
}

export async function triggerImmediateCollection(): Promise<void> {
  console.log('[Scheduler] Manual collection triggered');
  await collectAllKeywords();
}
