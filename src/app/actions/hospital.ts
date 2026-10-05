"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import {
  addServiceCharge,
  assignBed,
  createBed,
  createInventoryItem,
  dischargeVisit,
  logExpense,
  parseBed,
  parseCharge,
  parseExpense,
  parseInventoryItem,
  parseNote,
  parsePatientDetails,
  parseRegistration,
  parseVisitStart,
  registerPatient,
  updatePatient,
  saveClinicalNote,
  setBedAvailability,
  startVisit,
  updateStock,
} from "@/lib/hospital";
import { isUuid, readStock, readText } from "@/lib/validation";

function refresh(...paths: string[]) {
  for (const path of new Set(paths)) {
    revalidatePath(path);
  }
}

export async function registerPatientAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser();
  const parsed = parseRegistration(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  const result = await registerPatient(actor, parsed.data);
  if (!result.ok) return { ok: false, message: result.message };
  refresh("/", "/patients", `/patients/${result.patientId}`);
  redirect(`/patients/${result.patientId}`);
}

export async function updatePatientAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser();
  const patientId = readText(formData.get("patientId"));
  const parsed = parsePatientDetails(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  const result = await updatePatient(actor, patientId, parsed.data);
  if (!result.ok) return { ok: false, message: result.message };
  if (result.unchanged) return { ok: true, message: "No changes to save." };
  refresh("/", "/patients", `/patients/${patientId}`, "/activity");
  redirect(`/patients/${patientId}`);
}

export async function startVisitAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser();
  const patientId = readText(formData.get("patientId"));
  const parsed = parseVisitStart(formData);
  if (!isUuid(patientId)) return { ok: false, message: "Patient not found." };
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  const result = await startVisit(actor, patientId, parsed.data);
  if (!result.ok) return { ok: false, message: result.message };
  refresh("/", "/patients", `/patients/${patientId}`, `/visits/${result.visitId}`);
  redirect(`/visits/${result.visitId}`);
}

export async function saveNoteAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser();
  const visitId = readText(formData.get("visitId"));
  const parsed = parseNote(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  const result = await saveClinicalNote(actor, visitId, parsed.note);
  if (!result.ok) return result;
  refresh(`/visits/${visitId}`);
  return { ok: true, message: "Note saved." };
}

export async function addChargeAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser();
  const visitId = readText(formData.get("visitId"));
  const parsed = parseCharge(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  const result = await addServiceCharge(actor, visitId, parsed.data);
  if (!result.ok) return result;
  refresh(`/visits/${visitId}`, "/");
  return { ok: true, message: "Charge added." };
}

export async function dischargeVisitAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser();
  if (formData.get("confirm") !== "on") {
    return { ok: false, message: "Confirm the discharge before continuing." };
  }
  const visitId = readText(formData.get("visitId"));
  const result = await dischargeVisit(actor, visitId);
  if (!result.ok) return result;
  refresh("/", "/patients", "/beds", `/visits/${visitId}`);
  return { ok: true, message: "Patient discharged." };
}

export async function createBedAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser();
  const parsed = parseBed(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  const result = await createBed(actor, parsed.data.bedNumber, parsed.data.wardType);
  if (!result.ok) return result;
  refresh("/beds", "/");
  redirect("/beds");
}

export async function setBedStatusAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser();
  const status = readText(formData.get("status"));
  if (status !== "AVAILABLE" && status !== "MAINTENANCE") {
    return { ok: false, message: "Choose available or maintenance." };
  }
  const result = await setBedAvailability(actor, readText(formData.get("bedId")), status);
  if (!result.ok) return result;
  refresh("/beds", "/");
  return {
    ok: true,
    message: status === "MAINTENANCE" ? "Bed marked for maintenance." : "Bed is available.",
  };
}

export async function assignBedAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser();
  const visitId = readText(formData.get("visitId"));
  const bedId = readText(formData.get("bedId"));
  const result = await assignBed(actor, visitId, bedId);
  if (!result.ok) return result;
  refresh("/beds", "/", `/visits/${visitId}`);
  return { ok: true, message: "Bed assigned." };
}

export async function createItemAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser();
  const parsed = parseInventoryItem(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  const result = await createInventoryItem(actor, parsed.data);
  if (!result.ok) return result;
  refresh("/inventory", "/");
  redirect("/inventory");
}

export async function updateStockAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser();
  const quantity = readStock(readText(formData.get("quantity")));
  if (!quantity.ok) return { ok: false, message: quantity.error };
  const result = await updateStock(actor, readText(formData.get("itemId")), quantity.quantity);
  if (!result.ok) return result;
  refresh("/inventory", "/");
  return { ok: true, message: "Stock updated." };
}

export async function logExpenseAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireUser();
  const parsed = parseExpense(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  const result = await logExpense(actor, parsed.data);
  if (!result.ok) return result;
  refresh("/expenses", "/");
  redirect("/expenses");
}
