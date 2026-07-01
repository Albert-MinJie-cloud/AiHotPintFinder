---
name: sentinel-hotspot-monitor
description: >-
  Monitor and discover trending hot spots for specific keywords using AI-powered content analysis.
  Use when the user wants to track trending topics, monitor keywords for new developments, detect fake or misleading content, or automatically collect hot spot data within a specific domain.
  This skill is designed for AI agents that need to search for, analyze, and return structured hot spot data with authenticity verification.
trigger: hot spot monitoring, keyword tracking, trend discovery, content authenticity check, topic surveillance
---

# Sentinel Hotspot Monitor Agent Skill

A skill for AI agents to monitor, discover, and analyze trending hot spots using DeepSeek AI. This skill can operate in two modes:

## Quick Start

Two ways to use this skill:

### Mode A: Full Backend (recommended for persistent monitoring)

The Sentinel backend provides persistent keyword monitoring with periodic scraping, real-time notifications via Socket.io, and historical data storage.

```bash
cd /path/to/AiHotPointFinder/backend
cp .env.example .env  # Set DEEPSEEK_API_KEY
npm install && npm run dev
```

The backend runs on `http://localhost:3001` and provides REST API + WebSocket endpoints.

### Mode B: Direct Script (for ad-hoc analysis)

Use the bundled script for one-shot analysis without starting the server:

```bash
python3 scripts/analyze.py --keyword "AI编程" --scope "technology"
```

Or use DeepSeek directly (see `references/api-usage.md`).

## API Reference

### Keywords

```
POST /api/keywords   Body: { "keyword": "AI编程", "scope": "technology" }
GET  /api/keywords
DELETE /api/keywords/:id
PATCH /api/keywords/:id/toggle
```

### Scraping & Hotspots

```
POST /api/scrape              # Scrape all keywords
POST /api/scrape/:keywordId   # Scrape specific keyword
GET  /api/hotspots?keyword_id=&limit=50
GET  /api/hotspots/recent      # Last 24 hours
GET  /api/hotspots/summary     # Aggregated by keyword
```

### Notifications & Health

```
GET  /api/hotspots/notifications?limit=50
PATCH /api/hotspots/notifications/read-all
GET  /api/health
```

### Data Models

**HotSpot:**
```json
{
  "id": "uuid",
  "keyword": "AI编程",
  "title": "OpenAI Launches Codex 2.0",
  "url": "https://...",
  "source": "Hacker News",
  "summary": "OpenAI released...",
  "hot_score": 90,
  "is_authentic": 1,
  "authenticity_score": 0.95,
  "authenticity_reason": "AI analysis result",
  "detected_at": "2026-06-30T11:36:10.011Z"
}
```

**Keyword:**
```json
{
  "id": "uuid",
  "keyword": "AI编程",
  "scope": "technology",
  "is_active": 1,
  "last_checked_at": "2026-06-30T11:36:10.011Z"
}
```

## Workflow for Agent Tasks

### 1. Quick Keyword Research (no backend needed)

Use the DeepSeek service directly to fetch trending content about a keyword:

The `scripts/analyze.py` script provides a CLI interface:

```bash
# Analyze a single keyword
python3 scripts/analyze.py --keyword "AI编程"

# With scope and output format
python3 scripts/analyze.py --keyword "DeepSeek" --scope "AI industry" --format json

# Verify content authenticity
python3 scripts/analyze.py --keyword "GPT-5" --verify --title "Rumored title" --content "Content to verify"

# Save results to file
python3 scripts/analyze.py --keyword "AI编程" --output /tmp/hotspots.json
```

### 2. Setting Up Long-term Monitoring

When the user wants continuous monitoring:

1. **Install and start the backend** (Mode A above)
2. **Add keywords** via POST /api/keywords
3. **Trigger initial scrape** via POST /api/scrape
4. **Read results** via GET /api/hotspots
5. **Interpret AI analysis** — each result includes:
   - `is_authentic`: Whether content passed AI authenticity check
   - `authenticity_score`: 0.0 to 1.0 confidence score
   - `authenticity_reason`: AI's reasoning for the verdict
   - `hot_score`: 0-100 trending score based on relevance and impact

### 3. Content Authenticity Analysis

When the user needs to verify if a piece of content is genuine:

The DeepSeek AI evaluates:
- **Relevance**: Is this genuinely about the keyword?
- **Signal vs Noise**: Is it legitimate content or spam/clickbait?
- **Credibility**: Are there real sources, coherent writing?
- **Utility**: Would this be useful for someone monitoring the topic?

Results include a JSON with `isAuthentic`, `score`, and `reason` fields.

### 4. Periodic Monitoring

The backend's node-cron scheduler (default: every 30 minutes) automatically collects new hot spots for all active keywords. The agent can:

- Check `GET /api/hotspots/recent` for new items
- Read `GET /api/hotspots/notifications` for alerts on high-scoring items
- Listen for Socket.io events (`notification`, `hotSpots:update`, `keyword:update`) for real-time updates

## Interpretation Guide

**Hot Score Ranges:**
- 75-100: Breaking/Highly trending — likely worth immediate attention
- 50-74: Notable development — worth monitoring
- 25-49: Background noise — possibly relevant but not urgent
- 0-24: Low signal — may not be worth further investigation

**Authenticity Score:**
- 0.8-1.0: High confidence — content appears genuine and well-sourced
- 0.5-0.7: Medium confidence — some concerns but probably legitimate
- 0.0-0.4: Low confidence — likely fake, spam, or misleading content

**Notification Triggers:**
Notifications are automatically created when a hot spot scores >= 60. These represent the most important developments for monitored keywords.

## Error Handling

1. **API returns 409**: Keyword already exists — use PATCH /api/keywords/:id/toggle to reactivate it
2. **Empty results**: The keyword may be too narrow. Try broader terms or adjust scope
3. **Authentication failure**: Check that DEEPSEEK_API_KEY is set in .env
4. **Socket disconnected**: The system auto-reconnects; check `GET /api/health` for server status

## Dependencies

- Node.js 18+
- DeepSeek API key (set in `.env` as `DEEPSEEK_API_KEY`)
- For Mode B: Python 3 with `requests` library (`pip3 install requests`)
- Internet connection for DeepSeek API calls
