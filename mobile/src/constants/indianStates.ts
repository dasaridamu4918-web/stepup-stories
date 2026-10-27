export const INDIAN_STATES_AND_UTS: string[] = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi (NCT)",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

/**
 * Formats an integer/float amount in Indian Rupees (₹) with Indian numbering commas (e.g., ₹1,499)
 */
export function formatINR(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `₹${safe.toLocaleString("en-IN")}`;
}

/**
 * Computes exact savings amount and discount percentage from selling price and original price
 */
export function calculateSavings(
  sellingPrice: number,
  originalPrice: number
): { savingsAmount: number; discountPercent: number } {
  const sale = Math.max(0, Number(sellingPrice) || 0);
  const orig = Math.max(sale, Number(originalPrice) || sale);
  const savingsAmount = Math.max(0, orig - sale);
  const discountPercent =
    orig > sale ? Math.round(((orig - sale) / orig) * 1000) / 10 : 0;
  return { savingsAmount, discountPercent };
}

/**
 * Validates a 6-digit Indian PIN code (first digit 1-9)
 */
export function isValidIndianPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

/**
 * Validates a 10-digit Indian mobile number (starts with 6, 7, 8, or 9)
 */
export function isValidIndianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "").replace(/^91/, "");
  return /^[6-9][0-9]{9}$/.test(digits);
}

export function normalizeIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  return digits.slice(-10);
}
