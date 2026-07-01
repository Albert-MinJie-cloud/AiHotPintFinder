import db from '../db';

/**
 * Calculate trend label for each hotspot based on 7-day volume history.
 * Run daily (e.g., at midnight) to update trend tags.
 */
export function calculateTrends(): void {
  console.log('[Trends] Starting trend calculation...');

  const hotspots = db.prepare('SELECT id, keyword_id, detected_at FROM hot_spots').all() as any[];

  for (const hs of hotspots) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().slice(0, 10);

    // Get volume history for this keyword
    const volumes = db.prepare(`
      SELECT recorded_date, SUM(volume) as daily_total
      FROM historical_volume
      WHERE keyword_id = ? AND recorded_date >= ?
      GROUP BY recorded_date
      ORDER BY recorded_date ASC
    `).all(hs.keyword_id, cutoff) as any[];

    let trend = '稳定';
    if (volumes.length >= 2) {
      const recent = volumes.slice(-3);
      const first = recent[0]?.daily_total || 0;
      const last = recent[recent.length - 1]?.daily_total || 0;

      if (last > first * 1.3) {
        trend = volumes.length <= 3 ? '新晋' : '上升';
      } else if (last < first * 0.7) {
        trend = '下降';
      }
    } else if (volumes.length === 1) {
      trend = '新晋';
    }

    db.prepare('UPDATE hot_spots SET trend = ? WHERE id = ?').run(trend, hs.id);
  }

  console.log(`[Trends] Updated trends for ${hotspots.length} hotspots`);
}

/**
 * Record daily/historical volume for a keyword
 */
export function recordVolume(
  keywordId: string,
  volume: number,
  date: string,
  hour: number
): void {
  const id = require('uuid').v4();
  db.prepare(`
    INSERT OR REPLACE INTO historical_volume (id, keyword_id, volume, recorded_date, recorded_hour)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, keywordId, volume, date, hour);
}
