import {
  hospitalCalendar,
  hospitalDayKeyFromParts,
  hospitalMonthBounds,
  parseHospitalDay,
  resolveHospitalMonth,
  shiftHospitalDay,
  type HospitalDay,
} from "@/lib/format";

const MAX_RANGE_DAYS = 366;
const EARLIEST: HospitalDay = { year: 2000, month: 1, day: 1 };

export type CollectionPreset = {
  id: string;
  label: string;
  fromKey: string;
  toKey: string;
};

type RangeInput = { from?: string; to?: string; month?: string };

export function resolveCollectionRange(input: RangeInput, now = new Date()) {
  const current = hospitalCalendar(now);
  const currentBounds = hospitalMonthBounds(current.year, current.month);
  const latest = currentBounds.to;

  const parsedFrom = parseHospitalDay(input.from);
  const parsedTo = parseHospitalDay(input.to);
  if (!parsedFrom && !parsedTo) {
    const month = resolveHospitalMonth(input.month, now);
    const bounds = hospitalMonthBounds(month.year, month.month);
    return finishRange(bounds.from, bounds.to, false, currentBounds);
  }

  let from = parsedFrom ?? parsedTo!;
  let to = parsedTo ?? parsedFrom!;
  from = clampDay(from, EARLIEST, latest);
  to = clampDay(to, EARLIEST, latest);
  if (hospitalDayKeyFromParts(from) > hospitalDayKeyFromParts(to)) {
    const swap = from;
    from = to;
    to = swap;
  }

  let limited = false;
  if (daySpan(from, to) > MAX_RANGE_DAYS) {
    from = shiftHospitalDay(to, -(MAX_RANGE_DAYS - 1));
    limited = true;
  }
  return finishRange(from, to, limited, currentBounds);
}

function finishRange(
  from: HospitalDay,
  to: HospitalDay,
  limited: boolean,
  currentBounds: { from: HospitalDay; to: HospitalDay },
) {
  const fromKey = hospitalDayKeyFromParts(from);
  const toKey = hospitalDayKeyFromParts(to);
  return {
    from,
    to,
    fromKey,
    toKey,
    limited,
    isDefaultRange:
      fromKey === hospitalDayKeyFromParts(currentBounds.from) &&
      toKey === hospitalDayKeyFromParts(currentBounds.to),
  };
}

function clampDay(day: HospitalDay, earliest: HospitalDay, latest: HospitalDay) {
  const key = hospitalDayKeyFromParts(day);
  if (key < hospitalDayKeyFromParts(earliest)) return earliest;
  if (key > hospitalDayKeyFromParts(latest)) return latest;
  return day;
}

function daySpan(from: HospitalDay, to: HospitalDay) {
  const start = Date.UTC(from.year, from.month - 1, from.day);
  const end = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((end - start) / 86_400_000) + 1;
}

/** Monday is 0. */
function mondayIndex(day: HospitalDay) {
  const sunday0 = new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay();
  return (sunday0 + 6) % 7;
}

function preset(id: string, label: string, from: HospitalDay, to: HospitalDay): CollectionPreset {
  const [start, end] =
    hospitalDayKeyFromParts(from) <= hospitalDayKeyFromParts(to) ? [from, to] : [to, from];
  return {
    id,
    label,
    fromKey: hospitalDayKeyFromParts(start),
    toKey: hospitalDayKeyFromParts(end),
  };
}

export function collectionRangePresets(now = new Date()): CollectionPreset[] {
  const today = hospitalCalendar(now);
  const latest = hospitalMonthBounds(today.year, today.month).to;
  const weekStart = shiftHospitalDay(today, -mondayIndex(today));
  const thisMonth = hospitalMonthBounds(today.year, today.month);
  const previousMonthDay = shiftHospitalDay(thisMonth.from, -1);
  const lastMonth = hospitalMonthBounds(previousMonthDay.year, previousMonthDay.month);

  return [
    preset("today", "Today", today, today),
    preset("yesterday", "Yesterday", shiftHospitalDay(today, -1), shiftHospitalDay(today, -1)),
    preset(
      "this-week",
      "This week",
      weekStart,
      clampDay(shiftHospitalDay(weekStart, 6), EARLIEST, latest),
    ),
    preset(
      "last-week",
      "Last week",
      shiftHospitalDay(weekStart, -7),
      shiftHospitalDay(weekStart, -1),
    ),
    preset("this-month", "This month", thisMonth.from, thisMonth.to),
    preset("last-month", "Last month", lastMonth.from, lastMonth.to),
    preset("this-year", "This year", { year: today.year, month: 1, day: 1 }, today),
    preset(
      "last-year",
      "Last year",
      { year: today.year - 1, month: 1, day: 1 },
      { year: today.year - 1, month: 12, day: 31 },
    ),
  ];
}

export function collectionHref(input: {
  fromKey: string;
  toKey: string;
  doctorId?: string | null;
  now?: Date;
}) {
  const defaults = resolveCollectionRange({}, input.now);
  const sameRange = input.fromKey === defaults.fromKey && input.toKey === defaults.toKey;
  if (sameRange && !input.doctorId) return "/collection";
  const params = new URLSearchParams();
  if (!sameRange) {
    params.set("from", input.fromKey);
    params.set("to", input.toKey);
  }
  if (input.doctorId) params.set("doctor", input.doctorId);
  return `/collection?${params.toString()}`;
}
