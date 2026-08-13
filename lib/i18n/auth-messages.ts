import { my } from "@/lib/i18n/my";

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return my.errors.passwordMin;
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return my.errors.passwordComplex;
  }
  return null;
}
