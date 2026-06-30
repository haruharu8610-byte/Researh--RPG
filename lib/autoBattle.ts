import {
  getFloorEnemyGroup, calcPlayerStats, calcPhysicalDamage, tryHit, tryCritical, CRIT_MULTIPLIER,
  type PlayerStats, type ActiveEnemy, type JobClass,
} from "@/lib/battle";
import {
  getEquippedWeapon, getEquippedArmor, getEquipmentEffect, getSeriesSetBonus, findItemById,
} from "@/lib/equipment";
import { getParty } from "@/lib/party";
import { addGold } from "@/lib/gold";
import { addMaterial, MATERIALS, type Material } from "@/lib/materials";
import { recordDefeatedEnemy, getDefeatedEnemyIds } from "@/lib/bestiary";

export const AUTO_BATTLE_FIGHTS = 10;
const GOLD_MULT = 0.5;   // 素材ダンジョンのゴールド倍率
const DROP_MULT = 2.5;   // 素材ダンジョンのドロップ率倍率
const MAX_ROUNDS = 30;

type Combatant = { id: string; name: string; hp: number; maxHp: number; attack: number; defense: number; speed: number };

type FightOutcome = { won: boolean; defeatedEnemyIds: string[]; goldEarned: number; materialsGained: Array<{ material: Material; qty: number }> };

export type AutoBattleSummary = {
  fightsCompleted: number;
  victories: number;
  stoppedByDefeat: boolean;
  totalGold: number;
  materialsGained: Array<{ material: Material; qty: number }>;
  defeatedEnemyNames: string[];
};

/** プレイヤー・パーティのステータスを構築（呼び出し元からレベルを渡す） */
export function buildAutoBattlePlayer(level: number): { stats: PlayerStats; jobClass: JobClass; party: Combatant[] } {
  const JOB_KEY = "rpg_job_class";
  const jobClass = ((typeof localStorage !== "undefined" ? localStorage.getItem(JOB_KEY) : null) ?? "warrior") as JobClass;
  const weapon = getEquippedWeapon();
  const armor = getEquippedArmor();
  const craftEffect = getEquipmentEffect(weapon, armor);
  const setBonus = getSeriesSetBonus(weapon, armor);
  const stats = calcPlayerStats(
    level, jobClass,
    (weapon?.attackBonus ?? 0) + (setBonus?.attack ?? 0), (weapon?.magicBonus ?? 0) + (setBonus?.magic ?? 0),
    (armor?.defenseBonus ?? 0) + (setBonus?.defense ?? 0), armor?.magicBonus ?? 0,
    armor?.statusResist ?? 0, craftEffect,
  );

  const memberLevel = Math.max(1, level - 1);
  const party: Combatant[] = getParty().map(m => {
    const mWeapon = findItemById(m.weaponId);
    const mArmor = findItemById(m.armorId);
    const mSetBonus = getSeriesSetBonus(mWeapon, mArmor);
    const ms = calcPlayerStats(
      memberLevel, m.jobClass,
      (mWeapon?.attackBonus ?? 0) + (mSetBonus?.attack ?? 0), (mWeapon?.magicBonus ?? 0) + (mSetBonus?.magic ?? 0),
      (mArmor?.defenseBonus ?? 0) + (mSetBonus?.defense ?? 0), mArmor?.magicBonus ?? 0, mArmor?.statusResist ?? 0,
    );
    return { id: m.id, name: m.name, hp: ms.maxHp, maxHp: ms.maxHp, attack: ms.attack, defense: ms.defense, speed: ms.speed };
  });

  return { stats, jobClass, party };
}

