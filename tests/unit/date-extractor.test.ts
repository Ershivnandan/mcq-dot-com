import { describe, it, expect } from "vitest";
import { ImportExportService } from "@/server/services/import-export.service";

describe("Date Extraction from Section Headers", () => {
  it("extracts single-digit day date header with emojis", () => {
    const header = "📋 1 May 2026 📋";
    const date = ImportExportService.extractDateFromHeader(header);
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(4); // 0-indexed: May is 4
    expect(date?.getDate()).toBe(1);
  });

  it("extracts date header with background emojis and decoration", () => {
    const header = "🟪🟪🟪 3 June 2026 🟪🟪🟪";
    const date = ImportExportService.extractDateFromHeader(header);
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(5); // June is 5
    expect(date?.getDate()).toBe(3);
  });

  it("extracts range date header (e.g. 12-13 July 2026) using the start date", () => {
    const header = "12-13 July 2026";
    const date = ImportExportService.extractDateFromHeader(header);
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(6); // July is 6
    expect(date?.getDate()).toBe(12);
  });

  it("extracts multi-digit date header (e.g. 25 August 2026)", () => {
    const header = "⭐ 25 August 2026 Review ⭐";
    const date = ImportExportService.extractDateFromHeader(header);
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(7); // August is 7
    expect(date?.getDate()).toBe(25);
  });

  it("returns null for non-date headers or ordinary text", () => {
    expect(ImportExportService.extractDateFromHeader("Section 1: General Science")).toBeNull();
    expect(ImportExportService.extractDateFromHeader("Important Questions")).toBeNull();
    expect(ImportExportService.extractDateFromHeader("")).toBeNull();
    expect(ImportExportService.extractDateFromHeader("May 2026")).toBeNull(); // Missing day
  });
});
