/**
 * Real-Time Research Service
 * Provides live web search and real-time news retrieval to ground AI question generation
 * in verified, up-to-date facts and current affairs.
 */

interface ResearchItem {
  title?: string;
  date?: string;
  source?: string;
  content: string;
}

export class ResearchService {
  /**
   * Cleans HTML markup and unescapes basic entities.
   */
  private static cleanText(html: string): string {
    return html
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Fetches latest news items from Google News RSS.
   */
  private static async fetchGoogleNews(query: string, maxItems = 6): Promise<ResearchItem[]> {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) return [];

      const xml = await res.text();
      const items: ResearchItem[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match: RegExpExecArray | null;

      while ((match = itemRegex.exec(xml)) !== null && items.length < maxItems) {
        const itemContent = match[1];
        const titleMatch = itemContent.match(/<title>(.*?)<\/title>/);
        const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
        const descMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/);
        const sourceMatch = itemContent.match(/<source[^>]*>(.*?)<\/source>/);

        const rawTitle = titleMatch ? this.cleanText(titleMatch[1]) : "";
        const rawDate = pubDateMatch ? this.cleanText(pubDateMatch[1]) : "";
        const rawDesc = descMatch ? this.cleanText(descMatch[1]) : "";
        const rawSource = sourceMatch ? this.cleanText(sourceMatch[1]) : "";

        if (rawTitle) {
          items.push({
            title: rawTitle,
            date: rawDate,
            source: rawSource,
            content: rawDesc && rawDesc !== rawTitle ? rawDesc : rawTitle,
          });
        }
      }

      return items;
    } catch {
      return [];
    }
  }

  /**
   * Fetches web search snippets via DuckDuckGo HTML.
   */
  private static async fetchWebSnippets(query: string, maxItems = 5): Promise<ResearchItem[]> {
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) return [];

      const html = await res.text();
      const snippets: ResearchItem[] = [];
      const snippetRegex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
      let match: RegExpExecArray | null;

      while ((match = snippetRegex.exec(html)) !== null && snippets.length < maxItems) {
        const cleanSnippet = this.cleanText(match[1]);
        if (cleanSnippet && cleanSnippet.length > 20) {
          snippets.push({
            content: cleanSnippet,
          });
        }
      }

      return snippets;
    } catch {
      return [];
    }
  }

  /**
   * Determines effective search query from prompt and topic,
   * prioritizing exact questions when provided by the user.
   */
  static constructSearchQuery(prompt: string, topic?: string): string {
    const trimmed = prompt.trim();

    // Check if the prompt directly contains a specific question sentence (e.g., ending in '?')
    const questionMatch = trimmed.match(/([^.?!]*\?)/);
    if (questionMatch && questionMatch[1].trim().length > 5) {
      let q = questionMatch[1].trim();
      // Remove leading instructions like "Generate 5 questions on"
      q = q.replace(/^(generate|create|make|write|give me|produce)\s+(a\s+|an\s+)?(\d+\s+)?(mcqs?|questions?|quiz|test)?\s*(on|about|for|regarding)?\s*/i, "").trim();
      if (q.length > 5) return q;
    }

    // Strip common instructional framing (e.g., "Generate 5 questions on...", "Create MCQs about...")
    let cleanPrompt = trimmed
      .replace(/^(generate|create|make|write|give me|produce)\s+(a\s+|an\s+)?(\d+\s+)?(mcqs?|questions?|quiz|test)?\s*(on|about|for|regarding)?\s*/i, "")
      .replace(/\s*(with|having)\s+\d+\s+options.*/i, "")
      .trim();

    // If cleanPrompt looks like an exact query/question (e.g. "What is...", "Why does...", "Explain..."), keep it
    if (cleanPrompt) {
      return cleanPrompt;
    }

    return topic || "current affairs";
  }

  /**
   * Fetches and synthesizes real-time research context for AI question generation.
   */
  static async fetchResearchContext(prompt: string, topic?: string): Promise<string> {
    const searchQuery = this.constructSearchQuery(prompt, topic);
    const todayStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Check if query is news/current affairs oriented or general
    const isCurrentAffairs =
      /today|latest|news|current|affairs|recent|update|202[4-9]/i.test(prompt) ||
      (topic && /current|news|affairs|politics|international/i.test(topic));

    const [newsItems, webSnippets] = await Promise.all([
      this.fetchGoogleNews(isCurrentAffairs ? searchQuery : `${searchQuery} news`),
      this.fetchWebSnippets(searchQuery),
    ]);

    const parts: string[] = [];
    parts.push(`=== VERIFIED REAL-TIME RESEARCH DATA (Retrieved: ${todayStr}) ===`);
    parts.push(`Search Topic: ${searchQuery}`);

    if (newsItems.length > 0) {
      parts.push("\n--- LATEST NEWS HEADLINES & DEVELOPMENTS ---");
      for (const item of newsItems) {
        const datePart = item.date ? ` [${item.date}]` : "";
        const sourcePart = item.source ? ` (${item.source})` : "";
        parts.push(`• ${item.title}${sourcePart}${datePart}`);
        if (item.content && item.content !== item.title) {
          parts.push(`  Details: ${item.content}`);
        }
      }
    }

    if (webSnippets.length > 0) {
      parts.push("\n--- WEB KNOWLEDGE & FACTUAL DETAILS ---");
      for (const snippet of webSnippets) {
        parts.push(`• ${snippet.content}`);
      }
    }

    if (newsItems.length === 0 && webSnippets.length === 0) {
      return "";
    }

    parts.push("\n=== END RESEARCH DATA ===");
    parts.push("INSTRUCTION FOR QUESTION GENERATION: Use the factual research data above as the primary source of truth. Ensure correct options, dates, names, and explanations accurately reflect these real-world facts.");

    return parts.join("\n");
  }
}
