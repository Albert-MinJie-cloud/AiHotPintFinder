import axios from 'axios';
import type { SourceAdapter, RawSearchResult } from './types';

let lastRequest = 0;

async function rateLimit(): Promise<void> {
  const wait = 3000 - (Date.now() - lastRequest);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequest = Date.now();
}

export const juejinAdapter: SourceAdapter = {
  name: '掘金热榜',

  async fetchResults(keyword: string): Promise<RawSearchResult[]> {
    await rateLimit();
    console.log(`[掘金] Fetching hot articles, searching for: "${keyword}"`);

    try {
      const res = await axios.post(
        'https://api.juejin.cn/recommend_api/v1/article/recommend_all_feed',
        { cursor: '0', id_type: 2, limit: 20, sort_type: 300 },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
          timeout: 10000,
        }
      );

      const items: any[] = res.data?.data || [];
      const matched: RawSearchResult[] = [];

      for (const item of items) {
        const info = item?.article_info || {};
        const title: string = info.title || '';
        const brief: string = info.brief_content || '';

        if (!title.toLowerCase().includes(keyword.toLowerCase()) &&
            !brief.toLowerCase().includes(keyword.toLowerCase())) {
          continue;
        }

        matched.push({
          title,
          snippet: brief || title,
          url: info.article_id
            ? `https://juejin.cn/post/${info.article_id}`
            : `https://juejin.cn/search?query=${encodeURIComponent(keyword)}`,
          source: '掘金热榜',
          platform: '掘金',
          category: info.category_name || '技术',
          relevance_score: info.view_count ? Math.min(100, Math.round(info.view_count / 100)) : 50,
          sentiment_score: 50,
        });
      }

      console.log(`[掘金] Hot articles: ${items.length} total, ${matched.length} matched "${keyword}"`);
      return matched;
    } catch (err: any) {
      console.error(`[掘金] Error: ${err.message}`);
      return [];
    }
  },
};
