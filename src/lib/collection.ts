import { resolveCollectionRange } from "@/lib/collection-range";
import {
  formatHospitalDayShort,
  formatHospitalRange,
  hospitalCalendar,
  hospitalDayKey,
  hospitalDayKeyFromParts,
  hospitalMonthBounds,
  roundMoney,
  shiftHospitalDay,
  startOfHospitalDate,
  type HospitalDay,
} from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { isUuid } from "@/lib/validation";

export { collectionHref, resolveCollectionRange } from "@/lib/collection-range";

export type CollectionDay = {
  key: string;
  label: string;
  patients: number;
  visits: number;
  fees: number;
  charges: number;
  collection: number;
};

export type DoctorCollection = {
  key: string;
  id: string | null;
  name: string;
  specialty: string | null;
  assigned: boolean;
  patients: number;
  visits: number;
  opd: number;
  ipd: number;
  fees: number;
  charges: number;
  collection: number;
  days: CollectionDay[];
};

export type CollectionDoctor = {
  id: string;
  name: string;
  specialty: string | null;
};

export type CollectionReport = {
  from: HospitalDay;
  to: HospitalDay;
  fromKey: string;
  toKey: string;
  latestKey: string;
  rangeLabel: string;
  limited: boolean;
  isDefault: boolean;
  doctor: CollectionDoctor | null;
  doctors: CollectionDoctor[];
  patients: number;
  visits: number;
  opd: number;
  ipd: number;
  fees: number;
  charges: number;
  collection: number;
  days: CollectionDay[];
  referring: DoctorCollection[];
  consultation: DoctorCollection[];
};

type DayAcc = { patients: Set<string>; visits: number; fees: number; charges: number };

type DoctorAcc = {
  key: string;
  id: string | null;
  name: string;
  specialty: string | null;
  assigned: boolean;
  patients: Set<string>;
  visits: number;
  opd: number;
  ipd: number;
  fees: number;
  charges: number;
  days: Map<string, DayAcc>;
};

