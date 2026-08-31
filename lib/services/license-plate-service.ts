import { parityLabelMy } from "@/lib/i18n/my";
import type { PlateParity } from "@/lib/db";

const BURMESE_DIGITS: Record<string, string> = {
  "၀": "0",
  "၁": "1",
  "၂": "2",
  "၃": "3",
  "၄": "4",
  "၅": "5",
  "၆": "6",
  "၇": "7",
  "၈": "8",
  "၉": "9",
};

export type PlateParseResult =
  | { confidence: "high"; parity: PlateParity; lastDigit: number }
  | { confidence: "low"; suggestedParity?: PlateParity; lastDigit?: number };

export function normalizePlate(raw: string): string {
  return raw
    .trim()
    .split("")
    .map((char) => BURMESE_DIGITS[char] ?? char)
    .join("")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function extractNumericSequences(plate: string): string[] {
  const normalized = normalizePlate(plate);
  const matches = normalized.match(/\d+/g);
  return matches ?? [];
}

function extractPlateSeriesNumber(plate: string): string | null {
  const normalized = normalizePlate(plate);
  const match = normalized.match(/(?:^|[\s/-])(\d+)\s*[A-Z]/);
  return match?.[1] ?? null;
}

export function parsePlateParity(licensePlate: string): PlateParseResult {
  const seriesNumber = extractPlateSeriesNumber(licensePlate);
  if (seriesNumber) {
    const lastDigit = Number(seriesNumber.at(-1));
    const parity: PlateParity = lastDigit % 2 === 0 ? "EVEN" : "ODD";
    return { confidence: "high", parity, lastDigit };
  }

  const sequences = extractNumericSequences(licensePlate);

  if (sequences.length === 0) {
    return { confidence: "low" };
  }

  const primary = sequences[sequences.length - 1];
  const lastChar = primary.at(-1);

  if (!lastChar || !/\d/.test(lastChar)) {
    return { confidence: "low" };
  }

  const lastDigit = Number(lastChar);
  const parity: PlateParity = lastDigit % 2 === 0 ? "EVEN" : "ODD";

  const hasAmbiguousSuffix = /[^0-9\s-]$/.test(normalizePlate(licensePlate).replace(/\d+$/, ""));

  if (hasAmbiguousSuffix && sequences.length === 1 && primary.length < 2) {
    return { confidence: "low", suggestedParity: parity, lastDigit };
  }

  return { confidence: "high", parity, lastDigit };
}

export function parityLabel(parity: PlateParity): string {
  return parityLabelMy(parity);
}
