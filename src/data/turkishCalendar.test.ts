import { describe, expect, it } from "vitest";
import { fromDateKey, getMonthGridDates, getTurkishCalendarDays, toDateKey } from "./turkishCalendar";

describe("Turkish calendar", () => {
  it("creates a Monday-first month grid with full weeks", () => {
    const dates = getMonthGridDates(2026, 2);

    expect(dates.length).toBe(42);
    expect(dates[0].date.getDay()).toBe(1);
    expect(dates.at(-1)?.date.getDay()).toBe(0);
    expect(dates.filter((date) => date.inMonth)).toHaveLength(31);
  });

  it("converts calendar dates without shifting a day", () => {
    const date = fromDateKey("2026-10-29");

    expect(toDateKey(date)).toBe("2026-10-29");
  });

  it("includes Turkish public holidays, remembrance days, and religious holidays", () => {
    const days = getTurkishCalendarDays(2026);
    const findDay = (date: string) => days.filter((day) => day.date === date).map((day) => day.label);

    expect(findDay("2026-01-01")).toContain("Yılbaşı");
    expect(findDay("2026-04-23")).toContain("Ulusal Egemenlik ve Çocuk Bayramı");
    expect(findDay("2026-10-29")).toContain("Cumhuriyet Bayramı");
    expect(findDay("2026-03-20")).toContain("Ramazan Bayramı · 1. gün");
    expect(findDay("2026-05-27")).toContain("Kurban Bayramı · 1. gün");
    expect(findDay("2026-11-10")).toContain("Atatürk'ü Anma Günü");
  });
});
