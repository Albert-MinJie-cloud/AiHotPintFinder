import axios from 'axios';
import type { SourceAdapter, RawSearchResult } from './types';

// twitterapi.io — third-party Twitter API proxy
// Docs: https://twitterapi.io
const TWITTER_API_BASE = process.env.TWITTER_API_BASE || 'https://twitterapi.io/api';
const TWITTER_API_KEY = process.env.TWITTER_API_KEY || '';

// Rate limit: at least 2 seconds between requests (API has its own limits)
const MIN_INTERVAL_MS = 2000;
let lastRequestTime = 0;

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const wait = MIN_INTERVAL_MS - (now - lastRequestTime);
  if (wait > 0) {
    await new Promise(r => setTimeout(r, wait));
  }
  lastRequestTime = Date.now();
}

export const twitterAdapter: SourceAdapter = {
  name: 'Twitter/X',

  async fetchResults(keyword: string, _scope?: string): Promise<RawSearchResult[]> {
    if (!TWITTER_API_KEY) {
      console.log('[Twitter] No TWITTER_API_KEY configured, skipping Twitter source');
      return [];
    }

    await rateLimit();

    console.log(`[Twitter] Searching tweets for: "${keyword}"`);

    try {
      // Search tweets endpoint
      const response = await axios.get(`${TWITTER_API_BASE}/search`, {
        params: {
          q: keyword,
          limit: 10,
          lang: 'zh',
        },
        headers: {
          'X-API-Key': TWITTER_API_KEY,
          'Accept': 'application/json',
        },
        timeout: 15000,
      });

      // Response shape depends on twitterapi.io's format.
      // Common patterns: { tweets: [...] } or { data: [...] } or [ ... ]
      const data = response.data;
      const tweets: any[] = Array.isArray(data)
        ? data
        : data.tweets || data.data || data.results || [];

      const results: RawSearchResult[] = tweets.map((tweet: any) => ({
        title: (tweet.text || tweet.content || '').substring(0, 120),
        snippet: tweet.text || tweet.content || '',
        url: tweet.url || tweet.link || `https://twitter.com/i/status/${tweet.id}`,
        source: 'Twitter/X',
        platform: 'Twitter',
        category: '',
        relevance_score: tweet.likes || tweet.favorite_count
          ? Math.min(100, (tweet.likes || tweet.favorite_count || 0) / 10)
          : 50,
        sentiment_score: 50, // AI will reassess
      }));

      console.log(`[Twitter] Fetched ${results.length} tweets`);
      return results.slice(0, 10);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.error('[Twitter] Authentication failed — check TWITTER_API_KEY');
      } else if (err.response?.status === 429) {
        console.warn('[Twitter] Rate limited, skipping this cycle');
      } else {
        console.error(`[Twitter] API error: ${err.message}`);
      }
      return [];
    }
  },
};