export async function getCollectionReport(input: {
  from?: string;
  to?: string;
  month?: string;
  doctor?: string;
}): Promise<CollectionReport> {
  const now = new Date();
  const range = resolveCollectionRange(input, now);
  const start = startOfHospitalDate(range.from.year, range.from.month, range.from.day);
  const nextDay = shiftHospitalDay(range.to, 1);
  const end = startOfHospitalDate(nextDay.year, nextDay.month, nextDay.day);

  const [visits, charges, doctors] = await Promise.all([
    prisma.visit.findMany({
      where: { admissionDate: { gte: start, lt: end } },
      select: {
        patientId: true,
        visitType: true,
        admissionDate: true,
        consultationFee: true,
        referringDoctor: true,
        referringDoctorId: true,
        consultationDoctor: true,
        consultationDoctorId: true,
      },
    }),
    prisma.serviceCharge.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: {
        total: true,
        createdAt: true,
        visit: {
          select: {
            referringDoctor: true,
            referringDoctorId: true,
            consultationDoctor: true,
            consultationDoctorId: true,
          },
        },
      },
    }),
    prisma.doctor.findMany({
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true, specialty: true },
    }),
  ]);

  const requestedId =
    input.doctor && input.doctor !== "all" && isUuid(input.doctor) ? input.doctor : null;
  const doctor = requestedId ? (doctors.find((item) => item.id === requestedId) ?? null) : null;
  const known = new Map(doctors.map((item) => [item.id, item]));

  const patients = new Set<string>();
  let opd = 0;
  let ipd = 0;
  let fees = 0;
  const hospitalDays = new Map<string, DayAcc>();
  const referring = new Map<string, DoctorAcc>();
  const consultation = new Map<string, DoctorAcc>();

  function hospitalDay(key: string) {
    const existing = hospitalDays.get(key);
    if (existing) return existing;
    const created: DayAcc = { patients: new Set(), visits: 0, fees: 0, charges: 0 };
    hospitalDays.set(key, created);
    return created;
  }

  function doctorBucket(
    map: Map<string, DoctorAcc>,
    id: string | null,
    snapshot: string | null,
    emptyName: string,
  ) {
    const named = snapshot?.trim() || null;
    const key = id ? `id:${id}` : named ? `name:${named}` : "none";
    const existing = map.get(key);
    if (existing) return existing;
    const current = id ? known.get(id) : undefined;
    const created: DoctorAcc = {
      key,
      id,
      name: current?.name ?? named ?? emptyName,
      specialty: current?.specialty ?? null,
      assigned: Boolean(id || named),
      patients: new Set(),
      visits: 0,
      opd: 0,
      ipd: 0,
      fees: 0,
      charges: 0,
      days: new Map(),
    };
    map.set(key, created);
    return created;
  }

  for (const visit of visits) {
    patients.add(visit.patientId);
    if (visit.visitType === "OPD") opd += 1;
    else ipd += 1;
    fees += visit.consultationFee;
    const key = hospitalDayKey(visit.admissionDate);
    const day = hospitalDay(key);
    day.patients.add(visit.patientId);
    day.visits += 1;
    day.fees += visit.consultationFee;

    for (const [map, id, name, emptyName] of [
      [referring, visit.referringDoctorId, visit.referringDoctor, "No referring doctor"],
      [
        consultation,
        visit.consultationDoctorId,
        visit.consultationDoctor,
        "No consultation doctor",
      ],
    ] as const) {
      const bucket = doctorBucket(map, id, name, emptyName);
      bucket.patients.add(visit.patientId);
      bucket.visits += 1;
      if (visit.visitType === "OPD") bucket.opd += 1;
      else bucket.ipd += 1;
      bucket.fees += visit.consultationFee;
      const doctorDay = bucket.days.get(key) ?? {
        patients: new Set<string>(),
        visits: 0,
        fees: 0,
        charges: 0,
      };
      doctorDay.patients.add(visit.patientId);
      doctorDay.visits += 1;
      doctorDay.fees += visit.consultationFee;
      bucket.days.set(key, doctorDay);
    }
  }

  let chargeTotal = 0;
  for (const charge of charges) {
    chargeTotal += charge.total;
    const key = hospitalDayKey(charge.createdAt);
    hospitalDay(key).charges += charge.total;
    for (const [map, id, name, emptyName] of [
      [
        referring,
        charge.visit.referringDoctorId,
        charge.visit.referringDoctor,
        "No referring doctor",
      ],
      [
        consultation,
        charge.visit.consultationDoctorId,
        charge.visit.consultationDoctor,
        "No consultation doctor",
      ],
    ] as const) {
      const bucket = doctorBucket(map, id, name, emptyName);
      bucket.charges += charge.total;
      const doctorDay = bucket.days.get(key) ?? {
        patients: new Set<string>(),
        visits: 0,
        fees: 0,
        charges: 0,
      };
      doctorDay.charges += charge.total;
      bucket.days.set(key, doctorDay);
    }
  }

  const current = hospitalCalendar(now);
  const currentBounds = hospitalMonthBounds(current.year, current.month);

  return {
    from: range.from,
    to: range.to,
    fromKey: range.fromKey,
    toKey: range.toKey,
    latestKey: hospitalDayKeyFromParts(currentBounds.to),
    rangeLabel: formatHospitalRange(range.from, range.to),
    limited: range.limited,
    isDefault: range.isDefaultRange && !doctor,
    doctor,
    doctors,
    patients: patients.size,
    visits: visits.length,
    opd,
    ipd,
    fees: roundMoney(fees),
    charges: roundMoney(chargeTotal),
    collection: roundMoney(fees + chargeTotal),
    days: finishDays(hospitalDays),
    referring: doctor ? [pickDoctor(referring, doctor)] : finishDoctors(referring),
    consultation: doctor ? [pickDoctor(consultation, doctor)] : finishDoctors(consultation),
  };
}

function pickDoctor(map: Map<string, DoctorAcc>, doctor: CollectionDoctor): DoctorCollection {
  const found = map.get(`id:${doctor.id}`);
  if (found) return toDoctor(found);
  return {
    key: `id:${doctor.id}`,
    id: doctor.id,
    name: doctor.name,
    specialty: doctor.specialty,
    assigned: true,
    patients: 0,
    visits: 0,
    opd: 0,
    ipd: 0,
    fees: 0,
    charges: 0,
    collection: 0,
    days: [],
  };
}

function finishDoctors(map: Map<string, DoctorAcc>) {
  return [...map.values()]
    .filter((row) => row.visits > 0 || row.charges !== 0)
    .map(toDoctor)
    .sort((left, right) => {
      if (left.assigned !== right.assigned) return left.assigned ? -1 : 1;
      if (left.collection !== right.collection) return right.collection - left.collection;
      return left.name.localeCompare(right.name, "en");
    });
}

function toDoctor(row: DoctorAcc): DoctorCollection {
  return {
    key: row.key,
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    assigned: row.assigned,
    patients: row.patients.size,
    visits: row.visits,
    opd: row.opd,
    ipd: row.ipd,
    fees: roundMoney(row.fees),
    charges: roundMoney(row.charges),
    collection: roundMoney(row.fees + row.charges),
    days: finishDays(row.days),
  };
}

function finishDays(days: Map<string, DayAcc>): CollectionDay[] {
  return [...days.entries()]
    .sort(([left], [right]) => (left < right ? 1 : -1))
    .map(([key, row]) => {
      const [year, month, day] = key.split("-").map(Number);
      return {
        key,
        label: formatHospitalDayShort(startOfHospitalDate(year, month, day)),
        patients: row.patients.size,
        visits: row.visits,
        fees: roundMoney(row.fees),
        charges: roundMoney(row.charges),
        collection: roundMoney(row.fees + row.charges),
      };
    });
}
