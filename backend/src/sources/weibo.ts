import axios from 'axios';
import type { SourceAdapter, RawSearchResult } from './types';

let lastRequest = 0;

async function rateLimit(): Promise<void> {
  const wait = 3000 - (Date.now() - lastRequest);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequest = Date.now();
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

export const weiboAdapter: SourceAdapter = {
  name: '微博热搜',

  async fetchResults(keyword: string): Promise<RawSearchResult[]> {
    await rateLimit();
    console.log(`[微博] Fetching hot search, searching for: "${keyword}"`);

    try {
      const res = await axios.get('https://weibo.com/ajax/side/hotSearch', {
        headers: {
          'User-Agent': UA,
          'Accept': 'application/json',
          'Referer': 'https://weibo.com/',
        },
        timeout: 10000,
      });

      const realtime: any[] = res.data?.data?.realtime || [];
      const matched: RawSearchResult[] = [];

      for (const item of realtime) {
        const word: string = item.word || '';
        const rawUrl: string = item.url || '';

        if (!word.toLowerCase().includes(keyword.toLowerCase())) continue;

        matched.push({
          title: word,
          snippet: item.rank ? `热搜第${item.rank}位` : '',
          url: rawUrl.startsWith('http') ? rawUrl : `https://s.weibo.com/weibo?q=${encodeURIComponent(word)}`,
          source: '微博热搜',
          platform: '微博',
          category: item.category || '',
          relevance_score: item.rank ? Math.max(0, 100 - (item.rank - 1) * 10) : 50,
          sentiment_score: 50,
        });
      }

      console.log(`[微博] Hot search: ${realtime.length} total, ${matched.length} matched "${keyword}"`);
      return matched;
    } catch (err: any) {
      console.error(`[微博] Error: ${err.message}`);
      return [];
    }
  },
};
