import { v4 as uuidv4 } from "uuid";
import db from "../db";
import { verifyContentAuthenticity, analyzeHotSpots } from "./deepseek";
import { collectFromAllSources } from "../sources/collector";
import { emitNotification, emitHotSpotsUpdate } from "../socket";

// Fallback category detection from title/content keywords
function detectCategory(title: string, content: string): string {
  const text = (title + " " + content).toLowerCase();
  const rules: Array<[string, string[]]> = [
    [
      "科技",
      [
        "ai",
        "人工智能",
        "芯片",
        "半导体",
        "机器人",
        "量子",
        "5g",
        "6g",
        "大模型",
        "gpt",
        "自动驾驶",
        "航天",
        "卫星",
        "火箭",
        "新能源",
        "电池",
        "固态电池",
      ],
    ],
    [
      "娱乐",
      [
        "电影",
        "票房",
        "综艺",
        "明星",
        "演员",
        "导演",
        "歌曲",
        "音乐",
        "演唱会",
        "电视剧",
        "网剧",
      ],
    ],
    [
      "财经",
      [
        "股市",
        "基金",
        "金融",
        "银行",
        "利率",
        "通胀",
        "经济",
        "投资",
        "a股",
        "港股",
        "美股",
        "央行",
        "贷款",
        "保险",
        "补贴",
      ],
    ],
    [
      "民生",
      [
        "天气",
        "降温",
        "高温",
        "暴雨",
        "台风",
        "地震",
        "出行",
        "旅游",
        "景区",
        "交通",
        "火车",
        "高铁",
        "高速",
        "教育",
        "医疗",
        "养老",
        "住房",
        "房价",
      ],
    ],
    [
      "游戏",
      [
        "游戏",
        "电竞",
        "手游",
        "端游",
        "主机",
        "steam",
        "switch",
        "ps5",
        "原神",
        "王者荣耀",
        "lol",
      ],
    ],
    [
      "文化",
      [
        "考古",
        "文物",
        "博物馆",
        "遗址",
        "历史",
        "传统",
        "非遗",
        "春节",
        "中秋",
        "端午",
        "艺术",
        "文学",
        "诗词",
      ],
    ],
    [
      "国际",
      [
        "美国",
        "欧洲",
        "日本",
        "韩国",
        "印度",
        "俄",
        "中东",
        "北约",
        "欧盟",
        "联合国",
        "外交",
        "制裁",
        "贸易",
        "原油",
      ],
    ],
    [
      "社会",
      [
        "网红",
        "直播",
        "带货",
        "维权",
        "投诉",
        "举报",
        "政策",
        "法规",
        "法院",
        "公安",
        "警察",
      ],
    ],
  ];
  for (const [cat, keywords] of rules) {
    if (keywords.some((kw) => text.includes(kw))) return cat;
  }
  return "其他";
}

