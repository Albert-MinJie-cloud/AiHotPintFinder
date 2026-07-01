import * as cheerio from 'cheerio';
import axios from 'axios';
import type { SourceAdapter, RawSearchResult } from './types';

// Rate limit: at least 3 seconds between requests
const MIN_INTERVAL_MS = 3000;
let lastRequestTime = 0;

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const wait = MIN_INTERVAL_MS - (now - lastRequestTime);
  if (wait > 0) {
    await new Promise(r => setTimeout(r, wait));
  }
  lastRequestTime = Date.now();
}

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ====== DuckDuckGo HTML scraper ======
async function searchDuckDuckGo(query: string): Promise<RawSearchResult[]> {
  await rateLimit();

  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await axios.get(url, {
    headers: {
      'User-Agent': randomUA(),
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    },
    timeout: 15000,
  });

  const $ = cheerio.load(response.data);
  const results: RawSearchResult[] = [];

  $('.result').each((_i, el) => {
    const $el = $(el);
    const $link = $el.find('.result__title a, .result__a');
    const $snippet = $el.find('.result__snippet');

    const title = $link.text().trim();
    const snippet = $snippet.text().trim();
    let href = $link.attr('href') || '';

    // DuckDuckGo wraps URLs in redirect, extract real URL
    const uddMatch = href.match(/uddg=(https?:\/\/[^&]+)/);
    if (uddMatch) {
      href = decodeURIComponent(uddMatch[1]);
    }

    if (title && snippet) {
      results.push({
        title,
        snippet,
        url: href,
        source: 'Web Search',
        platform: 'DuckDuckGo',
        category: '',
        relevance_score: 0,
        sentiment_score: 50,
      });
    }
  });

  return results.slice(0, 8);
}

// ====== Bing search scraper (fallback) ======
async function searchBing(query: string): Promise<RawSearchResult[]> {
  await rateLimit();

  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=zh-cn`;
  const response = await axios.get(url, {
    headers: {
      'User-Agent': randomUA(),
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    },
    timeout: 15000,
  });

  const $ = cheerio.load(response.data);
  const results: RawSearchResult[] = [];

  // Bing search result selectors
  $('li.b_algo').each((_i, el) => {
    const $el = $(el);
    const $link = $el.find('h2 a');
    const $snippet = $el.find('.b_caption p, .b_lineclamp2');

    const title = $link.text().trim();
    const snippet = $snippet.text().trim();
    const href = $link.attr('href') || '';

    if (title && snippet) {
      results.push({
        title,
        snippet,
        url: href,
        source: 'Web Search',
        platform: 'Bing',
        category: '',
        relevance_score: 0,
        sentiment_score: 50,
      });
    }
  });

  return results.slice(0, 8);
}

// ====== WebSearchAdapter ======
export const webSearchAdapter: SourceAdapter = {
  name: 'Web Search',

  async fetchResults(keyword: string, _scope?: string): Promise<RawSearchResult[]> {
    console.log(`[WebSearch] Searching for: "${keyword}"`);

    try {
      // Try DuckDuckGo first
      const ddgResults = await searchDuckDuckGo(keyword);
      if (ddgResults.length > 0) {
        console.log(`[WebSearch] DuckDuckGo returned ${ddgResults.length} results`);
        return ddgResults;
      }
    } catch (err: any) {
      console.warn(`[WebSearch] DuckDuckGo failed: ${err.message}, trying Bing...`);
    }

    try {
      // Fallback to Bing
      const bingResults = await searchBing(keyword);
      console.log(`[WebSearch] Bing returned ${bingResults.length} results`);
      return bingResults;
    } catch (err: any) {
      console.error(`[WebSearch] Bing also failed: ${err.message}`);
      return [];
    }
  },
};
