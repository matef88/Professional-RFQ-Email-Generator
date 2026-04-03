export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const match = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return match.test(email);
}

export function isValidEmailList(emails: string): boolean {
  if (!emails) return false;
  return emails.split(",").every((part) => {
    const trimmed = part.trim();
    if (!trimmed) return false;
    return isValidEmail(trimmed);
  });
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (["file:", "data:", "blob:"].includes(parsed.protocol)) return false;
    return true;
  } catch {
    return false;
  }
}

export interface RfqFormData {
  packageName: string;
  reference?: string;
  deadline?: string;
  template?: string;
  details?: string;
  packageLink?: string;
  docsLink?: string;
  supplierIds?: string[];
}

export function validateRfqForm(data: RfqFormData): {
  isValid: boolean;
  errors: Record<string, string> | null;
} {
  const errors: Record<string, string> = {};

  if (!data.packageName?.trim()) {
    errors.packageName = "Package name is required";
  }

  if (data.supplierIds === undefined || data.supplierIds.length === 0) {
    errors.supplierIds = "At least one supplier should be selected";
  }

  return { isValid: Object.keys(errors).length === 0, errors: Object.keys(errors).length > 0 ? errors : null };
}
