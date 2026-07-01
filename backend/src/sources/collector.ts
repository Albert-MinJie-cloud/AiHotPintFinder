import type { SourceAdapter, RawSearchResult } from "./types";
import type { TrendingItem } from "../services/deepseek";
import { webSearchAdapter } from "./web-search";
import { zhihuAdapter } from "./zhihu";
import { weiboAdapter } from "./weibo";
import { juejinAdapter } from "./juejin";

// All active sources — add new adapters here
const SOURCES: SourceAdapter[] = [
  webSearchAdapter,
  zhihuAdapter,
  weiboAdapter,
  juejinAdapter,
];

export async function collectFromAllSources(
  keyword: string,
  scope?: string,
): Promise<TrendingItem[]> {
  console.log(
    `[Collector] Fetching from ${SOURCES.length} sources for "${keyword}"`,
  );

  const sourceResults = await Promise.allSettled(
    SOURCES.map((source) =>
      source.fetchResults(keyword, scope).catch((err) => {
        console.error(
          `[Collector] Source "${source.name}" failed:`,
          err.message,
        );
        return [] as RawSearchResult[];
      }),
    ),
  );

  const allResults: RawSearchResult[] = [];
  for (const result of sourceResults) {
    if (result.status === "fulfilled") {
      allResults.push(...result.value);
    }
  }

  console.log(
    `[Collector] Got ${allResults.length} raw results, deduplicating...`,
  );
  const deduped = deduplicateByTitle(allResults);
  console.log(`[Collector] After dedup: ${deduped.length} unique results`);

  return deduped.map((r) => ({
    title: r.title,
    content: r.snippet,
    source: r.source,
    url: r.url,
    category: r.category,
    platform: r.platform,
    relevance_score: r.relevance_score,
    sentiment_score: r.sentiment_score,
  }));
}

function deduplicateByTitle(results: RawSearchResult[]): RawSearchResult[] {
  const seen = new Set<string>();
  const unique: RawSearchResult[] = [];

  for (const r of results) {
    const normalized = r.title
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff]/g, "")
      .substring(0, 60);

    if (!seen.has(normalized) && normalized.length > 3) {
      seen.add(normalized);
      unique.push(r);
    }
  }

  return unique;
}
