import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { db, notifications, vehicles, type NotificationType } from "@/lib/db";
import { my, parityLabelMy } from "@/lib/i18n/my";
import { getVehiclePetrolSummary } from "@/lib/services/petrol-cycle-service";
import { isDrivingAllowedForParity } from "@/lib/services/vehicle-restriction-service";
import { getAppTimezone } from "@/lib/settings";
import { formatAppDateInput, startOfAppDay } from "@/lib/timezone";

export async function syncDailyNotifications(userId: string, asOf = new Date()) {
  const timezone = await getAppTimezone();
  const today = startOfAppDay(asOf, timezone);

  const userVehicles = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.userId, userId), eq(vehicles.isActive, true)));

  for (const vehicle of userVehicles) {
    const drivingAllowed = isDrivingAllowedForParity(vehicle.plateParity, today, timezone);

    if (!drivingAllowed) {
      await upsertNotification({
        userId,
        vehicleId: vehicle.id,
        type: "DRIVING_RESTRICTED",
        title: my.notifications.drivingRestrictedTitle,
        message: my.notifications.drivingRestrictedMsg(
          vehicle.name,
          vehicle.licensePlate,
          parityLabelMy(vehicle.plateParity),
        ),
        asOf,
        timezone,
      });
    }

    const summary = await getVehiclePetrolSummary(vehicle.id, userId, asOf);

    if (summary.status === "OPEN" && summary.remainingLitres > 0 && summary.drivingAllowed) {
      await upsertNotification({
        userId,
        vehicleId: vehicle.id,
        type: "PETROL_REMAINING",
        title: my.notifications.petrolRemainingTitle,
        message: my.notifications.petrolRemainingMsg(summary.remainingLitres, vehicle.name),
        asOf,
        timezone,
      });
    }

    if (summary.isEligibleForNewCycle && summary.persistedStatus && summary.drivingAllowed) {
      await upsertNotification({
        userId,
        vehicleId: vehicle.id,
        type: "PETROL_ELIGIBLE",
        title: my.notifications.petrolEligibleTitle,
        message: my.notifications.petrolEligibleMsg(vehicle.name, vehicle.licensePlate),
        asOf,
        timezone,
      });
    }
  }
}

async function upsertNotification(input: {
  userId: string;
  vehicleId: string;
  type: NotificationType;
  title: string;
  message: string;
  asOf: Date;
  timezone: string;
}) {
  const dayStart = startOfAppDay(input.asOf, input.timezone);
  const notificationDate = formatAppDateInput(dayStart, input.timezone);

  const [existing] = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, input.userId),
        eq(notifications.vehicleId, input.vehicleId),
        eq(notifications.type, input.type),
        eq(notifications.notificationDate, notificationDate),
        isNull(notifications.readAt),
        gte(notifications.createdAt, dayStart),
      ),
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      vehicleId: input.vehicleId,
      type: input.type,
      title: input.title,
      message: input.message,
      notificationDate,
    })
    .onConflictDoNothing()
    .returning();
  return created ?? existing;
}

export async function listNotifications(userId: string) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function markNotificationRead(userId: string, notificationId: string) {
  return db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: string) {
  return db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}
