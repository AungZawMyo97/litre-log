import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const plateParityEnum = pgEnum("plate_parity", ["ODD", "EVEN"]);
export const petrolCycleStatusEnum = pgEnum("petrol_cycle_status", ["OPEN", "COMPLETED", "SUPERSEDED"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "PETROL_ELIGIBLE",
  "PETROL_REMAINING",
  "DRIVING_RESTRICTED",
]);

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const vehicles = pgTable(
  "vehicles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    licensePlate: text("license_plate").notNull(),
    plateParity: plateParityEnum("plate_parity").notNull(),
    paritySource: text("parity_source").default("auto").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("vehicles_user_id_idx").on(table.userId)],
);

export const petrolCycles = pgTable(
  "petrol_cycles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    cycleNumber: integer("cycle_number").notNull(),
    status: petrolCycleStatusEnum("status").default("OPEN").notNull(),
    allowedLitres: doublePrecision("allowed_litres").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    nextEligibleAt: timestamp("next_eligible_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    version: integer("version").default(0).notNull(),
  },
  (table) => [
    uniqueIndex("petrol_cycles_vehicle_cycle_idx").on(table.vehicleId, table.cycleNumber),
    index("petrol_cycles_vehicle_status_idx").on(table.vehicleId, table.status),
  ],
);

export const petrolTransactions = pgTable(
  "petrol_transactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    cycleId: text("cycle_id")
      .notNull()
      .references(() => petrolCycles.id, { onDelete: "cascade" }),
    litres: doublePrecision("litres").notNull(),
    transactionAt: timestamp("transaction_at", { withTimezone: true }).notNull(),
    station: text("station"),
    receiptRef: text("receipt_ref"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("petrol_transactions_cycle_id_idx").on(table.cycleId)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vehicleId: text("vehicle_id"),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("notifications_user_read_idx").on(table.userId, table.readAt)],
);

export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type PetrolCycle = typeof petrolCycles.$inferSelect;
export type PetrolTransaction = typeof petrolTransactions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type PlateParity = (typeof plateParityEnum.enumValues)[number];
export type PetrolCycleStatus = (typeof petrolCycleStatusEnum.enumValues)[number];
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
