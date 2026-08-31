import "dotenv/config";
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db, notifications, petrolCycles, petrolTransactions, users, vehicles } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { recordPetrolTransaction, PetrolCycleError } from "@/lib/services/petrol-cycle-service";
import { seedDefaultSettings } from "@/lib/settings";
import {
  markAllNotificationsRead,
  syncDailyNotifications,
} from "@/lib/services/notification-service";

async function resetDb() {
  await db.delete(notifications);
  await db.delete(petrolTransactions);
  await db.delete(petrolCycles);
  await db.delete(vehicles);
  await db.delete(users);
}

describe("security and concurrency", () => {
  beforeEach(async () => {
    await resetDb();
    await seedDefaultSettings();
  });

  it("prevents user A from recording petrol on user B vehicle", async () => {
    const passwordHash = await hashPassword("Password1");
    const [[userA], [userB]] = await Promise.all([
      db.insert(users).values({ email: "a@test.com", passwordHash }).returning(),
      db.insert(users).values({ email: "b@test.com", passwordHash }).returning(),
    ]);

    const [vehicleB] = await db
      .insert(vehicles)
      .values({
        userId: userB.id,
        name: "B Car",
        licensePlate: "B-1234",
        plateParity: "EVEN",
      })
      .returning();

    await expect(
      recordPetrolTransaction({
        vehicleId: vehicleB.id,
        userId: userA.id,
        litres: 10,
        transactionAt: new Date("2026-08-11T12:00:00+06:30"),
      }),
    ).rejects.toBeInstanceOf(PetrolCycleError);
  });

  it("serializes concurrent refills that jointly exceed remaining litres", async () => {
    const passwordHash = await hashPassword("Password1");
    const [user] = await db.insert(users).values({ email: "c@test.com", passwordHash }).returning();

    const [vehicle] = await db
      .insert(vehicles)
      .values({
        userId: user.id,
        name: "Car",
        licensePlate: "C-1231",
        plateParity: "ODD",
      })
      .returning();

    await recordPetrolTransaction({
      vehicleId: vehicle.id,
      userId: user.id,
      litres: 35,
      transactionAt: new Date("2026-08-11T12:00:00+06:30"),
    });

    const attempts = await Promise.allSettled([
      recordPetrolTransaction({
        vehicleId: vehicle.id,
        userId: user.id,
        litres: 3,
        transactionAt: new Date("2026-08-13T12:00:00+06:30"),
      }),
      recordPetrolTransaction({
        vehicleId: vehicle.id,
        userId: user.id,
        litres: 3,
        transactionAt: new Date("2026-08-13T12:00:00+06:30"),
      }),
    ]);

    const fulfilled = attempts.filter((result) => result.status === "fulfilled");
    const rejected = attempts.filter((result) => result.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const [cycle] = await db.select().from(petrolCycles).where(eq(petrolCycles.vehicleId, vehicle.id)).limit(1);
    const txs = cycle
      ? await db.select().from(petrolTransactions).where(eq(petrolTransactions.cycleId, cycle.id))
      : [];

    const total = txs.reduce((sum, tx) => sum + tx.litres, 0);
    expect(total).toBe(38);
  });

  it("discards an expired partial balance and starts a fresh allocation", async () => {
    const passwordHash = await hashPassword("Password1");
    const [user] = await db
      .insert(users)
      .values({ email: "rollover@test.com", passwordHash })
      .returning();
    const [vehicle] = await db
      .insert(vehicles)
      .values({
        userId: user.id,
        name: "Rollover Car",
        licensePlate: "1A-1231",
        plateParity: "ODD",
      })
      .returning();

    await recordPetrolTransaction({
      vehicleId: vehicle.id,
      userId: user.id,
      litres: 18,
      transactionAt: new Date("2026-08-11T12:00:00+06:30"),
    });
    await recordPetrolTransaction({
      vehicleId: vehicle.id,
      userId: user.id,
      litres: 40,
      transactionAt: new Date("2026-08-19T12:00:00+06:30"),
    });

    const cycles = await db
      .select()
      .from(petrolCycles)
      .where(eq(petrolCycles.vehicleId, vehicle.id))
      .orderBy(petrolCycles.cycleNumber);
    const transactions = await db
      .select()
      .from(petrolTransactions)
      .where(eq(petrolTransactions.cycleId, cycles[1].id));

    expect(cycles).toHaveLength(2);
    expect(cycles[0]).toMatchObject({ status: "SUPERSEDED", allowedLitres: 40 });
    expect(cycles[1]).toMatchObject({ status: "COMPLETED", allowedLitres: 40 });
    expect(transactions.map((transaction) => transaction.litres)).toEqual([40]);
  });

  it("deduplicates daily notifications and can mark all as read", async () => {
    const passwordHash = await hashPassword("Password1");
    const [user] = await db.insert(users).values({ email: "notify@test.com", passwordHash }).returning();
    await db.insert(vehicles).values({
      userId: user.id,
      name: "Notify Car",
      licensePlate: "2A-1234",
      plateParity: "EVEN",
    });
    const restrictedOddDay = new Date("2026-08-11T12:00:00+06:30");

    await Promise.all([
      syncDailyNotifications(user.id, restrictedOddDay),
      syncDailyNotifications(user.id, restrictedOddDay),
    ]);

    const rows = await db.select().from(notifications).where(eq(notifications.userId, user.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe("DRIVING_RESTRICTED");

    await markAllNotificationsRead(user.id);
    const [updated] = await db.select().from(notifications).where(eq(notifications.id, rows[0].id));
    expect(updated.readAt).not.toBeNull();
  });
});
