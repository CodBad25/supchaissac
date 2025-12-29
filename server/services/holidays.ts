/**
 * Gestion des vacances scolaires (Zone B - Académie de Nantes)
 * et des jours fériés français - Version serveur
 */

interface HolidayPeriod {
  name: string;
  start: Date;
  end: Date;
}

// ============================================================================
// JOURS FÉRIÉS FRANÇAIS
// ============================================================================

function getEasterDate(year: number): Date {
  // Algorithme de Meeus/Jones/Butcher pour calculer Pâques
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getFrenchHolidays(year: number): Date[] {
  const easter = getEasterDate(year);

  return [
    new Date(year, 0, 1),    // Jour de l'An
    addDays(easter, 1),       // Lundi de Pâques
    new Date(year, 4, 1),     // Fête du Travail
    new Date(year, 4, 8),     // Victoire 1945
    addDays(easter, 39),      // Ascension
    addDays(easter, 50),      // Lundi de Pentecôte
    new Date(year, 6, 14),    // Fête Nationale
    new Date(year, 7, 15),    // Assomption
    new Date(year, 10, 1),    // Toussaint
    new Date(year, 10, 11),   // Armistice 1918
    new Date(year, 11, 25),   // Noël
  ];
}

// ============================================================================
// VACANCES SCOLAIRES ZONE B (Académie de Nantes)
// ============================================================================

export function getSchoolHolidays(schoolYear: string): HolidayPeriod[] {
  // Format: "2024-2025"
  const holidays: Record<string, HolidayPeriod[]> = {
    '2024-2025': [
      {
        name: 'Vacances de la Toussaint',
        start: new Date(2024, 9, 19),
        end: new Date(2024, 10, 4),
      },
      {
        name: 'Vacances de Noël',
        start: new Date(2024, 11, 21),
        end: new Date(2025, 0, 5), // Reprise le 6
      },
      {
        name: "Vacances d'hiver",
        start: new Date(2025, 1, 8),
        end: new Date(2025, 1, 24),
      },
      {
        name: 'Vacances de printemps',
        start: new Date(2025, 3, 5),
        end: new Date(2025, 3, 22),
      },
      {
        name: "Vacances d'été",
        start: new Date(2025, 6, 5),
        end: new Date(2025, 8, 1),
      },
    ],
    '2025-2026': [
      {
        name: 'Vacances de la Toussaint',
        start: new Date(2025, 9, 18),
        end: new Date(2025, 10, 3),
      },
      {
        name: 'Vacances de Noël',
        start: new Date(2025, 11, 20),
        end: new Date(2026, 0, 4), // Reprise le 5
      },
      {
        name: "Vacances d'hiver",
        start: new Date(2026, 1, 14),
        end: new Date(2026, 2, 2),
      },
      {
        name: 'Vacances de printemps',
        start: new Date(2026, 3, 11),
        end: new Date(2026, 3, 27),
      },
      {
        name: "Vacances d'été",
        start: new Date(2026, 6, 4),
        end: new Date(2026, 8, 1),
      },
    ],
  };

  return holidays[schoolYear] || [];
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return d >= s && d <= e;
}

function getCurrentSchoolYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (month >= 8) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

export function isPublicHoliday(date: Date): { isHoliday: boolean; name?: string } {
  const holidays = getFrenchHolidays(date.getFullYear());

  const holidayNames = [
    "Jour de l'An",
    "Lundi de Pâques",
    "Fête du Travail",
    "Victoire 1945",
    "Ascension",
    "Lundi de Pentecôte",
    "Fête Nationale",
    "Assomption",
    "Toussaint",
    "Armistice 1918",
    "Noël",
  ];

  for (let i = 0; i < holidays.length; i++) {
    if (isSameDay(date, holidays[i])) {
      return { isHoliday: true, name: holidayNames[i] };
    }
  }

  return { isHoliday: false };
}

export function isSchoolHoliday(date: Date): { isHoliday: boolean; name?: string } {
  const currentSchoolYear = getCurrentSchoolYear();
  const [startYear] = currentSchoolYear.split('-').map(Number);
  const schoolYears = [`${startYear - 1}-${startYear}`, currentSchoolYear, `${startYear + 1}-${startYear + 2}`];

  for (const schoolYear of schoolYears) {
    const holidays = getSchoolHolidays(schoolYear);
    for (const period of holidays) {
      if (isDateInRange(date, period.start, period.end)) {
        return { isHoliday: true, name: period.name };
      }
    }
  }

  return { isHoliday: false };
}

export function isBlockedDate(date: Date): { isBlocked: boolean; reason?: string } {
  const publicHoliday = isPublicHoliday(date);
  if (publicHoliday.isHoliday) {
    return { isBlocked: true, reason: publicHoliday.name };
  }

  const schoolHoliday = isSchoolHoliday(date);
  if (schoolHoliday.isHoliday) {
    return { isBlocked: true, reason: schoolHoliday.name };
  }

  return { isBlocked: false };
}

export type { HolidayPeriod };
