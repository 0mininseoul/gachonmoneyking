// src/lib/leaderboardDisplay.js
export const MASKED_BALANCE = '●●●,●●●,●●● KRW';

// Reveal rule: a verified viewer sees everything; otherwise only the GLOBAL
// (overall) top-N rows are revealed. overallRank MUST be the rank within the
// full balance-desc list, never a per-tab rank.
export function shouldRevealBalance({ canViewBalances = false, overallRank = null, revealTopN = 0 } = {}) {
  if (canViewBalances) return true;
  if (!revealTopN || !overallRank) return false;
  return overallRank <= revealTopN;
}

export function formatBalanceLabel(balance, reveal) {
  return reveal ? `${Number(balance).toLocaleString()} KRW` : MASKED_BALANCE;
}
