const GOLD_KEY         = "rpg_gold";
const LAST_LOGIN_KEY   = "rpg_last_login";
const LAST_COMPLETED_KEY = "rpg_last_completed";

export function getGold(): number {
  return parseInt(localStorage.getItem(GOLD_KEY) ?? "0", 10);
}

export function addGold(amount: number): number {
  const next = getGold() + amount;
  localStorage.setItem(GOLD_KEY, String(next));
  return next;
}

export function spendGold(amount: number): boolean {
  const cur = getGold();
  if (cur < amount) return false;
  localStorage.setItem(GOLD_KEY, String(cur - amount));
  return true;
}

/** ログインボーナス。当日初回のみ50G返す。0なら既に受け取り済み。 */
export function checkLoginBonus(): number {
  const today = new Date().toDateString();
  if (localStorage.getItem(LAST_LOGIN_KEY) === today) return 0;
  localStorage.setItem(LAST_LOGIN_KEY, today);
  addGold(50);
  return 50;
}

/** タスク完了ボーナス。新たに完了したタスク1件につき15G。 */
export function checkTaskBonus(completedCount: number): number {
  const last = parseInt(localStorage.getItem(LAST_COMPLETED_KEY) ?? "0", 10);
  if (completedCount <= last) return 0;
  const diff = completedCount - last;
  localStorage.setItem(LAST_COMPLETED_KEY, String(completedCount));
  const gold = diff * 15;
  addGold(gold);
  return gold;
}
