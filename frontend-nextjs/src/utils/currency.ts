export function formatCurrency(amount: number, currency: string = 'DZD'): string {
  try {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    // Fallback if currency is not recognized by Intl
    return `${new Intl.NumberFormat('fr-DZ', { minimumFractionDigits: 2 }).format(amount)} ${currency}`;
  }
}
