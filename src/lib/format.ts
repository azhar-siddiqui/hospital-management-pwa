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
  const utcMidnight = Date.UTC(parts.year, parts.month - 1, parts.day);
  const rough = new Date(utcMidnight - offsetMs(date, timeZone));
  return new Date(utcMidnight - offsetMs(rough, timeZone));
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
