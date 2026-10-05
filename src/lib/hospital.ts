import { Prisma } from "@/generated/prisma/client";
import { fieldChanges, showValue, writeAudit } from "@/lib/audit";
import { doctorSnapshot } from "@/lib/doctors";
import { hospitalTimeZone, roundMoney, startOfHospitalDay } from "@/lib/format";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  isGender,
  isItemCategory,
  isUuid,
  isVisitType,
  isWardType,
  readAge,
  readMoney,
  readNote,
  readPhone,
  readQuantity,
  readStock,
  readText,
  boundedText,
  optionalText,
  type VisitTypeName,
  type WardTypeName,
} from "@/lib/validation";

const LOW_STOCK_AT = 5;

export class OperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OperationError";
  }
}

type Actor = { id: string; role: string; permissions: string[] };

type Failure = { ok: false; message: string };

function deny(actor: Actor, permission: Parameters<typeof can>[1]): Failure | null {
  if (!can(actor, permission)) {
    return { ok: false, message: "You do not have access to do that." };
  }
  return null;
}

function uniqueMessage(error: unknown, message: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return message;
  }
  return null;
}

export async function getPatient(id: string) {
  if (!isUuid(id)) {
    return null;
  }
  return prisma.patient.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phone: true,
      age: true,
      gender: true,
      address: true,
      createdAt: true,
      visits: {
        orderBy: { admissionDate: "desc" },
        select: {
          id: true,
          visitType: true,
          status: true,
          admissionDate: true,
          consultationFee: true,
          bed: { select: { bedNumber: true } },
        },
      },
    },
  });
}

export function parseRegistration(formData: FormData) {
  const errors: Record<string, string> = {};
  const name = readText(formData.get("name"));
  const phoneInput = readText(formData.get("phone"));
  const ageInput = readText(formData.get("age"));
  const genderInput = readText(formData.get("gender"));
  const address = readText(formData.get("address"));
  const referringDoctorId = readText(formData.get("referringDoctorId"));
  const consultationDoctorId = readText(formData.get("consultationDoctorId"));
  const feeInput = readText(formData.get("consultationFee"));
  const visitType = readText(formData.get("visitType"));

  const nameError = boundedText(name, "Name", 2, 80);
  if (nameError) errors.name = nameError;
  let phone: string | null = null;
  if (phoneInput) {
    phone = readPhone(phoneInput);
    if (!phone) errors.phone = "Enter a phone number with 6 to 20 digits.";
  }
  const age = readAge(ageInput);
  if (!age.ok) errors.age = age.error;
  if (genderInput && !isGender(genderInput)) errors.gender = "Choose a gender.";
  const addressError = optionalText(address, "Address", 200);
  if (addressError) errors.address = addressError;
  if (referringDoctorId && !isUuid(referringDoctorId))
    errors.referringDoctorId = "Choose a referring doctor.";
  if (consultationDoctorId && !isUuid(consultationDoctorId))
    errors.consultationDoctorId = "Choose a consultation doctor.";
  const fee = readMoney(feeInput || "0", "Consultation fee", true);
  if (!fee.ok) errors.consultationFee = fee.error;
  if (!isVisitType(visitType)) errors.visitType = "Choose OPD or IPD.";

  if (Object.keys(errors).length > 0 || !age.ok || !fee.ok || !isVisitType(visitType)) {
    return { ok: false as const, errors };
  }

  return {
    ok: true as const,
    data: {
      name,
      phone,
      age: age.age,
      gender: genderInput || null,
      address: address || null,
      referringDoctorId: referringDoctorId || null,
      consultationDoctorId: consultationDoctorId || null,
      consultationFee: fee.amount,
      visitType,
    },
  };
}

function permissionForVisit(visitType: VisitTypeName) {
  return visitType === "OPD" ? "visits:opd" : "visits:admit";
}

