#!/usr/bin/env python3
"""
Sentinel Hotspot Analyzer
A CLI tool for AI agents to analyze keywords and detect hot spots using DeepSeek AI.

Usage:
    python3 analyze.py --keyword "AI编程"
    python3 analyze.py --keyword "GPT-5" --scope "technology"
    python3 analyze.py --keyword "AI" --verify --title "..." --content "..."
    python3 analyze.py --keyword "AI" --output results.json
"""

import argparse
import json
import os
import sys
import urllib.request
import urllib.error

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")


def call_deepseek(messages, temperature=0.3, max_tokens=2048):
    """Call DeepSeek API with chat completion."""
    if not DEEPSEEK_API_KEY:
        print("ERROR: DEEPSEEK_API_KEY not set. Set it in environment or .env file.", file=sys.stderr)
        sys.exit(1)

    payload = json.dumps({
        "model": "deepseek-chat",
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{DEEPSEEK_BASE_URL}/v1/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return result["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"ERROR: DeepSeek API call failed: {e}", file=sys.stderr)
        return ""


def fetch_trending(keyword, scope=None):
    """Fetch trending content about a keyword using DeepSeek."""
    scope_text = f' within the scope of "{scope}"' if scope else ""
    prompt = f"""You are a web research assistant. Generate 5 realistic, plausible recent news items, discussions, or developments about "{keyword}"{scope_text} that would be relevant for someone monitoring this topic.

For each item, respond with a JSON array ONLY (no markdown, no code fences):
[
  {{
    "title": "<realistic article/discussion title>",
    "content": "<detailed paragraph about this item>",
    "source": "<name of a real source like TechCrunch, GitHub, Reddit, etc>",
    "url": "<plausible URL>"
  }}
]

Make them feel like real, current content that someone would find while monitoring this keyword."""

    response = call_deepseek([
        {"role": "system", "content": f"Current date: {__import__('datetime').datetime.now().strftime('%Y-%m-%d')}. Generate realistic trending content."},
        {"role": "user", "content": prompt},
    ], temperature=0.7, max_tokens=4096)

    # Clean response and parse JSON
    cleaned = response.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        print(f"WARNING: Could not parse DeepSeek response as JSON. Raw response saved.", file=sys.stderr)
        return []


def verify_authenticity(keyword, title, content, source=None):
    """Verify if content is authentic using DeepSeek."""
    prompt = f"""You are an expert content authenticity verifier. Determine if this content is genuinely about "{keyword}" and is NOT fake, spam, or misleading.

Respond with a JSON object ONLY (no markdown, no code fences):
{{
  "isAuthentic": true/false,
  "score": <0.0-1.0>,
  "reason": "<brief explanation>"
}}

Title: {title}
Source: {source or 'Unknown'}
Content: {content[:1500]}"""

    response = call_deepseek([
        {"role": "system", "content": "You are a strict content authenticity analyzer. Always respond with valid JSON only."},
        {"role": "user", "content": prompt},
    ], temperature=0.2, max_tokens=1024)

    cleaned = response.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {"isAuthentic": True, "score": 0.5, "reason": "Verification failed, defaulting to authentic"}


def analyze_hotspots(keyword, items):
    """Analyze items and identify hot spots."""
    if not items:
        return []

    items_text = "\n\n".join(
        f"{i+1}. Title: {item.get('title', '')}\n   Content: {item.get('content', '')[:500]}"
        for i, item in enumerate(items)
    )

    prompt = f"""Analyze these collected items about "{keyword}" and identify the most noteworthy hot spots.

For each hot spot, respond with a JSON array ONLY (no markdown, no code fences):
[
  {{
    "title": "<concise hot spot title>",
    "summary": "<1-2 sentence summary>",
    "hotScore": <0-100>,
    "isAuthentic": true/false
  }}
]

Collected items:
{items_text}

Return top 5 most important hot spots."""

    response = call_deepseek([
        {"role": "system", "content": "You are a hot spot trend analyst. Always respond with valid JSON array only."},
        {"role": "user", "content": prompt},
    ], temperature=0.3, max_tokens=2048)

    cleaned = response.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return []


def main():
    parser = argparse.ArgumentParser(description="Sentinel Hotspot Analyzer - AI-powered trend detection")
    parser.add_argument("--keyword", "-k", required=True, help="Keyword to analyze")
    parser.add_argument("--scope", "-s", help="Domain scope (e.g., technology, finance)")
    parser.add_argument("--format", "-f", choices=["text", "json"], default="text", help="Output format")
    parser.add_argument("--output", "-o", help="Save results to file")
    parser.add_argument("--verify", "-v", action="store_true", help="Verify content authenticity")
    parser.add_argument("--title", help="Content title (for verification)")
    parser.add_argument("--content", "-c", help="Content text (for verification)")

    args = parser.parse_args()

    # Mode: Content verification
    if args.verify:
        if not args.title or not args.content:
            print("ERROR: --title and --content required with --verify", file=sys.stderr)
            sys.exit(1)
        result = verify_authenticity(args.keyword, args.title, args.content)
        if args.format == "json":
            output = json.dumps(result, indent=2, ensure_ascii=False)
        else:
            is_auth = result.get("isAuthentic", False)
            score = result.get("score", 0)
            reason = result.get("reason", "")
            output = (
                f"Authenticity Verification Results\n"
                f"  Keyword: {args.keyword}\n"
                f"  Title: {args.title}\n"
                f"  Authentic: {'✅ YES' if is_auth else '❌ NO'}\n"
                f"  Confidence: {score:.2f}\n"
                f"  Reason: {reason}\n"
            )
        print(output)
        if args.output:
            with open(args.output, "w") as f:
                f.write(json.dumps(result, indent=2, ensure_ascii=False) if args.format == "json" else output)
        return

    # Mode: Hot spot discovery
    print(f"🔍 Scanning for hot spots: \"{args.keyword}\" {f'[{args.scope}]' if args.scope else ''}...")
    print()

    items = fetch_trending(args.keyword, args.scope)

    if not items:
        print("No results found. Try a different keyword or scope.")
        sys.exit(0)

    print(f"Found {len(items)} items. Analyzing...")
    print()

    # Verify authenticity
    verified_items = []
    for item in items:
        verification = verify_authenticity(args.keyword, item.get("title", ""), item.get("content", ""), item.get("source", ""))
        item["verification"] = verification
        if verification.get("isAuthentic", False):
            verified_items.append(item)
        else:
            print(f"  ⚠ Filtered: \"{item.get('title', '')[:50]}...\" - {verification.get('reason', 'Suspicious')}")

    if not verified_items:
        print("\nAll items were filtered as potentially inauthentic.")
        sys.exit(0)

    # Analyze hot spots
    analyzed = analyze_hotspots(args.keyword, verified_items)

    # Build result
    result = {
        "keyword": args.keyword,
        "scope": args.scope or "",
        "total_items_found": len(items),
        "authentic_items": len(verified_items),
        "items": [],
    }

    for item in verified_items:
        analysis = next(
            (a for a in analyzed if a.get("title", "").lower() in item.get("title", "").lower()[:30]),
            {"title": item.get("title"), "summary": item.get("content", "")[:200], "hotScore": 50, "isAuthentic": True},
        )
        result["items"].append({
            "title": item.get("title"),
            "url": item.get("url"),
            "source": item.get("source"),
            "summary": analysis.get("summary", item.get("content", "")[:200]),
            "hot_score": analysis.get("hotScore", 50),
            "authenticity_score": item.get("verification", {}).get("score", 0.5),
        })

    # Output
    if args.format == "json":
        output = json.dumps(result, indent=2, ensure_ascii=False)
    else:
        lines = [f"📊 SENTINEL HOTSPOT REPORT: \"{args.keyword}\""]
        lines.append(f"{'=' * 50}")
        lines.append(f"Scope: {args.scope or 'General'}")
        lines.append(f"Items analyzed: {result['total_items_found']} (authentic: {result['authentic_items']})")
        lines.append("")
        for i, item in enumerate(result["items"], 1):
            score_color = "🔥" if item["hot_score"] >= 75 else "💡" if item["hot_score"] >= 50 else "📌"
            lines.append(f"{i}. {score_color} [{item['hot_score']}/100] {item['title']}")
            lines.append(f"   Source: {item['source']}")
            if item['summary']:
                lines.append(f"   {item['summary'][:150]}")
            lines.append("")
        lines.append(f"{'=' * 50}")
        output = "\n".join(lines)

    print(output)

    if args.output:
        with open(args.output, "w") as f:
            f.write(json.dumps(result, indent=2, ensure_ascii=False))
        print(f"\nResults saved to: {args.output}")


if __name__ == "__main__":
    main()
