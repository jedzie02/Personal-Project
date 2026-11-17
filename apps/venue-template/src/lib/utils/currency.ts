/**
 * Formats a number into Philippine Peso currency format.
 * Uses Intl.NumberFormat with style: 'currency', currency: 'PHP', and currencyDisplay: 'symbol'.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    currencyDisplay: "symbol",
  }).format(amount);
}

/**
 * Quick helper for standard peso formatting (₱XX.XX)
 */
export function formatPeso(amount: number): string {
  return `₱${amount.toFixed(2)}`;
}
