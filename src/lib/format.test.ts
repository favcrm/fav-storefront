import { describe, expect, it } from "vitest";
import { formatMoney } from "$lib/format";

describe("formatMoney", () => {
  it("formats numeric HKD amounts", () => {
    expect(formatMoney(1280)).toBe("HK$1,280");
  });

  it("returns an empty string for missing values", () => {
    expect(formatMoney(null)).toBe("");
  });
});
