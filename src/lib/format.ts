/* Formato de números — Gold Mining 2.0 */
export function formatUSDT(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function formatUSD(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`;
}
export function formatPct(pct: number): string {
  return `${pct.toFixed(1)}%`;
}
export function formatEnergy(amount: number): string {
  return `${Math.round(amount)} ⚡`;
}