export async function registerPatient(
  actor: Actor,
  input: {
    name: string;
    phone: string | null;
    age: number | null;
    gender: string | null;
    address: string | null;
    referringDoctorId: string | null;
    consultationDoctorId: string | null;
    consultationFee: number;
    visitType: VisitTypeName;
  },
) {
  const denied =
    deny(actor, "patients:register") ?? deny(actor, permissionForVisit(input.visitType));
  if (denied) return denied;
  const doctor = await doctorSnapshot(input.referringDoctorId, "referring doctor");
  if (!doctor.ok) return doctor;
  const consultant = await doctorSnapshot(input.consultationDoctorId, "consultation doctor");
  if (!consultant.ok) return consultant;

  try {
    const patient = await prisma.patient.create({
      data: {
        name: input.name,
        phone: input.phone,
        age: input.age,
        gender: input.gender,
        address: input.address,
        visits: {
          create: {
            visitType: input.visitType,
            referringDoctor: doctor.name,
            referringDoctorId: doctor.id,
            consultationDoctor: consultant.name,
            consultationDoctorId: consultant.id,
            consultationFee: input.consultationFee,
          },
        },
      },
      select: { id: true, visits: { select: { id: true } } },
    });
    return { ok: true as const, patientId: patient.id, visitId: patient.visits[0]?.id };
  } catch (error) {
    if (error instanceof OperationError) return { ok: false as const, message: error.message };
    throw error;
  }
}

export function parsePatientDetails(formData: FormData) {
  const errors: Record<string, string> = {};
  const name = readText(formData.get("name"));
  const phoneInput = readText(formData.get("phone"));
  const ageInput = readText(formData.get("age"));
  const genderInput = readText(formData.get("gender"));
  const address = readText(formData.get("address"));

  const nameError = boundedText(name, "Name", 2, 80);
  if (nameError) errors.name = nameError;
  let phone: string | null = null;
  if (phoneInput) {
    phone = readPhone(phoneInput);
    if (!phone) errors.phone = "Enter a phone number with 6 to 20 digits.";
  }
  const age = readAge(ageInput);
  if (!age.ok) errors.age = age.error;
  const gender = !genderInput || genderInput === "unspecified" ? "" : genderInput;
  if (gender && !isGender(gender)) errors.gender = "Choose a gender.";
  const addressError = optionalText(address, "Address", 200);
  if (addressError) errors.address = addressError;

  if (Object.keys(errors).length > 0 || !age.ok) {
    return { ok: false as const, errors };
  }

  return {
    ok: true as const,
    data: {
      name,
      phone,
      age: age.age,
      gender: gender || null,
      address: address || null,
    },
  };
}

export async function updatePatient(
  actor: Actor & { name: string },
  patientId: string,
  input: {
    name: string;
    phone: string | null;
    age: number | null;
    gender: string | null;
    address: string | null;
  },
) {
  const denied = deny(actor, "patients:register");
  if (denied) return denied;
  if (!isUuid(patientId)) return { ok: false as const, message: "Patient not found." };
  const current = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, name: true, phone: true, age: true, gender: true, address: true },
  });
  if (!current) return { ok: false as const, message: "Patient not found." };

  const changes = fieldChanges([
    { field: "name", label: "Name", before: showValue(current.name), after: showValue(input.name) },
    {
      field: "phone",
      label: "Phone",
      before: showValue(current.phone),
      after: showValue(input.phone),
    },
    {
      field: "age",
      label: "Age",
      before: showValue(current.age),
      after: showValue(input.age),
    },
    {
      field: "gender",
      label: "Gender",
      before: showValue(current.gender),
      after: showValue(input.gender),
    },
    {
      field: "address",
      label: "Address",
      before: showValue(current.address),
      after: showValue(input.address),
    },
  ]);
  if (changes.length === 0) return { ok: true as const, unchanged: true as const };

  await prisma.$transaction(async (tx) => {
    await tx.patient.update({ where: { id: current.id }, data: input });
    await writeAudit(tx, {
      actorId: actor.id,
      actorName: actor.name,
      subjectType: "patient",
      subjectId: current.id,
      subjectName: input.name,
      summary: `Updated patient ${input.name}`,
      changes,
    });
  });
  return { ok: true as const, unchanged: false as const };
}

