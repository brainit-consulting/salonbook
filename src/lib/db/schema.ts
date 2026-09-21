import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

const tz = (name: string) => timestamp(name, { withTimezone: true });

// What the salon sells: a name, how long it takes, what it costs.
export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  priceCents: integer("price_cents").notNull(),
  // Removing a service hides it from booking but keeps past bookings readable.
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: tz("created_at").notNull().defaultNow(),
});

export const stylists = pgTable("stylists", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: tz("created_at").notNull().defaultNow(),
});

// Which stylist does which service.
export const stylistServices = pgTable(
  "stylist_services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stylistId: uuid("stylist_id")
      .notNull()
      .references(() => stylists.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
  },
  (t) => [unique("stylist_service_once").on(t.stylistId, t.serviceId)],
);

// The same hours every week. Minutes are counted from midnight, salon time.
export const workingHours = pgTable("working_hours", {
  id: uuid("id").primaryKey().defaultRandom(),
  stylistId: uuid("stylist_id")
    .notNull()
    .references(() => stylists.id, { onDelete: "cascade" }),
  weekday: integer("weekday").notNull(), // 0 = Sunday … 6 = Saturday
  startMinute: integer("start_minute").notNull(),
  endMinute: integer("end_minute").notNull(),
});

// A stylist blocked out for a day or part of one.
export const timeOff = pgTable("time_off", {
  id: uuid("id").primaryKey().defaultRandom(),
  stylistId: uuid("stylist_id")
    .notNull()
    .references(() => stylists.id, { onDelete: "cascade" }),
  startsAt: tz("starts_at").notNull(),
  endsAt: tz("ends_at").notNull(),
  reason: text("reason"),
  createdAt: tz("created_at").notNull().defaultNow(),
});

// A custom migration adds an exclusion constraint on this table so two live
// bookings for one stylist can never overlap. Drizzle cannot express it.
export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "restrict" }),
  stylistId: uuid("stylist_id")
    .notNull()
    .references(() => stylists.id, { onDelete: "restrict" }),
  startsAt: tz("starts_at").notNull(),
  endsAt: tz("ends_at").notNull(),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  clientEmail: text("client_email").notNull(),
  status: text("status").notNull().default("booked"), // booked | cancelled
  source: text("source").notNull().default("client"), // client | owner | agent
  // The private link in the confirmation email. Unguessable, one per booking.
  cancelToken: text("cancel_token").notNull().unique(),
  cancelledAt: tz("cancelled_at"),
  cancelledBy: text("cancelled_by"), // client | owner | agent
  createdAt: tz("created_at").notNull().defaultNow(),
});

// Every email the app writes, sent or not. Written before anything is sent.
export const emailLog = pgTable("email_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  template: text("template").notNull(),
  status: text("status").notNull(), // pending | logged | sent | delivered | bounced | complained | failed
  html: text("html"),
  text: text("text"),
  providerId: text("provider_id"),
  error: text("error"),
  createdAt: tz("created_at").notNull().defaultNow(),
  updatedAt: tz("updated_at").notNull().defaultNow(),
});

// What changed in the salon, in the salon's own words.
export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  detail: jsonb("detail"),
  createdAt: tz("created_at").notNull().defaultNow(),
});

// Every tool call an AI agent makes, reads included.
export const mcpCallLog = pgTable("mcp_call_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  clientId: text("client_id"),
  tool: text("tool").notNull(),
  args: jsonb("args"),
  ok: boolean("ok").notNull(),
  durationMs: integer("duration_ms"),
  rowCount: integer("row_count"),
  error: text("error"),
  createdAt: tz("created_at").notNull().defaultNow(),
});
