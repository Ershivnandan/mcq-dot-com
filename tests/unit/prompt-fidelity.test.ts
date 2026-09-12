import { describe, it, expect } from "vitest";
import { ResearchService } from "@/server/services/research.service";

describe("Prompt Exact Question Fidelity & Research Query", () => {
  it("extracts exact questions ending with '?' directly", () => {
    const q1 = ResearchService.constructSearchQuery("What is the capital of Australia?");
    expect(q1).toBe("What is the capital of Australia?");

    const q2 = ResearchService.constructSearchQuery("Generate 5 questions on What is the time complexity of searching in a Red-Black tree?");
    expect(q2).toBe("What is the time complexity of searching in a Red-Black tree?");
  });

  it("handles queries with interrogative phrases and problem statements", () => {
    const q1 = ResearchService.constructSearchQuery("Explain why React 18 useEffect runs twice in strict mode");
    expect(q1).toBe("Explain why React 18 useEffect runs twice in strict mode");

    const q2 = ResearchService.constructSearchQuery("Which protocol is used for email retrieval (POP3 vs IMAP)?");
    expect(q2).toContain("Which protocol is used for email retrieval");
  });

  it("cleans standard instructional prefixes for general topics", () => {
    const q = ResearchService.constructSearchQuery("Create MCQs about Database Indexing with 4 options");
    expect(q).toBe("Database Indexing");
  });
});
