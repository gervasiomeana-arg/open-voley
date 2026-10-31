/** Shared presentation/server calculation; only the server may write payment receipts. */
export function recurringPaidThrough(account: { payments?: unknown[] }): number {
  const dates = (account.payments || []).filter((p: any) => p.recurring && p.status === 'approved')
    .map((p: any) => Date.parse(p.periodEnd)).filter(Number.isFinite);
  return dates.length ? Math.max(...dates) : -Infinity;
}
export function effectiveAccessDays(account: { firstLoginDate: string; trialDurationDays?: number; customGrantedDays?: number; payments?: unknown[] }): number {
  const legacy = Number(account.trialDurationDays || 0) + Number(account.customGrantedDays || 0);
  const first = Date.parse(account.firstLoginDate), paidEnd = recurringPaidThrough(account);
  return Number.isFinite(first) && Number.isFinite(paidEnd) ? Math.max(legacy, (paidEnd - first) / 86400000) : legacy;
}
