import { eq } from "drizzle-orm";
import { db, systemSettings } from "@/lib/db";

export const DEFAULT_SETTINGS = {
  petrol_allocation_litres: "40",
  petrol_cycle_interval_days: "7",
  app_timezone: "Asia/Yangon",
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;

export async function getSetting(key: SettingKey): Promise<string> {
  const [row] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, key))
    .limit(1);
  return row?.value ?? DEFAULT_SETTINGS[key];
}

export async function getNumericSetting(key: SettingKey): Promise<number> {
  const value = await getSetting(key);
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return Number(DEFAULT_SETTINGS[key]);
  }
  return parsed;
}

export async function getAppTimezone(): Promise<string> {
  return getSetting("app_timezone");
}

export async function seedDefaultSettings(): Promise<void> {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db
      .insert(systemSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value, updatedAt: new Date() },
      });
  }
}
