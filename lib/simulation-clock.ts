/**
 * Simulation Clock Engine for AI Virtual Society 2.0
 * Handles persistent multi-year date/time progression without artificial limits.
 * 
 * Rules:
 * - 24 hours per day (0..23).
 * - 365 days per year (1..365).
 * - Multi-year progression: day 366 -> Year 2, Day 1 (never stops).
 * - 4 distinct seasons per year:
 *     - Spring: Days 1 - 91
 *     - Summer: Days 92 - 182
 *     - Autumn: Days 183 - 273
 *     - Winter: Days 274 - 365
 * - 4 daily phases:
 *     - dawn:  05:00 - 07:59
 *     - day:   08:00 - 17:59
 *     - dusk:  18:00 - 20:59
 *     - night: 21:00 - 04:59
 */

export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';
export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';

export interface ClockState {
  hour: number;      // 0..23
  day: number;       // 1..365 (day of current year)
  year: number;      // 1..infinity
  totalDays: number; // 1..infinity (cumulative days across all years)
  season: Season;
  phase: DayPhase;
  rounds: number;    // cumulative ticks
}

export interface ClockAdvanceResult extends ClockState {
  dayChanged: boolean;
  yearChanged: boolean;
  seasonChanged: boolean;
}

export function calculateSeason(dayOfYear: number): Season {
  const normalizedDay = ((dayOfYear - 1) % 365) + 1;
  if (normalizedDay <= 91) return 'Spring';
  if (normalizedDay <= 182) return 'Summer';
  if (normalizedDay <= 273) return 'Autumn';
  return 'Winter';
}

export function calculatePhase(hour: number): DayPhase {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 18) return 'day';
  if (h >= 18 && h < 21) return 'dusk';
  return 'night';
}

/**
 * Deterministically advances the simulation clock by a given number of hours (default 1).
 * Never caps or halts at day 365. Seamlessly rolls into Year 2, Year 3, etc.
 */
export function advanceClock(
  current: {
    hour: number;
    day: number;
    year: number;
    totalDays?: number;
    rounds: number;
  },
  hoursToAdvance = 1
): ClockAdvanceResult {
  let hour = current.hour;
  let day = Math.max(1, current.day);
  let year = Math.max(1, current.year);
  let totalDays = current.totalDays ? Math.max(1, current.totalDays) : (year - 1) * 365 + day;
  let rounds = current.rounds + hoursToAdvance;

  const previousDay = day;
  const previousYear = year;
  const previousSeason = calculateSeason(previousDay);

  hour += hoursToAdvance;
  while (hour >= 24) {
    hour -= 24;
    day += 1;
    totalDays += 1;

    if (day > 365) {
      day = 1;
      year += 1;
    }
  }

  const season = calculateSeason(day);
  const phase = calculatePhase(hour);

  return {
    hour,
    day,
    year,
    totalDays,
    season,
    phase,
    rounds,
    dayChanged: day !== previousDay || year !== previousYear,
    yearChanged: year !== previousYear,
    seasonChanged: season !== previousSeason,
  };
}

export function formatClock(clock: { hour: number; day: number; year: number; season: string }): string {
  const padH = String(clock.hour).padStart(2, '0');
  return `Year ${clock.year}, Day ${clock.day} (${clock.season}) ${padH}:00`;
}
