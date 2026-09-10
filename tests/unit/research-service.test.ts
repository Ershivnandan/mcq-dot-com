import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ResearchService } from "@/server/services/research.service";

describe("ResearchService", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("extracts clean search query from user prompt", () => {
    const cleanFn = (ResearchService as any).constructSearchQuery;
    expect(cleanFn("Generate 5 questions on Indian Constitution")).toBe("Indian Constitution");
    expect(cleanFn("Create MCQs about Quantum Computing with 4 options")).toBe("Quantum Computing");
    expect(cleanFn("Make a quiz for G20 Summit")).toBe("G20 Summit");
    expect(cleanFn("", "Current Affairs")).toBe("Current Affairs");
  });

  it("cleans HTML entities and tags properly", () => {
    const cleanTextFn = (ResearchService as any).cleanText;
    const dirty = "<p>India &amp; China reach <b>agreement</b> on border &lt;dispute&gt;</p>";
    expect(cleanTextFn(dirty)).toBe("India & China reach agreement on border <dispute>");
  });

  it("fetches and synthesizes research context from mock responses", async () => {
    const mockRssXml = `
      <rss version="2.0">
        <channel>
          <title>Google News</title>
          <item>
            <title><![CDATA[India successfully tests new defense missile - TechNews]]></title>
            <pubDate>Thu, 10 Sep 2026 10:00:00 GMT</pubDate>
            <description><![CDATA[The test was conducted off the coast of Odisha.]]></description>
            <source url="https://technews.com">TechNews</source>
          </item>
        </channel>
      </rss>
    `;

    const mockDdgHtml = `
      <html>
        <body>
          <a class="result__snippet" href="#">Defense Research Organization conducted a high-altitude hypersonic flight test.</a>
        </body>
      </html>
    `;

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("news.google.com")) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(mockRssXml),
        });
      }
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(mockDdgHtml),
      });
    });

    const result = await ResearchService.fetchResearchContext(
      "Generate 5 questions on today's missile test",
      "Current Affairs"
    );

    expect(result).toContain("VERIFIED REAL-TIME RESEARCH DATA");
    expect(result).toContain("India successfully tests new defense missile");
    expect(result).toContain("The test was conducted off the coast of Odisha");
    expect(result).toContain("Defense Research Organization conducted a high-altitude");
    expect(result).toContain("INSTRUCTION FOR QUESTION GENERATION");
  });

  it("handles fetch failure gracefully without throwing", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network timeout"));

    const result = await ResearchService.fetchResearchContext(
      "Generate questions on Artificial Intelligence",
      "Science"
    );

    expect(result).toBe("");
  });
});
