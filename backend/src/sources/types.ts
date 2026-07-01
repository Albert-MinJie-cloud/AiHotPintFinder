import type { TrendingItem } from '../services/deepseek';

// Common search result from any source before AI enrichment
export interface RawSearchResult {
  title: string;
  snippet: string;       // short summary / tweet text
  url: string;
  source: string;        // e.g. "Web Search", "Twitter/X"
  platform: string;      // e.g. "DuckDuckGo", "微博热搜", "Twitter"
  category: string;      // will be filled by AI later
  relevance_score: number;
  sentiment_score: number; // will be filled by AI later
}

// Every source must implement this
export interface SourceAdapter {
  readonly name: string;
  fetchResults(keyword: string, scope?: string): Promise<RawSearchResult[]>;
}
