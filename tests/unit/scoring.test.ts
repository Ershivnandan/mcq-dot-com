import { describe, it, expect } from "vitest";

// Pure function test for SM-2 Algorithm calculation
function calculateNextSM2Interval(
  isCorrect: boolean,
  timeSpentSeconds: number,
  prevInterval: number = 0,
  prevEaseFactor: number = 2.5,
  prevMastery: number = 0
) {
  let quality = 0;
  if (isCorrect) {
    if (timeSpentSeconds < 15) quality = 5;
    else if (timeSpentSeconds < 35) quality = 4;
    else quality = 3;
  } else {
    quality = 1;
  }

  let intervalDays = prevInterval;
  let masteryLevel = prevMastery;

  if (quality >= 3) {
    if (intervalDays === 0) {
      intervalDays = 1;
    } else if (intervalDays === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * prevEaseFactor);
    }
    masteryLevel = Math.min(5, masteryLevel + 1);
  } else {
    intervalDays = 1;
    masteryLevel = Math.max(0, masteryLevel - 1);
  }

  let easeFactor = prevEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  return { intervalDays, easeFactor: parseFloat(easeFactor.toFixed(3)), masteryLevel, quality };
}

// Pure function test for Quiz Attempt Scoring
function calculateQuizAttemptScore(
  answers: { selectedOptionId: string | null; isCorrect: boolean }[]
) {
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  for (const ans of answers) {
    if (!ans.selectedOptionId) {
      unansweredCount++;
    } else if (ans.isCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
    }
  }

  const totalQuestions = answers.length;
  const accuracy = totalQuestions > 0 ? parseFloat(((correctCount / totalQuestions) * 100).toFixed(2)) : 0;
  const score = correctCount;

  return { totalQuestions, correctCount, incorrectCount, unansweredCount, accuracy, score };
}

describe("Quiz Attempt Scoring & SM-2 Spaced Repetition", () => {
  describe("Quiz Scoring Engine", () => {
    it("calculates 100% score for all correct answers", () => {
      const answers = [
        { selectedOptionId: "opt-1", isCorrect: true },
        { selectedOptionId: "opt-2", isCorrect: true },
        { selectedOptionId: "opt-3", isCorrect: true },
      ];
      const result = calculateQuizAttemptScore(answers);
      expect(result.totalQuestions).toBe(3);
      expect(result.correctCount).toBe(3);
      expect(result.incorrectCount).toBe(0);
      expect(result.unansweredCount).toBe(0);
      expect(result.accuracy).toBe(100);
      expect(result.score).toBe(3);
    });

    it("correctly identifies unanswered and incorrect questions", () => {
      const answers = [
        { selectedOptionId: "opt-1", isCorrect: true },
        { selectedOptionId: "opt-2", isCorrect: false },
        { selectedOptionId: null, isCorrect: false },
        { selectedOptionId: null, isCorrect: false },
      ];
      const result = calculateQuizAttemptScore(answers);
      expect(result.totalQuestions).toBe(4);
      expect(result.correctCount).toBe(1);
      expect(result.incorrectCount).toBe(1);
      expect(result.unansweredCount).toBe(2);
      expect(result.accuracy).toBe(25);
      expect(result.score).toBe(1);
    });

    it("returns 0% accuracy when totalQuestions is 0", () => {
      const result = calculateQuizAttemptScore([]);
      expect(result.totalQuestions).toBe(0);
      expect(result.accuracy).toBe(0);
      expect(result.score).toBe(0);
    });
  });

  describe("SuperMemo SM-2 Interval Calculation", () => {
    it("sets interval to 1 day on first successful recall", () => {
      const step1 = calculateNextSM2Interval(true, 10, 0, 2.5, 0);
      expect(step1.intervalDays).toBe(1);
      expect(step1.masteryLevel).toBe(1);
      expect(step1.quality).toBe(5);
      expect(step1.easeFactor).toBeGreaterThanOrEqual(2.5); // Quality 5 increases ease factor
    });

    it("advances interval to 6 days on second consecutive correct recall", () => {
      const step2 = calculateNextSM2Interval(true, 12, 1, 2.6, 1);
      expect(step2.intervalDays).toBe(6);
      expect(step2.masteryLevel).toBe(2);
    });

    it("multiplies interval by ease factor on third consecutive correct recall", () => {
      const step3 = calculateNextSM2Interval(true, 14, 6, 2.6, 2);
      expect(step3.intervalDays).toBe(Math.round(6 * 2.6)); // 16
      expect(step3.masteryLevel).toBe(3);
    });

    it("resets interval to 1 day and degrades mastery on incorrect answer", () => {
      const failed = calculateNextSM2Interval(false, 20, 16, 2.6, 3);
      expect(failed.intervalDays).toBe(1);
      expect(failed.masteryLevel).toBe(2);
      expect(failed.quality).toBe(1);
      expect(failed.easeFactor).toBeLessThan(2.6); // Quality 1 reduces ease factor
    });

    it("enforces minimum ease factor floor of 1.3", () => {
      let ef = 1.35;
      const res = calculateNextSM2Interval(false, 30, 1, ef, 0);
      expect(res.easeFactor).toBe(1.3);
    });
  });
});
