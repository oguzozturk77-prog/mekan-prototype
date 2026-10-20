export type CalendarDayKind = "resmi" | "dini" | "anma" | "ozel";

export type CalendarDay = {
  date: string;
  label: string;
  kind: CalendarDayKind;
};

const pad = (value: number) => String(value).padStart(2, "0");
const holidayCache = new Map<number, CalendarDay[]>();
const hijriFormatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
  day: "numeric",
  month: "numeric",
  timeZone: "UTC",
});

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function getMonthGridDates(year: number, month: number) {
  const first = new Date(year, month, 1, 12);
  const mondayOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;

  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(year, month, 1 - mondayOffset + index, 12);
    return { date, key: toDateKey(date), inMonth: date.getMonth() === month };
  });
}

function hijriParts(date: Date) {
  const parts = hijriFormatter.formatToParts(date);
  return {
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, occurrence: number) {
  const first = new Date(year, month, 1, 12);
  const day = 1 + ((weekday - first.getDay() + 7) % 7) + (occurrence - 1) * 7;
  return new Date(year, month, day, 12);
}

export function getTurkishCalendarDays(year: number): CalendarDay[] {
  const cached = holidayCache.get(year);
  if (cached) return cached;

  const days: CalendarDay[] = [];
  const add = (date: Date, label: string, kind: CalendarDayKind) => {
    if (date.getFullYear() === year) days.push({ date: toDateKey(date), label, kind });
  };

  const fixedDays: Array<[number, number, string, CalendarDayKind]> = [
    [0, 1, "Yılbaşı", "resmi"],
    [1, 14, "Sevgililer Günü", "ozel"],
    [2, 8, "Dünya Kadınlar Günü", "anma"],
    [2, 18, "Çanakkale Zaferi ve Şehitleri Anma Günü", "anma"],
    [2, 21, "Nevruz", "ozel"],
    [3, 23, "Ulusal Egemenlik ve Çocuk Bayramı", "resmi"],
    [4, 1, "Emek ve Dayanışma Günü", "resmi"],
    [4, 19, "Atatürk'ü Anma, Gençlik ve Spor Bayramı", "resmi"],
    [4, 5, "Hıdırellez", "ozel"],
    [6, 15, "Demokrasi ve Millî Birlik Günü", "resmi"],
    [7, 30, "Zafer Bayramı", "resmi"],
    [8, 19, "Gaziler Günü", "anma"],
    [9, 4, "Hayvanları Koruma Günü", "anma"],
    [9, 28, "Cumhuriyet Bayramı arifesi · 13.00 sonrası", "resmi"],
    [9, 29, "Cumhuriyet Bayramı", "resmi"],
    [10, 10, "Atatürk'ü Anma Günü", "anma"],
    [11, 5, "Dünya Kadın Hakları Günü", "anma"],
  ];
  for (const [month, day, label, kind] of fixedDays) add(new Date(year, month, day, 12), label, kind);

  add(nthWeekdayOfMonth(year, 4, 0, 2), "Anneler Günü", "ozel");
  add(nthWeekdayOfMonth(year, 5, 0, 3), "Babalar Günü", "ozel");

  // The Islamic calendar is derived with the browser's Umm al-Qura calendar.
  // Dates can differ by a day from the official Turkish religious calendar.
  const cursor = new Date(Date.UTC(year, 0, 1, 12));
  const end = new Date(Date.UTC(year + 1, 0, 1, 12));
  for (; cursor < end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const { month, day } = hijriParts(cursor);
    const date = new Date(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate(), 12);

    if (month === 10 && day >= 1 && day <= 3) {
      add(date, `Ramazan Bayramı · ${day}. gün`, "dini");
      if (day === 1) {
        const eve = new Date(date);
        eve.setDate(eve.getDate() - 1);
        add(eve, "Ramazan Bayramı arifesi · 13.00 sonrası", "dini");
      }
    }
    if (month === 12 && day >= 10 && day <= 13) {
      const holidayDay = day - 9;
      add(date, `Kurban Bayramı · ${holidayDay}. gün`, "dini");
      if (day === 10) {
        const eve = new Date(date);
        eve.setDate(eve.getDate() - 1);
        add(eve, "Kurban Bayramı arifesi · 13.00 sonrası", "dini");
      }
    }
  }

  days.sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label, "tr-TR"));
  holidayCache.set(year, days);
  return days;
}
