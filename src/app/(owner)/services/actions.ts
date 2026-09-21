"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwnerAction } from "@/lib/auth-guards";
import { createService, setServiceActive, updateService } from "@/lib/salon/catalog";
import { type ActionResult, invalid, salonResult } from "./action-result";
import { parsePriceToCents, parseWholeMinutes } from "./parse";

const serviceFields = z.object({
  name: z.string().max(80),
  minutes: z.string().max(10),
  price: z.string().max(12),
});
const serviceId = z.uuid();

export type ServiceFields = z.input<typeof serviceFields>;

// Services show on the stylist pages and on every booking page, so the whole
// site is refreshed rather than a list of paths that could fall behind.
function refresh() {
  revalidatePath("/", "layout");
}

function readService(fields: ServiceFields) {
  const parsed = serviceFields.safeParse(fields);
  if (!parsed.success) return invalid("Check the name, length and price.");
  const durationMinutes = parseWholeMinutes(parsed.data.minutes);
  if (durationMinutes === null) return invalid("Length is a whole number of minutes, like 45.");
  const priceCents = parsePriceToCents(parsed.data.price);
  if (priceCents === null) return invalid("Price is dollars and cents, like 45 or 45.50.");
  return { name: parsed.data.name, durationMinutes, priceCents };
}

export async function addServiceAction(fields: ServiceFields): Promise<ActionResult> {
  const session = await requireOwnerAction();
  const input = readService(fields);
  if ("ok" in input) return input;
  const result = await salonResult(() => createService(input, session.user.id));
  refresh();
  return result;
}

export async function editServiceAction(id: string, fields: ServiceFields): Promise<ActionResult> {
  const session = await requireOwnerAction();
  if (!serviceId.safeParse(id).success) return invalid("That service doesn't exist.");
  const input = readService(fields);
  if ("ok" in input) return input;
  const result = await salonResult(() => updateService(id, input, session.user.id));
  refresh();
  return result;
}

export async function setServiceActiveAction(id: string, active: boolean): Promise<ActionResult> {
  const session = await requireOwnerAction();
  if (!serviceId.safeParse(id).success) return invalid("That service doesn't exist.");
  const result = await salonResult(() => setServiceActive(id, active === true, session.user.id));
  refresh();
  return result;
}
