import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { boundedText, isUuid, optionalText, readPhone, readText } from "@/lib/validation";

export async function listDoctors() {
  return prisma.doctor.findMany({
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, specialty: true, phone: true, createdAt: true },
  });
}

export async function doctorChoices() {
  const doctors = await prisma.doctor.findMany({
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, specialty: true },
  });
  return doctors.map((doctor) => ({
    value: doctor.id,
    label: doctor.name,
    specialty: doctor.specialty,
  }));
}

export function parseDoctor(formData: FormData) {
  const errors: Record<string, string> = {};
  const name = readText(formData.get("name"));
  const specialty = readText(formData.get("specialty"));
  const phoneInput = readText(formData.get("phone"));

  const nameError = boundedText(name, "Name", 2, 80);
  if (nameError) errors.name = nameError;
  const specialtyError = optionalText(specialty, "Specialty", 80);
  if (specialtyError) errors.specialty = specialtyError;

  let phone: string | null = null;
  if (phoneInput) {
    phone = readPhone(phoneInput);
    if (!phone) errors.phone = "Enter a phone number with 6 to 20 digits.";
  }

  if (Object.keys(errors).length > 0 || (phoneInput && !phone)) {
    return { ok: false as const, errors };
  }

  return {
    ok: true as const,
    data: { name, specialty: specialty || null, phone },
  };
}

export async function createDoctor(role: string, input: { name: string; specialty: string | null; phone: string | null }) {
  if (!can(role, "doctors:manage")) {
    return { ok: false as const, message: "You do not have access to do that." };
  }
  const doctor = await prisma.doctor.create({
    data: input,
    select: { id: true },
  });
  return { ok: true as const, id: doctor.id };
}

export async function referringDoctorSnapshot(id: string | null) {
  if (!id) return { ok: true as const, id: null, name: null };
  if (!isUuid(id)) return { ok: false as const, message: "Choose a referring doctor from the list." };
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!doctor) return { ok: false as const, message: "Choose a referring doctor from the list." };
  return { ok: true as const, id: doctor.id, name: doctor.name };
}