export async function collectForKeyword(keywordId: string): Promise<void> {
  const keyword = db
    .prepare("SELECT * FROM keywords WHERE id = ?")
    .get(keywordId) as any;
  if (!keyword || !keyword.is_active) {
    console.log(
      `[Scraper] Keyword ${keywordId} is inactive or not found, skipping`,
    );
    return;
  }

  console.log(`[Scraper] Collecting hot spots for: "${keyword.keyword}"`);

  try {
    // Fetch from all real sources (web search + Twitter) instead of AI-generated fake data
    const items = await collectFromAllSources(keyword.keyword, keyword.scope);

    if (items.length === 0) {
      console.log(`[Scraper] No items found for "${keyword.keyword}"`);
      return;
    }
    console.log(
      `[Scraper] Found ${items.length} items for "${keyword.keyword}"`,
    );

    // Verify authenticity via DeepSeek AI
    const verifiedItems = [];
    for (const item of items) {
      const verification = await verifyContentAuthenticity(
        keyword.keyword,
        item.title,
        item.content,
        item.source,
      );
      if (verification.isAuthentic) {
        verifiedItems.push({ ...item, verification });
      }
    }

    if (verifiedItems.length === 0) {
      console.log(`[Scraper] All items filtered out for "${keyword.keyword}"`);
      return;
    }

    // Analyze hot spots via DeepSeek AI
    const analyzedSpots = await analyzeHotSpots(
      keyword.keyword,
      verifiedItems.map((item) => ({
        title: item.title,
        content: item.content,
        source: item.source,
      })),
    );

    // Store hot spots + record volume
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const hour = new Date().getHours();
    const newHotSpots = [];

    for (const item of verifiedItems) {
      const analysis = analyzedSpots.find((a) =>
        a.title
          .toLowerCase()
          .includes(item.title.toLowerCase().substring(0, 20)),
      );
      const hotSpotId = uuidv4();
      const hotScore = analysis?.hotScore || 50;

      // Dedup check (using keyword UUID, not text)
      const existing = db
        .prepare("SELECT id FROM hot_spots WHERE keyword_id = ? AND title = ?")
        .get(keywordId, item.title);
      if (existing) continue;

      // Defend against async race: keyword could have been deleted during API calls
      const kwExists = db
        .prepare("SELECT id FROM keywords WHERE id = ? AND is_active = 1")
        .get(keywordId);
      if (!kwExists) {
        console.log(
          `[Scraper] Keyword "${keyword.keyword}" was deleted or deactivated during collection, aborting`,
        );
        break;
      }

      // Insert all related records in a single transaction
      const notifId = db.transaction(() => {
        db.prepare(
          `
          INSERT INTO hot_spots (id, keyword_id, title, url, source, summary, content,
            is_authentic, authenticity_score, authenticity_reason, hot_score, detected_at,
            category, platform, relevance_score, sentiment_score)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        ).run(
          hotSpotId,
          keywordId,
          item.title,
          item.url || "",
          item.source,
          analysis?.summary || item.content.substring(0, 200),
          item.content,
          item.verification?.isAuthentic ? 1 : 0,
          item.verification?.score || 0.5,
          item.verification?.reason || "",
          hotScore,
          now,
          keyword.category || "综合",
          item.platform || "",
          item.relevance_score || 0,
          item.sentiment_score || 50,
        );

        // Record historical volume
        const volId = uuidv4();
        db.prepare(
          `
          INSERT OR REPLACE INTO historical_volume (id, keyword_id, volume, recorded_date, recorded_hour)
          VALUES (?, ?, 1, ?, ?)
        `,
        ).run(volId, keywordId, today, hour);

        // Create notification for high-scored spots
        if (hotScore >= 60) {
          const nid = uuidv4();
          db.prepare(
            `
            INSERT INTO notifications (id, hot_spot_id, keyword_id, message, created_at)
            VALUES (?, ?, ?, ?, ?)
          `,
          ).run(
            nid,
            hotSpotId,
            keywordId,
            `🔥 Hot spot detected: ${item.title} (score: ${hotScore})`,
            now,
          );
          return nid;
        }
        return null;
      })();

      newHotSpots.push({
        id: hotSpotId,
        keyword: keyword.keyword,
        title: item.title,
        summary: analysis?.summary || item.content.substring(0, 200),
        hotScore,
        isAuthentic: item.verification?.isAuthentic,
        source: item.source,
        url: item.url,
        detectedAt: now,
      });

      if (notifId) {
        emitNotification({
          id: notifId,
          keyword: keyword.keyword,
          title: item.title,
          message: `🔥 Hot spot detected: ${item.title} (score: ${hotScore})`,
          isAuthentic: item.verification?.isAuthentic ?? true,
          hotScore,
          createdAt: now,
        });
      }
    }

    db.prepare("UPDATE keywords SET last_checked_at = ? WHERE id = ?").run(
      now,
      keywordId,
    );

    const allHotSpots = db
      .prepare(
        `
      SELECT h.*, k.keyword FROM hot_spots h
      JOIN keywords k ON h.keyword_id = k.id
      WHERE h.keyword_id = ? ORDER BY h.detected_at DESC LIMIT 20
    `,
      )
      .all(keywordId);
    emitHotSpotsUpdate(keyword.keyword, allHotSpots);

    if (newHotSpots.length > 0) {
      console.log(
        `[Scraper] Added ${newHotSpots.length} hot spots for "${keyword.keyword}"`,
      );
    }
  } catch (error) {
    console.error(
      `[Scraper] Error collecting for "${keyword.keyword}":`,
      error,
    );
  }
}

export async function collectAllKeywords(): Promise<void> {
  const keywords = db
    .prepare("SELECT * FROM keywords WHERE is_active = 1")
    .all() as any[];
  console.log(
    `[Scraper] Starting collection for ${keywords.length} active keywords`,
  );
  for (const keyword of keywords) {
    await collectForKeyword(keyword.id);
  }
  console.log("[Scraper] Collection cycle complete");
}