export function parseVisitStart(formData: FormData) {
  const errors: Record<string, string> = {};
  const referringDoctorId = readText(formData.get("referringDoctorId"));
  const consultationDoctorId = readText(formData.get("consultationDoctorId"));
  const visitType = readText(formData.get("visitType"));
  if (referringDoctorId && !isUuid(referringDoctorId))
    errors.referringDoctorId = "Choose a referring doctor.";
  if (consultationDoctorId && !isUuid(consultationDoctorId))
    errors.consultationDoctorId = "Choose a consultation doctor.";
  const fee = readMoney(readText(formData.get("consultationFee")) || "0", "Consultation fee", true);
  if (!fee.ok) errors.consultationFee = fee.error;
  if (!isVisitType(visitType)) errors.visitType = "Choose OPD or IPD.";
  if (Object.keys(errors).length > 0 || !fee.ok || !isVisitType(visitType)) {
    return { ok: false as const, errors };
  }
  return {
    ok: true as const,
    data: {
      referringDoctorId: referringDoctorId || null,
      consultationDoctorId: consultationDoctorId || null,
      consultationFee: fee.amount,
      visitType,
    },
  };
}

export async function startVisit(
  actor: Actor,
  patientId: string,
  input: {
    visitType: VisitTypeName;
    referringDoctorId: string | null;
    consultationDoctorId: string | null;
    consultationFee: number;
  },
) {
  const denied = deny(actor, permissionForVisit(input.visitType));
  if (denied) return denied;
  if (!isUuid(patientId)) return { ok: false as const, message: "Patient not found." };
  const doctor = await doctorSnapshot(input.referringDoctorId, "referring doctor");
  if (!doctor.ok) return doctor;
  const consultant = await doctorSnapshot(input.consultationDoctorId, "consultation doctor");
  if (!consultant.ok) return consultant;

  try {
    const visit = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.visit.findFirst({
          where: { patientId, visitType: input.visitType, status: "ACTIVE" },
          select: { id: true },
        });
        if (existing) {
          throw new OperationError(`This patient already has an active ${input.visitType} visit.`);
        }
        return tx.visit.create({
          data: {
            patientId,
            visitType: input.visitType,
            referringDoctor: doctor.name,
            referringDoctorId: doctor.id,
            consultationDoctor: consultant.name,
            consultationDoctorId: consultant.id,
            consultationFee: input.consultationFee,
          },
          select: { id: true },
        });
      },
      { isolationLevel: "Serializable" },
    );
    return { ok: true as const, visitId: visit.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { ok: false as const, message: "Patient not found." };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return { ok: false as const, message: "Someone else updated this patient. Try again." };
    }
    if (error instanceof OperationError) return { ok: false as const, message: error.message };
    throw error;
  }
}

