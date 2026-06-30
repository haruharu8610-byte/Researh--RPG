const DEFEATED_KEY = "rpg_defeated_enemies";

export function getDefeatedEnemyIds(): string[] {
  if (typeof localStorage === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(DEFEATED_KEY) ?? "[]"); } catch { return []; }
}

export function recordDefeatedEnemy(id: string): void {
  const ids = getDefeatedEnemyIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(DEFEATED_KEY, JSON.stringify(ids));
  }
}
