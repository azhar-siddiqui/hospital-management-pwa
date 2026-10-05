const MONEY = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function hospitalTimeZone() {
  const configured = process.env.HOSPITAL_TIMEZONE || "Asia/Kolkata";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: configured });
    return configured;
  } catch {
    return "UTC";
  }
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function zonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: parts.year ?? 1970,
    month: parts.month ?? 1,
    day: parts.day ?? 1,
    hour: parts.hour === 24 ? 0 : (parts.hour ?? 0),
    minute: parts.minute ?? 0,
    second: parts.second ?? 0,
  };
}

function offsetMs(date: Date, timeZone: string) {
  const parts = zonedParts(date, timeZone);
  const clockAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return clockAsUtc - date.getTime();
}

export function startOfHospitalDay(date = new Date()) {
  const timeZone = hospitalTimeZone();
  const parts = zonedParts(date, timeZone);
  return startOfHospitalDate(parts.year, parts.month, parts.day, timeZone);
}

export function hospitalCalendar(date = new Date()) {
  const parts = zonedParts(date, hospitalTimeZone());
  return { year: parts.year, month: parts.month, day: parts.day };
}

export function startOfHospitalDate(
  year: number,
  month: number,
  day: number,
  timeZone = hospitalTimeZone(),
) {
  const utcMidnight = Date.UTC(year, month - 1, day);
  const rough = new Date(utcMidnight - offsetMs(new Date(utcMidnight), timeZone));
  return new Date(utcMidnight - offsetMs(rough, timeZone));
}

export function shiftHospitalMonth(year: number, month: number, delta: number) {
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1 };
}

/** Accepts YYYY-MM up to the current hospital month. Anything else is this month. */
export function resolveHospitalMonth(value: string | undefined, now = new Date()) {
  const current = hospitalCalendar(now);
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (!match) return { year: current.year, month: current.month };
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12 || year < 2000) return { year: current.year, month: current.month };
  if (year > current.year || (year === current.year && month > current.month)) {
    return { year: current.year, month: current.month };
  }
  return { year, month };
}

export type HospitalDay = { year: number; month: number; day: number };

export function hospitalDayKeyFromParts(day: HospitalDay) {
  const month = String(day.month).padStart(2, "0");
  const date = String(day.day).padStart(2, "0");
  return `${day.year}-${month}-${date}`;
}

/** Accepts a real YYYY-MM-DD. Anything else is null. */
export function parseHospitalDay(value: string | undefined): HospitalDay | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 2000 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function shiftHospitalDay(day: HospitalDay, delta: number): HospitalDay {
  const shifted = new Date(Date.UTC(day.year, day.month - 1, day.day + delta));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export function hospitalMonthBounds(year: number, month: number) {
  const next = shiftHospitalMonth(year, month, 1);
  return {
    from: { year, month, day: 1 },
    to: shiftHospitalDay({ year: next.year, month: next.month, day: 1 }, -1),
  };
}

export function hospitalDayKey(date: Date) {
  const parts = zonedParts(date, hospitalTimeZone());
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
}

export function formatHospitalMonth(year: number, month: number) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: hospitalTimeZone(),
  }).format(startOfHospitalDate(year, month, 1));
}

export function formatHospitalDayShort(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: hospitalTimeZone(),
  }).format(date);
}

export function formatHospitalDayMedium(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: hospitalTimeZone(),
  }).format(date);
}

export function formatHospitalRange(from: HospitalDay, to: HospitalDay) {
  const start = formatHospitalDayMedium(startOfHospitalDate(from.year, from.month, from.day));
  if (from.year === to.year && from.month === to.month && from.day === to.day) return start;
  const end = formatHospitalDayMedium(startOfHospitalDate(to.year, to.month, to.day));
  return `${start} – ${end}`;
}

export function formatMoney(amount: number) {
  return MONEY.format(amount);
}

export function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: hospitalTimeZone(),
  }).format(date);
}

export function formatHospitalDay(date = new Date()) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: hospitalTimeZone(),
  }).format(date);
}

export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {},
) {
  if (!date) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: opts.month ?? "long",
      day: opts.day ?? "numeric",
      year: opts.year ?? "numeric",
      timeZone: hospitalTimeZone(),
      ...opts,
    }).format(new Date(date));
  } catch {
    return "";
  }
}

export function hospitalHour(date = new Date()) {
  return zonedParts(date, hospitalTimeZone()).hour;
}

export function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}