function simulateFight(allies: Combatant[], enemies: ActiveEnemy[]): { allies: Combatant[]; won: boolean } {
  const enemyHp = new Map(enemies.map(e => [e.uid, e.hp]));
  let round = 0;
  while (round < MAX_ROUNDS) {
    round++;
    const turnOrder = [
      ...allies.filter(a => a.hp > 0).map(a => ({ kind: "ally" as const, id: a.id, speed: a.speed })),
      ...enemies.filter(e => (enemyHp.get(e.uid) ?? 0) > 0).map(e => ({ kind: "enemy" as const, id: e.uid, speed: e.speed })),
    ].sort((a, b) => b.speed - a.speed);

    for (const actor of turnOrder) {
      if (!allies.some(a => a.hp > 0) || !enemies.some(e => (enemyHp.get(e.uid) ?? 0) > 0)) break;
      if (actor.kind === "ally") {
        const a = allies.find(x => x.id === actor.id)!;
        if (a.hp <= 0) continue;
        const target = enemies.find(e => (enemyHp.get(e.uid) ?? 0) > 0);
        if (!target) continue;
        if (!tryHit()) continue;
        const crit = tryCritical();
        const dmg = Math.round(calcPhysicalDamage(a.attack, target.defense, target.physResist) * (crit ? CRIT_MULTIPLIER : 1));
        enemyHp.set(target.uid, Math.max(0, (enemyHp.get(target.uid) ?? 0) - dmg));
      } else {
        const e = enemies.find(x => x.uid === actor.id)!;
        if ((enemyHp.get(e.uid) ?? 0) <= 0) continue;
        const alive = allies.filter(a => a.hp > 0);
        if (!alive.length) continue;
        const target = alive[Math.floor(Math.random() * alive.length)];
        if (!tryHit()) continue;
        const dmg = calcPhysicalDamage(e.floorAtk, target.defense);
        target.hp = Math.max(0, target.hp - dmg);
      }
    }

    if (!allies.some(a => a.hp > 0)) return { allies, won: false };
    if (!enemies.some(e => (enemyHp.get(e.uid) ?? 0) > 0)) return { allies, won: true };
  }
  // ラウンド上限到達時はHPが多く残っている側の勝ちとみなす
  const allyHpSum = allies.reduce((s, a) => s + a.hp, 0);
  const enemyHpSum = [...enemyHp.values()].reduce((s, h) => s + h, 0);
  return { allies, won: allyHpSum >= enemyHpSum };
}

/** 素材ダンジョンの連戦オート機能：ランダム出現のみ・コマンド操作なしで AUTO_BATTLE_FIGHTS 回戦う */
export function runAutoBattle(level: number): AutoBattleSummary {
  const { stats, party: initialParty } = buildAutoBattlePlayer(level);
  let allies: Combatant[] = [
    { id: "player", name: "あなた", hp: stats.maxHp, maxHp: stats.maxHp, attack: stats.attack, defense: stats.defense, speed: stats.speed },
    ...initialParty,
  ];

  let fightsCompleted = 0;
  let victories = 0;
  let stoppedByDefeat = false;
  let totalGold = 0;
  const materialTotals = new Map<string, number>();
  const defeatedEnemyNames: string[] = [];

  for (let i = 0; i < AUTO_BATTLE_FIGHTS; i++) {
    const excludeIds = getDefeatedEnemyIds();
    const enemies = getFloorEnemyGroup(level, 1, { excludeIds });
    if (!enemies.length) break;

    const result = simulateFight(allies, enemies);
    allies = result.allies;
    fightsCompleted++;

    if (!result.won) { stoppedByDefeat = true; break; }

    victories++;
    const totalEnemyGold = enemies.reduce((s, e) => s + e.goldReward, 0);
    const gold = Math.round(totalEnemyGold * GOLD_MULT);
    totalGold += gold;
    addGold(gold);

    for (const e of enemies) {
      recordDefeatedEnemy(e.id);
      defeatedEnemyNames.push(e.name);
      for (const drop of e.dropTable) {
        if (Math.random() < Math.min(0.95, drop.chance * DROP_MULT)) {
          addMaterial(drop.materialId, 1);
          materialTotals.set(drop.materialId, (materialTotals.get(drop.materialId) ?? 0) + 1);
        }
      }
    }

    // 次の戦闘へ：戦闘不能になった仲間以外は持ち越し（全回復はしない）
    if (i < AUTO_BATTLE_FIGHTS - 1 && !allies.some(a => a.hp > 0)) { stoppedByDefeat = true; break; }
  }

  const materialsGained = [...materialTotals.entries()]
    .map(([id, qty]) => ({ material: MATERIALS.find(m => m.id === id)!, qty }))
    .filter(x => !!x.material);

  return { fightsCompleted, victories, stoppedByDefeat, totalGold, materialsGained, defeatedEnemyNames };
}