export async function getVisit(id: string) {
  if (!isUuid(id)) return null;
  return prisma.visit.findUnique({
    where: { id },
    select: {
      id: true,
      visitType: true,
      status: true,
      referringDoctor: true,
      consultationDoctor: true,
      consultationFee: true,
      admissionDate: true,
      dischargeDate: true,
      clinicalNote: true,
      patient: { select: { id: true, name: true, phone: true, age: true, gender: true } },
      bed: { select: { id: true, bedNumber: true, wardType: true } },
      serviceCharges: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          serviceName: true,
          quantity: true,
          unitPrice: true,
          total: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function saveClinicalNote(actor: Actor, visitId: string, note: string) {
  const denied = deny(actor, "visits:note");
  if (denied) return denied;
  if (!isUuid(visitId)) return { ok: false as const, message: "Visit not found." };
  const noteError = note ? boundedText(note, "Note", 1, 4000) : null;
  if (noteError) return { ok: false as const, message: noteError };
  const updated = await prisma.visit.updateMany({
    where: { id: visitId, status: "ACTIVE" },
    data: { clinicalNote: note || null },
  });
  if (updated.count !== 1) {
    return { ok: false as const, message: "Notes can only be changed on an active visit." };
  }
  return { ok: true as const };
}

export async function addServiceCharge(
  actor: Actor,
  visitId: string,
  input: {
    serviceName: string;
    quantity: number;
    unitPrice: number;
  },
) {
  const denied = deny(actor, "visits:charge");
  if (denied) return denied;
  if (!isUuid(visitId)) return { ok: false as const, message: "Visit not found." };
  const total = roundMoney(input.quantity * input.unitPrice);
  try {
    await prisma.$transaction(async (tx) => {
      const locked = await tx.visit.updateMany({
        where: { id: visitId, status: "ACTIVE" },
        data: { status: "ACTIVE" },
      });
      if (locked.count !== 1) {
        throw new OperationError("Charges can only be added to an active visit.");
      }
      await tx.serviceCharge.create({
        data: {
          visitId,
          serviceName: input.serviceName,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          total,
        },
      });
    });
    return { ok: true as const };
  } catch (error) {
    if (error instanceof OperationError) return { ok: false as const, message: error.message };
    throw error;
  }
}

export function parseCharge(formData: FormData) {
  const errors: Record<string, string> = {};
  const serviceName = readText(formData.get("serviceName"));
  const nameError = boundedText(serviceName, "Service", 2, 80);
  if (nameError) errors.serviceName = nameError;
  const quantity = readQuantity(readText(formData.get("quantity")));
  if (!quantity.ok) errors.quantity = quantity.error;
  const price = readMoney(readText(formData.get("unitPrice")), "Price", true);
  if (!price.ok) errors.unitPrice = price.error;
  if (Object.keys(errors).length > 0 || !quantity.ok || !price.ok) {
    return { ok: false as const, errors };
  }
  return {
    ok: true as const,
    data: { serviceName, quantity: quantity.quantity, unitPrice: price.amount },
  };
}

export function parseNote(formData: FormData) {
  const note = readNote(formData.get("clinicalNote"));
  const error = note ? boundedText(note, "Note", 1, 4000) : null;
  if (error) return { ok: false as const, errors: { clinicalNote: error } };
  return { ok: true as const, note };
}

export async function dischargeVisit(actor: Actor, visitId: string) {
  const denied = deny(actor, "visits:discharge");
  if (denied) return denied;
  if (!isUuid(visitId)) return { ok: false as const, message: "Visit not found." };

  try {
    await prisma.$transaction(async (tx) => {
      const visit = await tx.visit.findUnique({
        where: { id: visitId },
        select: { status: true, bedId: true },
      });
      if (!visit) throw new OperationError("Visit not found.");
      if (visit.status !== "ACTIVE") throw new OperationError("This visit is already discharged.");
      const updated = await tx.visit.updateMany({
        where: { id: visitId, status: "ACTIVE" },
        data: { status: "DISCHARGED", dischargeDate: new Date(), bedId: null },
      });
      if (updated.count !== 1) throw new OperationError("This visit is already discharged.");
      if (visit.bedId) {
        await tx.bed.update({
          where: { id: visit.bedId },
          data: { status: "AVAILABLE" },
        });
      }
    });
    return { ok: true as const };
  } catch (error) {
    if (error instanceof OperationError) return { ok: false as const, message: error.message };
    throw error;
  }
}

export async function listBeds() {
  return prisma.bed.findMany({
    orderBy: [{ wardType: "asc" }, { bedNumber: "asc" }],
    select: {
      id: true,
      bedNumber: true,
      wardType: true,
      status: true,
      currentVisit: {
        select: {
          id: true,
          patient: { select: { name: true } },
        },
      },
    },
  });
}

export async function listAvailableBeds() {
  return prisma.bed.findMany({
    where: { status: "AVAILABLE" },
    orderBy: [{ wardType: "asc" }, { bedNumber: "asc" }],
    select: { id: true, bedNumber: true, wardType: true },
  });
}

export async function createBed(actor: Actor, bedNumber: string, wardType: WardTypeName) {
  const denied = deny(actor, "beds:manage");
  if (denied) return denied;
  try {
    await prisma.bed.create({ data: { bedNumber, wardType, status: "AVAILABLE" } });
    return { ok: true as const };
  } catch (error) {
    const message = uniqueMessage(error, "A bed with that number already exists.");
    if (message) return { ok: false as const, message };
    throw error;
  }
}

export function parseBed(formData: FormData) {
  const errors: Record<string, string> = {};
  const bedNumber = readText(formData.get("bedNumber")).toUpperCase();
  const wardType = readText(formData.get("wardType"));
  if (!/^[A-Z0-9][A-Z0-9-]{0,19}$/.test(bedNumber)) {
    errors.bedNumber = "Use letters, numbers, and hyphens, up to 20 characters.";
  }
  if (!isWardType(wardType)) errors.wardType = "Choose a ward.";
  if (Object.keys(errors).length > 0 || !isWardType(wardType)) {
    return { ok: false as const, errors };
  }
  return { ok: true as const, data: { bedNumber, wardType } };
}

export async function setBedAvailability(
  actor: Actor,
  bedId: string,
  status: "AVAILABLE" | "MAINTENANCE",
) {
  const denied = deny(actor, "beds:manage");
  if (denied) return denied;
  if (!isUuid(bedId)) return { ok: false as const, message: "Bed not found." };
  const from = status === "MAINTENANCE" ? "AVAILABLE" : "MAINTENANCE";
  const updated = await prisma.bed.updateMany({
    where: { id: bedId, status: from },
    data: { status },
  });
  if (updated.count !== 1) {
    return {
      ok: false as const,
      message: "Only an empty bed can move between available and maintenance.",
    };
  }
  return { ok: true as const };
}

export async function assignBed(actor: Actor, visitId: string, bedId: string) {
  const denied = deny(actor, "beds:manage");
  if (denied) return denied;
  if (!isUuid(visitId) || !isUuid(bedId)) {
    return { ok: false as const, message: "Choose a visit and an available bed." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const visit = await tx.visit.findUnique({
        where: { id: visitId },
        select: { status: true, visitType: true, bedId: true },
      });
      if (!visit || visit.status !== "ACTIVE" || visit.visitType !== "IPD") {
        throw new OperationError("Only an active inpatient visit can take a bed.");
      }
      if (visit.bedId) throw new OperationError("This visit already has a bed.");
      const claimed = await tx.bed.updateMany({
        where: { id: bedId, status: "AVAILABLE" },
        data: { status: "OCCUPIED" },
      });
      if (claimed.count !== 1) throw new OperationError("That bed is no longer available.");
      const assigned = await tx.visit.updateMany({
        where: { id: visitId, status: "ACTIVE", visitType: "IPD", bedId: null },
        data: { bedId },
      });
      if (assigned.count !== 1) throw new OperationError("This visit could not take that bed.");
    });
    return { ok: true as const };
  } catch (error) {
    if (error instanceof OperationError) return { ok: false as const, message: error.message };
    throw error;
  }
}

export async function createInventoryItem(
  actor: Actor,
  input: {
    itemName: string;
    category: string;
    quantity: number;
    unit: string;
  },
) {
  const denied = deny(actor, "inventory:manage");
  if (denied) return denied;
  try {
    await prisma.inventory.create({ data: input });
    return { ok: true as const };
  } catch (error) {
    const message = uniqueMessage(error, "An item with that name already exists.");
    if (message) return { ok: false as const, message };
    throw error;
  }
}

export function parseInventoryItem(formData: FormData) {
  const errors: Record<string, string> = {};
  const itemName = readText(formData.get("itemName"));
  const category = readText(formData.get("category"));
  const unit = readText(formData.get("unit"));
  const nameError = boundedText(itemName, "Item", 2, 80);
  if (nameError) errors.itemName = nameError;
  if (!isItemCategory(category)) errors.category = "Choose a category.";
  const unitError = boundedText(unit, "Unit", 1, 20);
  if (unitError) errors.unit = unitError;
  const quantity = readStock(readText(formData.get("quantity")) || "0");
  if (!quantity.ok) errors.quantity = quantity.error;
  if (Object.keys(errors).length > 0 || !quantity.ok || !isItemCategory(category)) {
    return { ok: false as const, errors };
  }
  return { ok: true as const, data: { itemName, category, unit, quantity: quantity.quantity } };
}

export async function updateStock(actor: Actor, itemId: string, quantity: number) {
  const denied = deny(actor, "inventory:manage");
  if (denied) return denied;
  if (!isUuid(itemId)) return { ok: false as const, message: "Item not found." };
  const updated = await prisma.inventory.updateMany({
    where: { id: itemId },
    data: { quantity },
  });
  if (updated.count !== 1) return { ok: false as const, message: "Item not found." };
  return { ok: true as const };
}

export async function logExpense(actor: Actor, input: { description: string; amount: number }) {
  const denied = deny(actor, "expenses:create");
  if (denied) return denied;
  await prisma.expense.create({
    data: { description: input.description, amount: input.amount, loggedById: actor.id },
  });
  return { ok: true as const };
}

export function parseExpense(formData: FormData) {
  const errors: Record<string, string> = {};
  const description = readText(formData.get("description"));
  const descriptionError = boundedText(description, "Description", 2, 200);
  if (descriptionError) errors.description = descriptionError;
  const amount = readMoney(readText(formData.get("amount")), "Amount", false);
  if (!amount.ok) errors.amount = amount.error;
  if (Object.keys(errors).length > 0 || !amount.ok) return { ok: false as const, errors };
  return { ok: true as const, data: { description, amount: amount.amount } };
}

export async function getDashboard(actor: { role: string; permissions: string[] }) {
  const allow = (permission: Parameters<typeof can>[1]) => can(actor, permission);
  const start = startOfHospitalDay();
  const [activeOpd, activeIpd, available, occupied, maintenance, patientsToday, recent] =
    await Promise.all([
      prisma.visit.count({ where: { status: "ACTIVE", visitType: "OPD" } }),
      prisma.visit.count({ where: { status: "ACTIVE", visitType: "IPD" } }),
      prisma.bed.count({ where: { status: "AVAILABLE" } }),
      prisma.bed.count({ where: { status: "OCCUPIED" } }),
      prisma.bed.count({ where: { status: "MAINTENANCE" } }),
      allow("patients:view")
        ? prisma.patient.count({ where: { createdAt: { gte: start } } })
        : Promise.resolve(0),
      allow("patients:view")
        ? prisma.visit.findMany({
            orderBy: { admissionDate: "desc" },
            take: 8,
            select: {
              id: true,
              visitType: true,
              status: true,
              admissionDate: true,
              patient: { select: { name: true } },
              bed: { select: { bedNumber: true } },
            },
          })
        : Promise.resolve([]),
    ]);

  const [fees, charges, expenses, lowStock] = await Promise.all([
    allow("reports:fees")
      ? prisma.visit.aggregate({
          where: { admissionDate: { gte: start } },
          _sum: { consultationFee: true },
        })
      : Promise.resolve(null),
    allow("reports:charges")
      ? prisma.serviceCharge.aggregate({
          where: { createdAt: { gte: start } },
          _sum: { total: true },
        })
      : Promise.resolve(null),
    allow("reports:expenses")
      ? prisma.expense.aggregate({
          where: { expenseDate: { gte: start } },
          _sum: { amount: true },
        })
      : Promise.resolve(null),
    allow("inventory:view")
      ? prisma.inventory.findMany({
          where: { quantity: { lte: LOW_STOCK_AT } },
          orderBy: { quantity: "asc" },
          take: 5,
          select: { id: true, itemName: true, quantity: true, unit: true },
        })
      : Promise.resolve(null),
  ]);

  return {
    timeZone: hospitalTimeZone(),
    activeOpd,
    activeIpd,
    beds: { available, occupied, maintenance },
    patientsToday,
    feesToday: fees ? (fees._sum.consultationFee ?? 0) : null,
    chargesToday: charges ? (charges._sum.total ?? 0) : null,
    expensesToday: expenses ? (expenses._sum.amount ?? 0) : null,
    recent,
    lowStock,
    lowStockAt: LOW_STOCK_AT,
  };
}
