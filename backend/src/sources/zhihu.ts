import axios from 'axios';
import type { SourceAdapter, RawSearchResult } from './types';

let lastRequest = 0;

async function rateLimit(): Promise<void> {
  const wait = 3000 - (Date.now() - lastRequest);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequest = Date.now();
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

export const zhihuAdapter: SourceAdapter = {
  name: '知乎热榜',

  async fetchResults(keyword: string): Promise<RawSearchResult[]> {
    await rateLimit();
    console.log(`[知乎] Fetching hot list, searching for: "${keyword}"`);

    try {
      const res = await axios.get('https://www.zhihu.com/api/v3/feed/topstory/hot-lists', {
        params: { limit: 50 },
        headers: {
          'User-Agent': UA,
          'Accept': 'application/json',
          'Cookie': '', // no auth needed for hot list
        },
        timeout: 10000,
      });

      const items: any[] = res.data?.data || [];
      const matched: RawSearchResult[] = [];

      for (const item of items) {
        const target = item.target || {};
        const title: string = target.title || '';
        const excerpt: string = target.excerpt || '';

        // Match keyword in title or excerpt
        if (!title.toLowerCase().includes(keyword.toLowerCase()) &&
            !excerpt.toLowerCase().includes(keyword.toLowerCase())) {
          continue;
        }

        matched.push({
          title,
          snippet: excerpt || title,
          url: target.url || `https://www.zhihu.com/question/${target.id}`,
          source: '知乎热榜',
          platform: '知乎',
          category: '',
          relevance_score: Math.min(100, item.detail_text ? parseInt(item.detail_text) || 50 : 50),
          sentiment_score: 50,
        });
      }

      console.log(`[知乎] Hot list: ${items.length} total, ${matched.length} matched "${keyword}"`);
      return matched;
    } catch (err: any) {
      console.error(`[知乎] Error: ${err.message}`);
      return [];
    }
  },
};
