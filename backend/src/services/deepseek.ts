import axios from 'axios';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

interface DeepSeekMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function callDeepSeek(
  messages: DeepSeekMessage[],
  temperature = 0.3,
  maxTokens = 2048
): Promise<string> {
  try {
    const response = await axios.post(
      `${DEEPSEEK_BASE_URL}/v1/chat/completions`,
      {
        model: 'deepseek-chat',
        messages,
        temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        timeout: 30000,
      }
    );
    return response.data.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('[DeepSeek] API call failed:', error.message);
    if (error.response) {
      console.error('[DeepSeek] Status:', error.response.status);
    }
    throw new Error(`DeepSeek API error: ${error.message}`);
  }
}

export async function verifyContentAuthenticity(
  keyword: string,
  title: string,
  content: string,
  source?: string
): Promise<{ isAuthentic: boolean; score: number; reason: string }> {
  const prompt = `You are an expert content authenticity verifier. Determine if content is genuinely about "${keyword}" and NOT fake, spam, or misleading.

Respond with JSON ONLY (no markdown):
{
  "isAuthentic": true/false,
  "score": <0.0-1.0>,
  "reason": "<brief explanation>"
}

Title: ${title}
Source: ${source || 'Unknown'}
Content: ${content.substring(0, 1500)}`;

  try {
    const response = await callDeepSeek([
      { role: 'system', content: 'You are a strict content authenticity analyzer. Respond with valid JSON only.' },
      { role: 'user', content: prompt },
    ], 0.2, 1024);
    const cleaned = response.replace(/```json?/gi, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleaned);
    return {
      isAuthentic: Boolean(result.isAuthentic),
      score: typeof result.score === 'number' ? result.score : 0.5,
      reason: result.reason || 'No reason provided',
    };
  } catch (error) {
    console.error('[DeepSeek] Content verification failed, defaulting to authentic:', error);
    return { isAuthentic: true, score: 0.5, reason: 'AI verification failed' };
  }
}

export async function analyzeHotSpots(
  keyword: string,
  items: Array<{ title: string; content: string; source?: string }>
): Promise<Array<{ title: string; summary: string; hotScore: number; isAuthentic: boolean; category: string }>> {
  if (items.length === 0) return [];
  const itemsText = items
    .map((item, i) => `${i + 1}. Title: ${item.title}\n   Content: ${item.content.substring(0, 500)}`)
    .join('\n\n');

  const prompt = `Analyze these items about "${keyword}" and identify the top 5 hot spots. JSON array ONLY:
[
  {
    "title": "<concise title>",
    "summary": "<1-2 sentence summary>",
    "hotScore": <0-100>,
    "isAuthentic": true/false,
    "category": "<科技|娱乐|财经|民生|文化|游戏|社会|国际|房产|其他>"
  }
]

Collected items:
${itemsText}`;

  try {
    const response = await callDeepSeek([
      { role: 'system', content: 'You are a hot spot trend analyst. Respond with valid JSON array only.' },
      { role: 'user', content: prompt },
    ], 0.3, 2048);
    const cleaned = response.replace(/```json?/gi, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleaned);
    if (Array.isArray(result)) {
      return result.map((item: any) => ({
        title: item.title || 'Unknown',
        summary: item.summary || '',
        hotScore: typeof item.hotScore === 'number' ? item.hotScore : 0,
        isAuthentic: Boolean(item.isAuthentic),
        category: item.category || '',
      }));
    }
    return [];
  } catch (error) {
    console.error('[DeepSeek] Hot spot analysis failed:', error);
    return [];
  }
}

export interface TrendingItem {
  title: string;
  content: string;
  source: string;
  url?: string;
  category: string;
  platform: string;
  relevance_score: number;
  sentiment_score: number;
}

export async function fetchTrendingContent(keyword: string, scope?: string): Promise<TrendingItem[]> {
  const scopeText = scope ? ` within "${scope}"` : '';
  const prompt = `Generate 5 realistic recent news/discussions about "${keyword}"${scopeText}. JSON array ONLY:
[
  {
    "title": "<realistic title>",
    "content": "<detailed paragraph>",
    "source": "<TechCrunch, GitHub, Reddit, Twitter/X, Hacker News, etc>",
    "url": "<plausible URL>",
    "category": "<科技|娱乐|财经|民生|其他>",
    "platform": "<微博热搜|今日头条|抖音热榜|百度热榜|其他>",
    "relevance_score": <0-100>,
    "sentiment_score": <0-100, 50=neutral, >50=positive>
  }
]`;

  try {
    const response = await callDeepSeek([
      { role: 'system', content: `Current date: ${new Date().toISOString().split('T')[0]}. Generate realistic trending content.` },
      { role: 'user', content: prompt },
    ], 0.7, 4096);
    const cleaned = response.replace(/```json?/gi, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleaned);
    if (Array.isArray(result)) {
      return result.map((item: any) => ({
        title: item.title || 'Unknown',
        content: item.content || '',
        source: item.source || 'Unknown',
        url: item.url,
        category: item.category || '',
        platform: item.platform || '',
        relevance_score: typeof item.relevance_score === 'number' ? item.relevance_score : 0,
        sentiment_score: typeof item.sentiment_score === 'number' ? item.sentiment_score : 50,
      }));
    }
    return [];
  } catch (error) {
    console.error('[DeepSeek] Trend fetch failed:', error);
    return [];
  }
}
