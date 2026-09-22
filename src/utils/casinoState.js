// Management of PokéCoins balance and casino history via localStorage

const BALANCE_KEY = "pokedex_poke_coins";
const HISTORY_KEY = "pokedex_casino_history";
const STATS_KEY = "pokedex_casino_stats";
const LAST_CLAIM_KEY = "pokedex_last_claim";
const GOD_MODE_KEY = "pokedex_god_mode";

const INITIAL_BALANCE = 1000;

export function getBalance() {
  if (isGodModeActive()) {
    return 9999999;
  }
  const stored = localStorage.getItem(BALANCE_KEY);
  if (stored === null) {
    localStorage.setItem(BALANCE_KEY, INITIAL_BALANCE.toString());
    return INITIAL_BALANCE;
  }
  return parseInt(stored, 10) || 0;
}

export function updateBalance(amount) {
  if (isGodModeActive()) {
    window.dispatchEvent(new CustomEvent("balance-changed", { detail: 9999999 }));
    return 9999999;
  }
  const current = getBalance();
  const next = Math.max(0, current + amount);
  localStorage.setItem(BALANCE_KEY, next.toString());
  window.dispatchEvent(new CustomEvent("balance-changed", { detail: next }));
  return next;
}

export function setExactBalance(amount) {
  const valid = Math.max(0, parseInt(amount, 10) || 0);
  localStorage.setItem(BALANCE_KEY, valid.toString());
  window.dispatchEvent(new CustomEvent("balance-changed", { detail: valid }));
  return valid;
}

export function isGodModeActive() {
  return localStorage.getItem(GOD_MODE_KEY) === "true";
}

export function toggleGodMode() {
  const current = isGodModeActive();
  const next = !current;
  localStorage.setItem(GOD_MODE_KEY, next ? "true" : "false");

  if (next) {
    window.dispatchEvent(new CustomEvent("balance-changed", { detail: 9999999 }));
  } else {
    window.dispatchEvent(new CustomEvent("balance-changed", { detail: getBalance() }));
  }
  return next;
}

export function resetBalance() {
  localStorage.setItem(BALANCE_KEY, INITIAL_BALANCE.toString());
  window.dispatchEvent(new CustomEvent("balance-changed", { detail: INITIAL_BALANCE }));
  return INITIAL_BALANCE;
}

export function claimDailyBonus() {
  const lastClaim = localStorage.getItem(LAST_CLAIM_KEY);
  const now = Date.now();
  const COOLDOWN = 12 * 60 * 60 * 1000; // 12 hours bonus reset

  if (lastClaim && now - parseInt(lastClaim, 10) < COOLDOWN) {
    const remainingMs = COOLDOWN - (now - parseInt(lastClaim, 10));
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const mins = Math.ceil((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    return { success: false, message: `Bonus klaim lagi dalam ${hours}j ${mins}m!` };
  }

  const bonusAmount = 500;
  updateBalance(bonusAmount);
  localStorage.setItem(LAST_CLAIM_KEY, now.toString());
  addHistoryRecord({
    type: "BONUS",
    title: "Daily Bonus PokéCoins",
    amount: bonusAmount,
    isWin: true,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  return { success: true, amount: bonusAmount, message: `Sukses klaim ${bonusAmount} PokéCoins!` };
}

export function getHistory() {
  const stored = localStorage.getItem(HISTORY_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function addHistoryRecord(record) {
  const history = getHistory();
  const updated = [record, ...history].slice(0, 30);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));

  const stats = getStats();
  if (record.amount > 0 && record.isWin) {
    stats.wins += 1;
    stats.totalWon += record.amount;
  } else if (!record.isWin && record.type !== "BONUS") {
    stats.losses += 1;
    stats.totalLost += Math.abs(record.amount);
  }
  stats.totalGames += 1;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function getStats() {
  const stored = localStorage.getItem(STATS_KEY);
  if (!stored) {
    return { wins: 0, losses: 0, totalWon: 0, totalLost: 0, totalGames: 0 };
  }
  try {
    return JSON.parse(stored);
  } catch {
    return { wins: 0, losses: 0, totalWon: 0, totalLost: 0, totalGames: 0 };
  }
}

export function clearHistoryAndStats() {
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(STATS_KEY);
  window.dispatchEvent(new CustomEvent("balance-changed", { detail: getBalance() }));
  return true;
}
