"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import EnemySprite from "@/components/EnemySprite";
import {
  getFloor, advanceFloor, getFloorEnemyGroup,
  calcPlayerStats, calcPhysicalDamage, calcMagicDamage, calcEnemySpellDamage,
  calcPoisonDamage, getAvailableSpells, tryHit, getEffectiveness, tryCritical, CRIT_MULTIPLIER,
  getAvailableSkills, calcSkillDamage,
  ELEMENT_LABEL, SPELLS, STATUS_LABEL, tryApplyStatus,
  type ActiveEnemy, type PlayerStats, type JobClass, type Spell, type Skill, type Element,
  type ActiveStatus,
} from "@/lib/battle";
import {
  getEquippedWeapon, getEquippedArmor, getInventory, removeInventory, addInventory,
  getEquipmentEffect, registerCraftedItems, SHOP_ITEMS, findItemById, getSeriesSetBonus, type ShopItem,
} from "@/lib/equipment";
import { addGold } from "@/lib/gold";
import { getParty, type PartyMemberData } from "@/lib/party";
import { MATERIALS, addMaterial } from "@/lib/materials";
import { RARITY_COLOR, RARITY_LABEL, DEFAULT_CRAFT_EFFECT } from "@/lib/rarity";
import { syncPlayerState } from "@/lib/playerState";
import { recordDefeatedEnemy, getDefeatedEnemyIds } from "@/lib/bestiary";

const CRAFTED_KEY = "rpg_crafted_list";
function getCraftedIds(): string[] {
  if (typeof localStorage === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(CRAFTED_KEY) ?? "[]"); } catch { return []; }
}

const JOB_KEY     = "rpg_job_class";
const VICTORY_KEY = "rpg_victories";

type Phase = "intro" | "select" | "ally_targeting" | "spells" | "skills" | "items" | "targeting" | "message" | "victory" | "defeat" | "ran";
type PendingAction = { type: "attack" } | { type: "spell"; spell: Spell } | { type: "skill"; skill: Skill } | { type: "item"; item: ShopItem } | { type: "ultimate" };
type SelectCmd = "attack" | "skill" | "magic" | "item" | "run" | "ultimate";

export type PartyMemberBattle = {
  id: string; name: string; jobClass: JobClass;
  hp: number; maxHp: number;
  mp: number; maxMp: number;
  attack: number; defense: number; magic: number;
  speed: number; statusResist: number;
  status: ActiveStatus | null;
  weaponId?: string | null;
};

type TurnActor =
  | { kind: "player"; id: "player"; speed: number }
  | { kind: "party";  id: string;   speed: number }
  | { kind: "enemy";  id: string;   speed: number }; // id = uid

type SpeedBuff = { turnsLeft: number; factor: number };

const JOB: Record<string, string> = { warrior:"戦士", mage:"魔法使い", cleric:"僧侶", rogue:"盗賊" };

// ── 回復量計算 ─────────────────────────────────────────────
function calcHealAmount(magic: number, spellId: string): number {
  if (spellId === "keal")    return 30 + Math.floor(magic * 0.3);
  if (spellId === "kealla")  return 80 + Math.floor(magic * 0.5);
  if (spellId === "behomi")  return 40 + Math.floor(magic * 0.2); // all allies, smaller per person
  return 30;
}

// ── UI Components ─────────────────────────────────────────
function HpBar({ current, max, blocks = 16 }: { current: number; max: number; blocks?: number }) {
  const filled = Math.max(0, Math.round((current / max) * blocks));
  const pct = current / max;
  const color = pct < 0.3 ? "bg-red-500" : pct < 0.6 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-px">
        {Array.from({ length: blocks }).map((_, i) => (
          <div key={i} className={`h-3 w-2.5 border border-gray-600 ${i < filled ? color : "bg-gray-800"}`} />
        ))}
      </div>
      <span className="text-xs tabular-nums text-gray-300 w-14 text-right">{current}/{max}</span>
    </div>
  );
}

function MpBar({ current, max, blocks = 10 }: { current: number; max: number; blocks?: number }) {
  const filled = Math.max(0, Math.round((current / max) * blocks));
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-px">
        {Array.from({ length: blocks }).map((_, i) => (
          <div key={i} className={`h-3 w-2.5 border border-gray-600 ${i < filled ? "bg-blue-500" : "bg-gray-800"}`} />
        ))}
      </div>
      <span className="text-xs tabular-nums text-gray-300 w-10 text-right">{current}/{max}</span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
export default function BattlePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-gray-400 font-mono">よみこみちゅう...</div>}>
      <BattlePageModeKeyed />
    </Suspense>
  );
}

// mode（通常/素材/ゴールド）が変わったら強制的に再マウントし、
// 直前のダンジョンの状態が残ってしまわないようにする
function BattlePageModeKeyed() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "normal";
  return <BattlePageInner key={mode} />;
}

function BattlePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const isMaterialMode = modeParam === "material";
  const isGoldMode     = modeParam === "gold";
  const floorKey   = isMaterialMode ? "rpg_material_floor" : isGoldMode ? "rpg_gold_floor" : "rpg_floor";
  const victoryKey = isMaterialMode ? "rpg_material_victories" : isGoldMode ? "rpg_gold_victories" : VICTORY_KEY;
  const dungeonLabel = isMaterialMode ? "🪨 素材ダンジョン" : isGoldMode ? "💰 ゴールドダンジョン" : "🗺️";
  const isFlatDungeon = isMaterialMode || isGoldMode; // 階層なし（常に固定難易度）
  const forcedEnemyId = isMaterialMode ? (searchParams.get("enemy") ?? undefined) : undefined;

  // ── Display state ──────────────────────────────────────
  const [player, setPlayer]             = useState<PlayerStats | null>(null);
  const [playerHp, setPlayerHp]         = useState(0);
  const [playerMp, setPlayerMp]         = useState(0);
  const [playerStatus, setPlayerStatus] = useState<ActiveStatus | null>(null);
  const [partyMembers, setPartyMembers] = useState<PartyMemberBattle[]>([]);
  const [enemies, setEnemies]           = useState<ActiveEnemy[]>([]);
  const [enemyStatuses, setEnemyStatuses] = useState<Map<string, ActiveStatus>>(new Map());
  const [speedBuffedIds, setSpeedBuffedIds] = useState<Set<string>>(new Set());
  const [atkBuffedIds, setAtkBuffedIds] = useState<Set<string>>(new Set());
  const [defBuffedIds, setDefBuffedIds] = useState<Set<string>>(new Set());
  const [turnOrder, setTurnOrder]       = useState<TurnActor[]>([]);
  const [currentActorId, setCurrentActorId] = useState<string>("player");
  const [targetIdx, setTargetIdx]       = useState(0);
  const [allyTargetIdx, setAllyTargetIdx] = useState(0);
  const [allyTargetBack, setAllyTargetBack] = useState<"spells" | "items">("spells");
  const [itemIdx, setItemIdx] = useState(0);
  const [phase, setPhase]               = useState<Phase>("intro");
  const [selectCmd, setSelectCmd]       = useState<SelectCmd>("attack");
  const [messages, setMessages]         = useState<string[]>([]);
  const [displayed, setDisplayed]       = useState("");
  const [damagedUids, setDamagedUids]   = useState<Set<string>>(new Set());
  const [playerDamaged, setPlayerDamaged] = useState(false);
  const [damagedPartyIds, setDamagedPartyIds] = useState<Set<string>>(new Set());
  const [victories, setVictories]       = useState(0);
  const [spells, setSpells]             = useState<Spell[]>([]);
  const [spellIdx, setSpellIdx]         = useState(0);
  const [skillIdx, setSkillIdx]         = useState(0);
  const [floor, setFloor]               = useState(1);
  const [isBossFloor, setIsBossFloor]   = useState(false);
  const [isRareFloor, setIsRareFloor]   = useState(false);
  // null = プレイヤー自身のターン、それ以外は該当する仲間のターン
  const [actingMemberId, setActingMemberId] = useState<string | null>(null);
  const [memberSpells, setMemberSpells] = useState<Spell[]>([]);
  const activeSpells = actingMemberId ? memberSpells : spells;

  // ── Refs (logic) ───────────────────────────────────────
  const playerRef          = useRef<PlayerStats | null>(null);
  const playerHpRef        = useRef(0);
  const playerMpRef        = useRef(0);
  const playerStatusRef    = useRef<ActiveStatus | null>(null);
  const partyRef           = useRef<PartyMemberBattle[]>([]);
  const enemiesRef         = useRef<ActiveEnemy[]>([]);
  const enemyStatusesRef   = useRef<Map<string, ActiveStatus>>(new Map());
  const speedBuffsRef      = useRef<Map<string, SpeedBuff>>(new Map());
  const atkBuffsRef        = useRef<Map<string, SpeedBuff>>(new Map());
  const defBuffsRef        = useRef<Map<string, SpeedBuff>>(new Map());
  const turnOrderRef       = useRef<TurnActor[]>([]);
  const actorIdxRef        = useRef(0);
  const pendingPhase       = useRef<Phase | null>(null);
  const pendingCallback    = useRef<(() => void) | null>(null);
  const pendingAction      = useRef<PendingAction | null>(null);
  const victoriesRef       = useRef(0);
  const usedUltimatesRef   = useRef<Set<string>>(new Set());

  // playerRef宣言後に置くこと（getMemberLevelがplayerRef.currentを参照するため）
  const activeSkills = getAvailableSkills(actingMemberId ? getMemberLevel() : (player?.level ?? 1));

  // ── Typewriter ─────────────────────────────────────────
  useEffect(() => {
    if (!messages.length || displayed === messages[0]) return;
    const t = setTimeout(() => setDisplayed(messages[0].slice(0, displayed.length + 1)), 38);
    return () => clearTimeout(t);
  }, [messages, displayed]);

  // ── Message helpers ────────────────────────────────────
  const pushMessages = useCallback((msgs: string[], next?: Phase) => {
    pendingPhase.current    = next ?? null;
    pendingCallback.current = null;
    setMessages(msgs); setDisplayed(""); setPhase("message");
  }, []);

  const pushCb = useCallback((msgs: string[], cb: () => void) => {
    pendingPhase.current    = null;
    pendingCallback.current = cb;
    if (msgs.length) { setMessages(msgs); setDisplayed(""); setPhase("message"); }
    else cb();
  }, []);

  function advance() {
    if (displayed !== messages[0]) { setDisplayed(messages[0]); return; }
    if (messages.length > 1) {
      const [, ...rest] = messages; setMessages(rest); setDisplayed("");
    } else {
      const next = pendingPhase.current;
      const cb   = pendingCallback.current;
      pendingCallback.current = null;
      setMessages([]); setDisplayed("");
      if (cb) cb();
      else if (next) setPhase(next);
    }
  }

  // ── Flash helpers ──────────────────────────────────────
  function flashEnemy(uid: string) {
    setDamagedUids(s => new Set([...s, uid]));
    setTimeout(() => setDamagedUids(s => { const n = new Set(s); n.delete(uid); return n; }), 400);
  }
  function flashPlayer() { setPlayerDamaged(true); setTimeout(() => setPlayerDamaged(false), 400); }
  function flashParty(id: string) {
    setDamagedPartyIds(s => new Set([...s, id]));
    setTimeout(() => setDamagedPartyIds(s => { const n = new Set(s); n.delete(id); return n; }), 400);
  }

  // ── Speed helpers ──────────────────────────────────────
  function effectiveSpeed(id: string, base: number): number {
    const buff = speedBuffsRef.current.get(id);
    return buff ? Math.round(base * buff.factor) : base;
  }
  function effectiveAttack(id: string, base: number): number {
    const buff = atkBuffsRef.current.get(id);
    return buff ? Math.round(base * buff.factor) : base;
  }
  function effectiveDefense(id: string, base: number): number {
    const buff = defBuffsRef.current.get(id);
    return buff ? Math.round(base * buff.factor) : base;
  }

  // ── Enemy status helpers ───────────────────────────────
  function setEnemyStatus(uid: string, status: ActiveStatus | null) {
    setEnemyStatuses(prev => { const n = new Map(prev); if (status === null) n.delete(uid); else n.set(uid, status); return n; });
    const m = new Map(enemyStatusesRef.current);
    if (status === null) m.delete(uid); else m.set(uid, status);
    enemyStatusesRef.current = m;
  }

  // ── Party helper ────────────────────────────────────────
  function syncPartyState() { setPartyMembers([...partyRef.current]); }

  // ── Victory check ──────────────────────────────────────
  function checkVictory(updatedEnemies: ActiveEnemy[]): boolean {
    if (!updatedEnemies.every(e => e.hp <= 0)) return false;
    for (const e of updatedEnemies) recordDefeatedEnemy(e.id);
    const nextFloor = isFlatDungeon ? 1 : advanceFloor(floorKey);
    const goldMult = isMaterialMode ? 0.5 : isGoldMode ? 3 : 1;
    const totalGold = Math.round(updatedEnemies.reduce((s, e) => s + e.goldReward, 0) * goldMult);
    addGold(totalGold);
    addInventory("potion", 1);
    const newVic = victoriesRef.current + 1;
    victoriesRef.current = newVic;
    setVictories(newVic);
    localStorage.setItem(victoryKey, String(newVic));
    setFloor(nextFloor);
    if (playerRef.current && !isMaterialMode && !isGoldMode) {
      syncPlayerState({
        level: playerRef.current.level, jobClass: playerRef.current.jobClass,
        weaponId: getEquippedWeapon()?.id ?? null, armorId: getEquippedArmor()?.id ?? null,
        floor: nextFloor,
      });
    }

    // ドロップ処理（素材ダンジョンはドロップ率2.5倍）
    const dropMult = isMaterialMode ? 2.5 : 1;
    const dropMsgs: string[] = [];
    for (const e of updatedEnemies) {
      for (const drop of e.dropTable) {
        if (Math.random() < Math.min(0.95, drop.chance * dropMult)) {
          addMaterial(drop.materialId, 1);
          const mat = MATERIALS.find(m => m.id === drop.materialId);
          if (mat) dropMsgs.push(`✨ ${e.name}が[${RARITY_LABEL[mat.rarity]}]${mat.name}を落とした！`);
        }
      }
    }

    pushMessages([
      `てきをたおした！`,
      `${totalGold}Gてにいれた！`,
      ...dropMsgs,
      `ポーション1個もらった！`,
      ...(isFlatDungeon ? [] : [`${nextFloor}階へ進む…`]),
    ], "victory");
    return true;
  }

  // ── Build turn order ───────────────────────────────────
  function buildTurnOrder(): TurnActor[] {
    const actors: TurnActor[] = [];
    const p = playerRef.current;
    if (p && playerHpRef.current > 0)
      actors.push({ kind: "player", id: "player", speed: effectiveSpeed("player", p.speed) });
    for (const m of partyRef.current)
      if (m.hp > 0)
        actors.push({ kind: "party", id: m.id, speed: effectiveSpeed(m.id, m.speed) });
    for (const e of enemiesRef.current)
      if (e.hp > 0)
        actors.push({ kind: "enemy", id: e.uid, speed: e.speed });
    return actors.sort((a, b) => b.speed - a.speed);
  }

  // ── Status processing helpers ──────────────────────────
  function decrementStatus(status: ActiveStatus): ActiveStatus | null {
    const t = status.turnsLeft - 1;
    return t <= 0 ? null : { ...status, turnsLeft: t };
  }

  // ── Process status at turn start, returns { skip, msgs } ─
  function processActorStatusStart(
    status: ActiveStatus | null,
    maxHp: number,
    actorName: string,
    isPlayer: boolean,
  ): { skip: boolean; msgs: string[]; newStatus: ActiveStatus | null; dead: boolean } {
    if (!status) return { skip: false, msgs: [], newStatus: null, dead: false };
    const msgs: string[] = [];
    let skip = false;

    if (status.type === "poison") {
      const dmg = calcPoisonDamage(maxHp);
      msgs.push(`☠️ ${actorName}は毒で${dmg}ダメージを受けた！`);
      if (isPlayer) {
        const newHp = Math.max(0, playerHpRef.current - dmg);
        setPlayerHp(newHp); playerHpRef.current = newHp;
        flashPlayer();
        if (newHp <= 0) {
          const newSt = decrementStatus(status);
          setPlayerStatus(newSt); playerStatusRef.current = newSt;
          return { skip: true, msgs, newStatus: newSt, dead: true };
        }
      }
    }
    if (status.type === "sleep") {
      msgs.push(`💤 ${actorName}は眠っている…`); skip = true;
    } else if (status.type === "paralysis" && Math.random() < 0.40) {
      msgs.push(`⚡ ${actorName}はしびれて動けない！`); skip = true;
    }

    const newSt = decrementStatus(status);
    if (!newSt && status.type !== "sleep") msgs.push(`${actorName}の${STATUS_LABEL[status.type]}が解けた！`);
    return { skip, msgs, newStatus: newSt, dead: false };
  }

  // ── advanceActor ────────────────────────────────────────
  // Forward declaration pattern – defined after processCurrentActor
  const advanceActorRef = useRef<() => void>(() => {});

  // ── Process current actor ──────────────────────────────
  const processCurrentActor = useCallback(() => {
    const order = turnOrderRef.current;
    const idx   = actorIdxRef.current;
    if (idx >= order.length) {
      // Round complete → new round
      // Decrement speed/attack/defense buffs
      function decrementBuffs(ref: typeof speedBuffsRef): Map<string, SpeedBuff> {
        const next = new Map(ref.current);
        for (const [id, buff] of next) {
          const t = buff.turnsLeft - 1;
          if (t <= 0) next.delete(id);
          else next.set(id, { ...buff, turnsLeft: t });
        }
        return next;
      }
      const newBuffs = decrementBuffs(speedBuffsRef);
      speedBuffsRef.current = newBuffs;
      setSpeedBuffedIds(new Set(newBuffs.keys()));
      const newAtkBuffs = decrementBuffs(atkBuffsRef);
      atkBuffsRef.current = newAtkBuffs;
      setAtkBuffedIds(new Set(newAtkBuffs.keys()));
      const newDefBuffs = decrementBuffs(defBuffsRef);
      defBuffsRef.current = newDefBuffs;
      setDefBuffedIds(new Set(newDefBuffs.keys()));

      const newOrder = buildTurnOrder();
      turnOrderRef.current = newOrder;
      setTurnOrder(newOrder);
      actorIdxRef.current = 0;
      if (newOrder.length === 0) return;
      setCurrentActorId(newOrder[0].id);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      setTimeout(() => processCurrentActor(), 0);
      return;
    }
    const actor = order[idx];
    setCurrentActorId(actor.id);

    try {
      if (actor.kind === "player") {
        handlePlayerTurn();
      } else if (actor.kind === "party") {
        handlePartyTurn(actor.id);
      } else {
        handleEnemyTurn(actor.id);
      }
    } catch (err) {
      console.error("battle turn error", err);
      pendingAction.current = null;
      setPhase("select");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  advanceActorRef.current = () => {
    actorIdxRef.current += 1;
    processCurrentActor();
  };

  function advanceActor() { advanceActorRef.current(); }

  // ── Player turn ────────────────────────────────────────
  function handlePlayerTurn() {
    setActingMemberId(null);
    if (playerHpRef.current <= 0) { advanceActor(); return; }
    const p = playerRef.current!;
    const status = playerStatusRef.current;
    const { skip, msgs, newStatus, dead } = processActorStatusStart(
      status, p.maxHp, "あなた", true
    );
    setPlayerStatus(newStatus); playerStatusRef.current = newStatus;

    if (dead) {
      // Check if all allies also dead
      const anyAlive = partyRef.current.some(m => m.hp > 0);
      if (anyAlive) {
        pushCb([...msgs, "あなたはやられてしまった…", "仲間が戦いを続ける…"], advanceActor);
      } else {
        pushMessages([...msgs, "やられてしまった…"], "defeat");
      }
      return;
    }
    if (skip) {
      pushCb(msgs, advanceActor);
    } else if (msgs.length) {
      pushCb(msgs, () => setPhase("select"));
    } else {
      setPhase("select");
    }
  }

  // ── Party member turn（プレイヤーが操作） ───────────────
  function handlePartyTurn(memberId: string) {
    setActingMemberId(memberId);
    const member = partyRef.current.find(m => m.id === memberId);
    if (!member || member.hp <= 0) { advanceActor(); return; }

    const { skip, msgs: statusMsgs, newStatus, dead } = processActorStatusStart(
      member.status, member.maxHp, member.name, false
    );
    // Update party member status
    const upd = partyRef.current.map(m => m.id === memberId ? { ...m, status: newStatus } : m);
    partyRef.current = upd;
    syncPartyState();

    if (dead) {
      // Party member poisoned to death
      const allPartyDead = partyRef.current.every(m => m.hp <= 0);
      if (allPartyDead && playerHpRef.current <= 0) {
        pushMessages([...statusMsgs, `${member.name}はたおれた…`], "defeat");
      } else {
        pushCb([...statusMsgs, `${member.name}はたおれた…`], advanceActor);
      }
      return;
    }
    if (skip) { pushCb(statusMsgs, advanceActor); return; }

    const aliveEnemies = enemiesRef.current.filter(e => e.hp > 0);
    if (!aliveEnemies.length) { advanceActor(); return; }

    // コマンド選択を仲間用に開く（プレイヤーと同じUIを使い回す）
    setMemberSpells(getAvailableSpells(getMemberLevel(), member.jobClass));
    setSelectCmd("attack");
    if (statusMsgs.length) {
      pushCb(statusMsgs, () => setPhase("select"));
    } else {
      setPhase("select");
    }
  }

  // ── Enemy individual turn ──────────────────────────────
  function handleEnemyTurn(uid: string) {
    const e = enemiesRef.current.find(en => en.uid === uid);
    if (!e || e.hp <= 0) { advanceActor(); return; }

    const msgs: string[] = [];
    // Status check
    const eSt = enemyStatusesRef.current.get(uid);
    if (eSt) {
      if (eSt.type === "poison") {
        const dmg = calcPoisonDamage(e.floorHp);
        flashEnemy(uid);
        const updEnemies = enemiesRef.current.map(en => en.uid === uid ? { ...en, hp: Math.max(0, en.hp - dmg) } : en);
        enemiesRef.current = updEnemies; setEnemies([...updEnemies]);
        msgs.push(`☠️ ${e.name}は毒で${dmg}ダメージを受けた！`);
        if (updEnemies.find(en => en.uid === uid)!.hp <= 0) {
          setEnemyStatus(uid, null);
          if (checkVictory(updEnemies)) return;
          pushCb(msgs, advanceActor);
          return;
        }
      }
      if (eSt.type === "sleep") {
        msgs.push(`💤 ${e.name}は眠っている…`);
        const newSt = decrementStatus(eSt);
        setEnemyStatus(uid, newSt);
        pushCb(msgs, advanceActor);
        return;
      }
      if (eSt.type === "paralysis" && Math.random() < 0.40) {
        msgs.push(`⚡ ${e.name}はしびれて動けない！`);
        const newSt = decrementStatus(eSt);
        setEnemyStatus(uid, newSt);
        pushCb(msgs, advanceActor);
        return;
      }
      const newSt = decrementStatus(eSt);
      setEnemyStatus(uid, newSt);
      if (!newSt) msgs.push(`${e.name}のステータスが解けた！`);
    }

    // Pick target: random alive party member or player
    const aliveAllies: Array<{ id: string; name: string; isPlayer: boolean }> = [];
    if (playerHpRef.current > 0) aliveAllies.push({ id: "player", name: "あなた", isPlayer: true });
    for (const m of partyRef.current)
      if (m.hp > 0) aliveAllies.push({ id: m.id, name: m.name, isPlayer: false });
    if (!aliveAllies.length) { advanceActor(); return; }
    const target = aliveAllies[Math.floor(Math.random() * aliveAllies.length)];

    const p = playerRef.current!;
    const useSpell = e.spellIds.length > 0 && Math.random() < 0.3;
    if (useSpell) {
      const spellId = e.spellIds[Math.floor(Math.random() * e.spellIds.length)];
      const spellDef = SPELLS.find(s => s.id === spellId);
      if (spellDef?.effect) {
        msgs.push(`${e.name}が${spellDef.name}を唱えた！`);
        // プレイヤーへの毒スペルを毒免疫でブロック
        const isPoisonToPlayer = target.isPlayer && spellDef.effect.status === "poison" && p.craftEffect.poisonImmune;
        if (isPoisonToPlayer) {
          msgs.push("毒無効！");
        } else {
          const targetResist = target.isPlayer ? p.statusResist
            : (partyRef.current.find(m => m.id === target.id)?.statusResist ?? 0.5);
          const curPSt = target.isPlayer ? playerStatusRef.current
            : partyRef.current.find(m => m.id === target.id)?.status ?? null;
          if (curPSt) {
            msgs.push("しかし効果はなかった！");
          } else if (tryApplyStatus(spellDef.effect.baseChance, targetResist)) {
            const newSt: ActiveStatus = { type: spellDef.effect.status, turnsLeft: spellDef.effect.turns };
            if (target.isPlayer) { setPlayerStatus(newSt); playerStatusRef.current = newSt; }
            else {
              const upd = partyRef.current.map(m => m.id === target.id ? { ...m, status: newSt } : m);
              partyRef.current = upd; syncPartyState();
            }
            msgs.push(`${target.name}が${STATUS_LABEL[spellDef.effect.status]}になった！`);
          } else {
            msgs.push(`${STATUS_LABEL[spellDef.effect.status]}は効かなかった！`);
          }
        }
      } else if (spellDef) {
        const dmg = calcEnemySpellDamage(e.magic, spellDef);
        msgs.push(`${e.name}が${spellDef.name}を唱えた！`, `${target.name}に${dmg}のダメージ！`);
        if (target.isPlayer) {
          const newHp = Math.max(0, playerHpRef.current - dmg);
          setPlayerHp(newHp); playerHpRef.current = newHp;
          flashPlayer();
          if (newHp <= 0 && partyRef.current.every(m => m.hp <= 0)) {
            pushMessages([...msgs, "やられてしまった…"], "defeat"); return;
          }
        } else {
          const upd = partyRef.current.map(m => m.id === target.id ? { ...m, hp: Math.max(0, m.hp - dmg) } : m);
          partyRef.current = upd; syncPartyState();
          flashParty(target.id);
          if (playerHpRef.current <= 0 && upd.every(m => m.hp <= 0)) {
            pushMessages([...msgs, "やられてしまった…"], "defeat"); return;
          }
        }
      }
    } else {
      // Physical
      const eConfused = enemyStatusesRef.current.get(uid)?.type === "confuse";
      if (!tryHit(eConfused)) {
        msgs.push(`${e.name}のこうげき！　ミス！`);
        pushCb(msgs, advanceActor); return;
      }
      const baseDefVal = target.isPlayer ? p.defense
        : (partyRef.current.find(m => m.id === target.id)?.defense ?? 0);
      const defVal = effectiveDefense(target.id, baseDefVal);
      const dmg = calcPhysicalDamage(e.floorAtk, defVal);
      msgs.push(`${e.name}の${target.name}へのこうげき！　${dmg}のダメージ！`);
      // ダメージ反射（プレイヤーへの物理攻撃時）
      if (target.isPlayer && p.craftEffect.reflectDamage > 0) {
        const reflectDmg = Math.max(1, Math.floor(dmg * p.craftEffect.reflectDamage));
        const updE = enemiesRef.current.map(en => en.uid === uid ? { ...en, hp: Math.max(0, en.hp - reflectDmg) } : en);
        enemiesRef.current = updE; setEnemies([...updE]);
        msgs.push(`🛡️ ${reflectDmg}ダメージを反射した！`);
      }
      if (target.isPlayer) {
        const newHp = Math.max(0, playerHpRef.current - dmg);
        setPlayerHp(newHp); playerHpRef.current = newHp;
        flashPlayer();
        // Wake sleeping player on physical hit
        if (playerStatusRef.current?.type === "sleep") {
          setPlayerStatus(null); playerStatusRef.current = null;
          msgs.push("物理攻撃で目が覚めた！");
        }
        if (newHp <= 0 && partyRef.current.every(m => m.hp <= 0)) {
          pushMessages([...msgs, "やられてしまった…"], "defeat"); return;
        }
      } else {
        const upd = partyRef.current.map(m => {
          if (m.id !== target.id) return m;
          const newHp = Math.max(0, m.hp - dmg);
          // Wake sleeping party member on physical hit
          const st = m.status?.type === "sleep" ? null : m.status;
          if (m.status?.type === "sleep") msgs.push(`${m.name}は目を覚ました！`);
          return { ...m, hp: newHp, status: st };
        });
        partyRef.current = upd; syncPartyState();
        flashParty(target.id);
        if (playerHpRef.current <= 0 && upd.every(m => m.hp <= 0)) {
          pushMessages([...msgs, "やられてしまった…"], "defeat"); return;
        }
      }
    }

    pushCb(msgs, advanceActor);
  }

  // ── Initialization ─────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/"); return; }
      const res = await fetch(process.env.NEXT_PUBLIC_STATS_API_URL!, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const stats = await res.json();
      const pts = (stats.totalPoints ?? 0) + (stats.studyTotalMinutes ?? 0);
      const level  = Math.floor(pts / 100) + 1;
      const job    = (localStorage.getItem(JOB_KEY) ?? "warrior") as JobClass;
      // クラフトアイテムを登録してから装備取得
      const { CRAFT_RECIPES } = await import("@/lib/materials");
      registerCraftedItems(getCraftedIds().map(id => {
        const r = CRAFT_RECIPES.find(r => r.id === id)!;
        return { id: r.id, name: r.name, category: r.category, cost: 0, description: r.description,
          attackBonus: r.attackBonus, defenseBonus: r.defenseBonus, magicBonus: r.magicBonus,
          statusResist: r.statusResist, rarity: r.rarity, specialEffect: r.specialEffect };
      }));
      const weapon = getEquippedWeapon();
      const armor  = getEquippedArmor();
      const craftEffect = getEquipmentEffect(weapon, armor);
      const setBonus = getSeriesSetBonus(weapon, armor);
      const p = calcPlayerStats(level, job,
        (weapon?.attackBonus ?? 0) + (setBonus?.attack ?? 0), (weapon?.magicBonus ?? 0) + (setBonus?.magic ?? 0),
        (armor?.defenseBonus ?? 0) + (setBonus?.defense ?? 0), armor?.magicBonus ?? 0,
        armor?.statusResist ?? 0, craftEffect,
      );

      // Build party from storage
      const partyData = getParty();
      const memberLevel = Math.max(1, level - 1);
      const members: PartyMemberBattle[] = partyData.map(m => {
        const mWeapon = findItemById(m.weaponId);
        const mArmor  = findItemById(m.armorId);
        const mSetBonus = getSeriesSetBonus(mWeapon, mArmor);
        const ms = calcPlayerStats(
          memberLevel, m.jobClass,
          (mWeapon?.attackBonus ?? 0) + (mSetBonus?.attack ?? 0), (mWeapon?.magicBonus ?? 0) + (mSetBonus?.magic ?? 0),
          (mArmor?.defenseBonus ?? 0) + (mSetBonus?.defense ?? 0), mArmor?.magicBonus ?? 0, mArmor?.statusResist ?? 0,
        );
        return {
          id: m.id, name: m.name, jobClass: m.jobClass,
          hp: ms.maxHp, maxHp: ms.maxHp,
          mp: ms.maxMp, maxMp: ms.maxMp,
          attack: ms.attack, defense: ms.defense, magic: ms.magic,
          speed: ms.speed, statusResist: ms.statusResist,
          status: null,
          weaponId: m.weaponId ?? null,
        };
      });

      const currentFloor = isFlatDungeon ? 1 : getFloor(floorKey);
      const boss = !isFlatDungeon && currentFloor % 5 === 0;
      // 素材ダンジョンをランダムで選んだ場合は、まだ倒したことのない敵を優先的に出現させる
      const excludeIds = isMaterialMode && !forcedEnemyId ? getDefeatedEnemyIds() : undefined;
      const grp = getFloorEnemyGroup(level, currentFloor, { goldDungeon: isGoldMode, forcedEnemyId, excludeIds });
      const vic = parseInt(localStorage.getItem(victoryKey) ?? "0", 10);
      const availableSpells = getAvailableSpells(level, job);

      setPlayer(p); playerRef.current = p;
      setPlayerHp(p.maxHp); playerHpRef.current = p.maxHp;
      setPlayerMp(p.maxMp); playerMpRef.current = p.maxMp;
      partyRef.current = members; setPartyMembers(members);
      setEnemies(grp); enemiesRef.current = grp;
      victoriesRef.current = vic; setVictories(vic);
      usedUltimatesRef.current = new Set();
      setSpells(availableSpells);
      setFloor(currentFloor);
      setIsBossFloor(boss);
      setIsRareFloor(grp.length === 1 && !!grp[0].isRare);

      // Build initial turn order
      const order: TurnActor[] = ([
        { kind: "player" as const, id: "player" as const, speed: p.speed },
        ...members.map(m => ({ kind: "party" as const, id: m.id, speed: m.speed })),
        ...grp.map(e => ({ kind: "enemy" as const, id: e.uid, speed: e.speed })),
      ] as TurnActor[]).sort((a, b) => b.speed - a.speed);
      turnOrderRef.current = order; setTurnOrder(order);
      actorIdxRef.current = 0;
      if (order.length) setCurrentActorId(order[0].id);

      const intro = boss
        ? [`⚠️ ${currentFloor}階ボス！`, `${grp[0].name}があらわれた！`]
        : grp.length === 1
          ? [`${grp[0].name}があらわれた！`]
          : [`${grp[0].name}が${grp.length}体あらわれた！`];
      pushMessages(intro, "select");
    }
    init();
  }, [router, pushMessages]);

  // ── Keyboard ────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const key = e.key;
      if (phase === "message") { if (["Enter"," ","z"].includes(key)) advance(); return; }
      if (["victory","defeat","ran"].includes(phase)) { if (["Enter"," "].includes(key)) router.push("/game"); return; }
      if (phase === "select") {
        const baseCmds: SelectCmd[] = actingMemberId ? ["attack","skill","magic","item"] : ["attack","skill","magic","item","run"];
        const CMDS: SelectCmd[] = canUseUltimate() ? [...baseCmds, "ultimate"] : baseCmds;
        const cur = CMDS.indexOf(selectCmd);
        const safeCur = cur === -1 ? 0 : cur;
        if (key === "ArrowUp" || key === "ArrowDown") setSelectCmd(CMDS[(safeCur + 2) % CMDS.length]);
        if (key === "ArrowLeft" || key === "ArrowRight") setSelectCmd(CMDS[safeCur % 2 === 0 ? Math.min(safeCur + 1, CMDS.length - 1) : safeCur - 1]);
        if (["Enter","z"].includes(key)) executeSelect(CMDS.includes(selectCmd) ? selectCmd : "attack");
      }
      if (phase === "spells") {
        if (key === "ArrowUp")   setSpellIdx(i => Math.max(0, i - 1));
        if (key === "ArrowDown") setSpellIdx(i => Math.min(activeSpells.length - 1, i + 1));
        if (["Enter","z"].includes(key)) {
          const sp = activeSpells[spellIdx];
          pendingAction.current = { type: "spell", spell: sp };
          if (sp.target === "all" || sp.target === "all_allies") executeAction(enemies);
          else if (sp.target === "single_ally") { setAllyTargetBack("spells"); setAllyTargetIdx(0); setPhase("ally_targeting"); }
          else setPhase("targeting");
        }
        if (key === "Escape" || key === "x") setPhase("select");
      }
      if (phase === "skills") {
        if (key === "ArrowUp")   setSkillIdx(i => Math.max(0, i - 1));
        if (key === "ArrowDown") setSkillIdx(i => Math.min(activeSkills.length - 1, i + 1));
        if (["Enter","z"].includes(key)) {
          const sk = activeSkills[skillIdx];
          pendingAction.current = { type: "skill", skill: sk };
          if (sk.target === "all") executeAction(enemies);
          else setPhase("targeting");
        }
        if (key === "Escape" || key === "x") setPhase("select");
      }
      if (phase === "items") {
        const usable = getUsableItems();
        if (key === "ArrowUp")   setItemIdx(i => Math.max(0, i - 1));
        if (key === "ArrowDown") setItemIdx(i => Math.min(usable.length - 1, i + 1));
        if (["Enter","z"].includes(key)) {
          const sel = usable[itemIdx];
          if (sel) selectItem(sel.item);
        }
        if (key === "Escape" || key === "x") setPhase("select");
      }
      if (phase === "targeting") {
        const alive = enemies.filter(e => e.hp > 0);
        if (key === "ArrowLeft")  setTargetIdx(i => (i - 1 + alive.length) % alive.length);
        if (key === "ArrowRight") setTargetIdx(i => (i + 1) % alive.length);
        if (["Enter","z"].includes(key)) executeAction(enemies);
        if (key === "Escape" || key === "x") {
          const t = pendingAction.current?.type;
          setPhase(t === "item" ? "items" : t === "skill" ? "skills" : "select");
        }
      }
      if (phase === "ally_targeting") {
        const allyList = getAllyList();
        if (key === "ArrowLeft")  setAllyTargetIdx(i => (i - 1 + allyList.length) % allyList.length);
        if (key === "ArrowRight") setAllyTargetIdx(i => (i + 1) % allyList.length);
        if (["Enter","z"].includes(key)) executeAction(enemies);
        if (key === "Escape" || key === "x") setPhase(allyTargetBack);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function getAllyList() {
    const p = player!;
    const list: Array<{ id: string; name: string; hp: number; maxHp: number; mp: number; maxMp: number }> = [
      { id: "player", name: `あなた(${JOB[p.jobClass]})`, hp: playerHp, maxHp: p.maxHp, mp: playerMp, maxMp: p.maxMp },
      ...partyMembers.filter(m => m.hp > 0).map(m => ({ id: m.id, name: m.name, hp: m.hp, maxHp: m.maxHp, mp: m.mp, maxMp: m.maxMp })),
    ];
    return list;
  }

  function getMemberLevel(): number {
    return Math.max(1, (playerRef.current?.level ?? 1) - 1);
  }

  /** 現在の行動者（プレイヤー or 指定された仲間）を共通インターフェースで返す */
  function getActiveWeapon(): ShopItem | null {
    if (!actingMemberId) return getEquippedWeapon();
    return findItemById(partyRef.current.find(x => x.id === actingMemberId)?.weaponId);
  }

  function canUseUltimate(): boolean {
    const w = getActiveWeapon();
    return !!w?.ultimate && !usedUltimatesRef.current.has(getActiveCombatant().id);
  }

  function getActiveCombatant() {
    const p = playerRef.current;
    const m = actingMemberId ? partyRef.current.find(x => x.id === actingMemberId) : null;
    if (actingMemberId && m) {
      return {
        id: m.id,
        name: m.name,
        jobClass: m.jobClass,
        attack: m.attack, magic: m.magic, maxHp: m.maxHp, maxMp: m.maxMp,
        craftEffect: DEFAULT_CRAFT_EFFECT,
        weaponElement: (findItemById(m.weaponId)?.element ?? "none") as Element,
        getHp: () => partyRef.current.find(x => x.id === m.id)?.hp ?? 0,
        getMp: () => partyRef.current.find(x => x.id === m.id)?.mp ?? 0,
        setHp: (v: number) => { partyRef.current = partyRef.current.map(x => x.id === m.id ? { ...x, hp: v } : x); syncPartyState(); },
        setMp: (v: number) => { partyRef.current = partyRef.current.map(x => x.id === m.id ? { ...x, mp: v } : x); syncPartyState(); },
      };
    }
    // プレイヤー本人（フォールバックも含む）
    return {
      id: "player" as const,
      name: `あなた(${p ? JOB[p.jobClass] : ""})`,
      jobClass: p?.jobClass ?? "warrior",
      attack: p?.attack ?? 0, magic: p?.magic ?? 0, maxHp: p?.maxHp ?? 0, maxMp: p?.maxMp ?? 0,
      craftEffect: p?.craftEffect ?? DEFAULT_CRAFT_EFFECT,
      weaponElement: (getEquippedWeapon()?.element ?? "none") as Element,
      getHp: () => playerHpRef.current,
      getMp: () => playerMpRef.current,
      setHp: (v: number) => { setPlayerHp(v); playerHpRef.current = v; },
      setMp: (v: number) => { setPlayerMp(v); playerMpRef.current = v; },
    };
  }

  function getUsableItems() {
    const inv = getInventory();
    return inv
      .map(entry => ({ entry, item: SHOP_ITEMS.find(i => i.id === entry.id) }))
      .filter((x): x is { entry: typeof inv[number]; item: ShopItem } =>
        !!x.item && ["potion", "ether", "throwable"].includes(x.item.category));
  }

  /** どうぐ選択後の遷移：味方対象なら ally_targeting、敵対象なら targeting（敵1体のみなら即実行） */
  function selectItem(item: ShopItem) {
    pendingAction.current = { type: "item", item };
    if (item.category === "throwable") {
      const aliveCount = enemies.filter(e => e.hp > 0).length;
      if (aliveCount > 1) { setTargetIdx(0); setPhase("targeting"); }
      else executeAction(enemies);
    } else {
      setAllyTargetBack("items"); setAllyTargetIdx(0); setPhase("ally_targeting");
    }
  }

  function executeSelect(cmd: SelectCmd) {
    if (!player) return;
    if (cmd === "attack") {
      pendingAction.current = { type: "attack" };
      if (enemies.filter(e => e.hp > 0).length > 1) setPhase("targeting");
      else executeAction(enemies);
    }
    if (cmd === "skill") {
      if (!activeSkills.length) { pushMessages(["つかえるわざがない！"], "select"); return; }
      setSkillIdx(0); setPhase("skills");
    }
    if (cmd === "ultimate") {
      if (!canUseUltimate()) return;
      const ult = getActiveWeapon()!.ultimate!;
      pendingAction.current = { type: "ultimate" };
      if (ult.kind === "nuke_single") setPhase("targeting");
      else executeAction(enemies);
    }
    if (cmd === "magic") {
      if (!activeSpells.length) { pushMessages(["つかえるまほうがない！"], "select"); return; }
      setSpellIdx(0); setPhase("spells");
    }
    if (cmd === "item") {
      if (!getUsableItems().length) { pushMessages(["どうぐがない！"], "select"); return; }
      setItemIdx(0); setPhase("items");
    }
    if (cmd === "run") {
      if (actingMemberId) return; // 仲間のターンでは「にげる」は選べない
      if (isBossFloor) { pushMessages(["ボスからはにげられない！"], "select"); return; }
      if (Math.random() < 0.5) pushMessages(["うまくにげられた！"], "ran");
      else pushCb(["にげられなかった！"], advanceActor);
    }
  }

  function executeAction(currentEnemies: ActiveEnemy[]) {
    try {
      executeActionInner(currentEnemies);
    } catch (err) {
      console.error("executeAction error", err);
      pendingAction.current = null;
      setPhase("select");
    }
  }

  function executeActionInner(currentEnemies: ActiveEnemy[]) {
    if (!player || !pendingAction.current) return;
    const action = pendingAction.current;
    const alive = currentEnemies.filter(e => e.hp > 0);
    if (!alive.length) { pendingAction.current = null; setPhase("select"); return; }
    const aliveTarget = alive[Math.min(Math.max(0, targetIdx), alive.length - 1)];
    let updated = [...currentEnemies];
    const msgs: string[] = [];
    const combatant = getActiveCombatant();

    if (action.type === "item" && action.item.category === "throwable") {
      const item = action.item;
      removeInventory(item.id);
      msgs.push(`${item.name}をつかった！`);
      if (item.damage) {
        flashEnemy(aliveTarget.uid);
        updated = updated.map(e => e.uid === aliveTarget.uid ? { ...e, hp: Math.max(0, e.hp - item.damage!) } : e);
        msgs.push(`${aliveTarget.name}に${item.damage}のダメージ！`);
      }
      if (item.enemyStatus) {
        const curSt = enemyStatusesRef.current.get(aliveTarget.uid);
        if (curSt) {
          msgs.push(`${aliveTarget.name}はすでに${STATUS_LABEL[curSt.type]}だ！`);
        } else if (tryApplyStatus(item.enemyStatus.baseChance, aliveTarget.statusResist[item.enemyStatus.status])) {
          setEnemyStatus(aliveTarget.uid, { type: item.enemyStatus.status, turnsLeft: item.enemyStatus.turns });
          flashEnemy(aliveTarget.uid);
          msgs.push(`${aliveTarget.name}が${STATUS_LABEL[item.enemyStatus.status]}になった！`);
        } else {
          msgs.push(`${aliveTarget.name}には効かなかった！`);
        }
      }
      setEnemies(updated); enemiesRef.current = updated;
      if (checkVictory(updated)) return;
      pushCb(msgs, advanceActor);
      return;
    }

    if (action.type === "item") {
      const item = action.item;
      const allyTarget = getAllyList()[Math.min(allyTargetIdx, getAllyList().length - 1)];
      removeInventory(item.id);
      msgs.push(`${item.name}をつかった！`);
      if (item.hpRestore) {
        if (allyTarget.id === "player") {
          const before = playerHpRef.current;
          const newHp = Math.min(player.maxHp, before + item.hpRestore);
          setPlayerHp(newHp); playerHpRef.current = newHp;
          msgs.push(`あなたのHPが${newHp - before}回復した！`);
        } else {
          let healed = 0;
          const upd = partyRef.current.map(m => {
            if (m.id !== allyTarget.id) return m;
            const newHp = Math.min(m.maxHp, m.hp + item.hpRestore!);
            healed = newHp - m.hp;
            return { ...m, hp: newHp };
          });
          partyRef.current = upd; syncPartyState();
          msgs.push(`${allyTarget.name}のHPが${healed}回復した！`);
        }
      }
      if (item.mpRestore) {
        if (allyTarget.id === "player") {
          const before = playerMpRef.current;
          const newMp = Math.min(player.maxMp, before + item.mpRestore);
          setPlayerMp(newMp); playerMpRef.current = newMp;
          msgs.push(`あなたのMPが${newMp - before}回復した！`);
        } else {
          let healed = 0;
          const upd = partyRef.current.map(m => {
            if (m.id !== allyTarget.id) return m;
            const newMp = Math.min(m.maxMp, m.mp + item.mpRestore!);
            healed = newMp - m.mp;
            return { ...m, mp: newMp };
          });
          partyRef.current = upd; syncPartyState();
          msgs.push(`${allyTarget.name}のMPが${healed}回復した！`);
        }
      }
      pushCb(msgs, advanceActor);
      return;
    }

    if (action.type === "ultimate") {
      const weapon = getActiveWeapon();
      const ult = weapon?.ultimate;
      if (!ult || usedUltimatesRef.current.has(combatant.id)) { setPhase("select"); return; }
      usedUltimatesRef.current.add(combatant.id);
      msgs.push(`✨ ${combatant.name}の${ult.name}！`);

      const applyBuff = (buffRef: typeof speedBuffsRef, setBuffedIds: typeof setSpeedBuffedIds, factor: number, label: string) => {
        const newBuffs = new Map(buffRef.current);
        const allyIds = [{ id: "player" }, ...partyRef.current.filter(m => m.hp > 0).map(m => ({ id: m.id }))];
        for (const a of allyIds) newBuffs.set(a.id, { turnsLeft: 3, factor });
        buffRef.current = newBuffs;
        setBuffedIds(new Set(newBuffs.keys()));
        msgs.push(`味方全員の${label}が上がった！`);
      };

      if (ult.kind === "nuke_single") {
        const power = ult.power ?? 4;
        const dmg = Math.max(1, Math.round((combatant.attack * power) - aliveTarget.defense * 0.5));
        flashEnemy(aliveTarget.uid);
        updated = updated.map(e => e.uid === aliveTarget.uid ? { ...e, hp: Math.max(0, e.hp - dmg) } : e);
        msgs.push(`${aliveTarget.name}に${dmg}の超巨大ダメージ！`);
        if (ult.buffType === "def_up") applyBuff(defBuffsRef, setDefBuffedIds, ult.buffFactor ?? 1.6, "守備力");
        if (ult.buffType === "atk_up") applyBuff(atkBuffsRef, setAtkBuffedIds, ult.buffFactor ?? 1.5, "攻撃力");
        if (ult.buffType === "speed_up") applyBuff(speedBuffsRef, setSpeedBuffedIds, ult.buffFactor ?? 1.6, "素早さ");
      } else if (ult.kind === "nuke_all") {
        const power = ult.power ?? 2.5;
        for (const t of alive) {
          const dmg = Math.max(1, Math.round((combatant.attack * power) - t.defense * 0.5));
          flashEnemy(t.uid);
          updated = updated.map(e => e.uid === t.uid ? { ...e, hp: Math.max(0, e.hp - dmg) } : e);
          msgs.push(`${t.name}に${dmg}の超巨大ダメージ！`);
        }
        if (ult.buffType === "def_up") applyBuff(defBuffsRef, setDefBuffedIds, ult.buffFactor ?? 1.6, "守備力");
        if (ult.buffType === "atk_up") applyBuff(atkBuffsRef, setAtkBuffedIds, ult.buffFactor ?? 1.5, "攻撃力");
        if (ult.buffType === "speed_up") applyBuff(speedBuffsRef, setSpeedBuffedIds, ult.buffFactor ?? 1.6, "素早さ");
      } else if (ult.kind === "revive_heal") {
        if (playerHpRef.current > 0) { setPlayerHp(player.maxHp); playerHpRef.current = player.maxHp; }
        let revived = playerHpRef.current <= 0;
        if (revived) { setPlayerHp(Math.floor(player.maxHp * 0.5)); playerHpRef.current = Math.floor(player.maxHp * 0.5); }
        const updParty = partyRef.current.map(m => {
          if (m.hp > 0) return { ...m, hp: m.maxHp };
          if (!revived) { revived = true; return { ...m, hp: Math.floor(m.maxHp * 0.5) }; }
          return m;
        });
        partyRef.current = updParty; syncPartyState();
        msgs.push("味方全員のHPが全回復した！");
        if (revived) msgs.push("倒れていた仲間がよみがえった！");
      } else if (ult.kind === "support_buff") {
        const healAmt = ult.power ?? 60;
        if (playerHpRef.current > 0) { const nh = Math.min(player.maxHp, playerHpRef.current + healAmt); setPlayerHp(nh); playerHpRef.current = nh; }
        const updParty = partyRef.current.map(m => m.hp > 0 ? { ...m, hp: Math.min(m.maxHp, m.hp + healAmt) } : m);
        partyRef.current = updParty; syncPartyState();
        msgs.push(`味方全員のHPが${healAmt}回復した！`);
        applyBuff(defBuffsRef, setDefBuffedIds, ult.buffFactor ?? 1.6, "守備力");
        applyBuff(speedBuffsRef, setSpeedBuffedIds, 1.5, "素早さ");
      }

      setEnemies(updated); enemiesRef.current = updated;
      if (checkVictory(updated)) return;
      pushCb(msgs, advanceActor);
      return;
    }

    if (action.type === "skill") {
      const skill = action.skill;
      const actualMpCost = Math.max(1, Math.ceil(skill.mpCost * combatant.craftEffect.mpCostMultiplier));
      if (combatant.getMp() < actualMpCost) { pushMessages(["MPがたりない！"], "select"); return; }
      combatant.setMp(combatant.getMp() - actualMpCost);

      const confused = actingMemberId
        ? partyRef.current.find(m => m.id === actingMemberId)?.status?.type === "confuse"
        : playerStatusRef.current?.type === "confuse";
      if (!tryHit(confused)) {
        msgs.push(confused ? "😵 混乱してわざがミス！" : `${skill.name}！　ミス！`);
        pushCb(msgs, advanceActor); return;
      }

      const targets = skill.target === "all" ? alive : [aliveTarget];
      msgs.push(`${skill.name}！`);
      const atkValue = effectiveAttack(combatant.id, combatant.attack);
      const matched = skill.element !== "none" && skill.element === combatant.weaponElement;
      for (const t of targets) {
        const crit = tryCritical();
        let dmg = calcSkillDamage(atkValue, t.defense, skill, combatant.weaponElement, t.physResist);
        if (crit) dmg = Math.round(dmg * CRIT_MULTIPLIER);
        flashEnemy(t.uid);
        updated = updated.map(e => e.uid === t.uid ? { ...e, hp: Math.max(0, e.hp - dmg) } : e);
        const eSt = enemyStatusesRef.current.get(t.uid);
        if (eSt?.type === "sleep") { setEnemyStatus(t.uid, null); msgs.push(`${t.name}は目を覚ました！`); }
        if (crit) msgs.push("💥会心の一撃！");
        msgs.push(`${t.name}に${dmg}ダメージ！${matched ? "　武器属性が一致して大ダメージ！" : ""}`);
        if (t.physResist < 0.5) msgs.push("物理攻撃はあまり効かないようだ…");
      }
      setEnemies(updated); enemiesRef.current = updated;
      if (checkVictory(updated)) return;
      pushCb(msgs, advanceActor);
      return;
    }

    if (action.type === "attack") {
      const confused = actingMemberId
        ? partyRef.current.find(m => m.id === actingMemberId)?.status?.type === "confuse"
        : playerStatusRef.current?.type === "confuse";
      if (!tryHit(confused)) {
        msgs.push(confused ? "😵 混乱してこうげきがミス！" : "こうげき！　ミス！");
        pushCb(msgs, advanceActor); return;
      }
      const crit = tryCritical();
      const atkValue = effectiveAttack(combatant.id, combatant.attack);
      const dmg = Math.round(calcPhysicalDamage(atkValue, aliveTarget.defense, aliveTarget.physResist) * (crit ? CRIT_MULTIPLIER : 1));
      flashEnemy(aliveTarget.uid);
      if (crit) msgs.push("💥会心の一撃！");
      msgs.push(`${aliveTarget.name}に${dmg}のダメージ！`);
      if (aliveTarget.physResist < 0.5) msgs.push("物理攻撃はあまり効かないようだ…");
      const eSt = enemyStatusesRef.current.get(aliveTarget.uid);
      if (eSt?.type === "sleep") { setEnemyStatus(aliveTarget.uid, null); msgs.push(`${aliveTarget.name}は目を覚ました！`); }
      updated = updated.map(e => e.uid === aliveTarget.uid ? { ...e, hp: Math.max(0, e.hp - dmg) } : e);

      // 炎付加ダメージ（クラフト効果）
      if (combatant.craftEffect.fireOnHit > 0) {
        const fireDmg = combatant.craftEffect.fireOnHit;
        flashEnemy(aliveTarget.uid);
        updated = updated.map(e => e.uid === aliveTarget.uid ? { ...e, hp: Math.max(0, e.hp - fireDmg) } : e);
        msgs.push(`🔥 炎の付加ダメージ！ ${fireDmg}ダメージ！`);
      }
    }

    if (action.type === "spell") {
      const spell = action.spell;
      const actualMpCost = Math.max(1, Math.ceil(spell.mpCost * (combatant.craftEffect.mpCostMultiplier)));
      if (combatant.getMp() < actualMpCost) { pushMessages(["MPがたりない！"], "select"); return; }
      combatant.setMp(combatant.getMp() - actualMpCost);

      // Ally-targeting spells（素早さ/攻撃力/守備力アップ）
      if (spell.allyEffect) {
        msgs.push(`${spell.name}！`);
        const buffTargets = spell.target === "all_allies"
          ? [{ id: "player" }, ...partyRef.current.filter(m => m.hp > 0).map(m => ({ id: m.id }))]
          : [getAllyList()[Math.min(allyTargetIdx, getAllyList().length - 1)]];
        const buffRef = spell.allyEffect.type === "atk_up" ? atkBuffsRef
          : spell.allyEffect.type === "def_up" ? defBuffsRef
          : speedBuffsRef;
        const setBuffedIds = spell.allyEffect.type === "atk_up" ? setAtkBuffedIds
          : spell.allyEffect.type === "def_up" ? setDefBuffedIds
          : setSpeedBuffedIds;
        const statLabel = spell.allyEffect.type === "atk_up" ? "攻撃力" : spell.allyEffect.type === "def_up" ? "守備力" : "素早さ";
        const newBuffs = new Map(buffRef.current);
        for (const bt of buffTargets) {
          newBuffs.set(bt.id, { turnsLeft: spell.allyEffect.turns, factor: spell.allyEffect.factor });
          const name = bt.id === "player" ? "あなた" : (partyRef.current.find(m => m.id === bt.id)?.name ?? bt.id);
          msgs.push(`${name}の${statLabel}が上がった！(${spell.allyEffect.turns}ターン)`);
        }
        buffRef.current = newBuffs;
        setBuffedIds(new Set(newBuffs.keys()));
        setEnemies(updated); enemiesRef.current = updated;
        pushCb(msgs, advanceActor);
        return;
      }

      // Heal spells
      if (spell.target === "single_ally" || spell.target === "all_allies") {
        msgs.push(`${spell.name}！`);
        const healTargets = spell.target === "all_allies"
          ? [{ id: "player" }, ...partyRef.current.filter(m => m.hp > 0).map(m => ({ id: m.id }))]
          : [getAllyList()[Math.min(allyTargetIdx, getAllyList().length - 1)]];
        for (const ht of healTargets) {
          const healAmt = calcHealAmount(combatant.magic, spell.id);
          if (ht.id === "player") {
            const newHp = Math.min(player.maxHp, playerHpRef.current + healAmt);
            setPlayerHp(newHp); playerHpRef.current = newHp;
            msgs.push(`あなたのHPが${healAmt}回復した！`);
          } else {
            const upd = partyRef.current.map(m => m.id === ht.id ? { ...m, hp: Math.min(m.maxHp, m.hp + healAmt) } : m);
            partyRef.current = upd; syncPartyState();
            const name = partyRef.current.find(m => m.id === ht.id)?.name ?? ht.id;
            msgs.push(`${name}のHPが${healAmt}回復した！`);
          }
        }
        setEnemies(updated); enemiesRef.current = updated;
        pushCb(msgs, advanceActor);
        return;
      }

      // Damage / status spells (enemy targets)
      const targets = spell.target === "all" ? alive : [aliveTarget];
      if (spell.effect) {
        msgs.push(`${spell.name}！`);
        for (const t of targets) {
          const curSt = enemyStatusesRef.current.get(t.uid);
          if (curSt) { msgs.push(`${t.name}はすでに${STATUS_LABEL[curSt.type]}だ！`); continue; }
          if (tryApplyStatus(spell.effect.baseChance, t.statusResist[spell.effect.status])) {
            setEnemyStatus(t.uid, { type: spell.effect.status, turnsLeft: spell.effect.turns });
            flashEnemy(t.uid);
            msgs.push(`${t.name}が${STATUS_LABEL[spell.effect.status]}になった！`);
          } else {
            msgs.push(`${t.name}には効かなかった！`);
          }
        }
      } else {
        for (const t of targets) {
          const crit = tryCritical();
          const rawDmg = calcMagicDamage(combatant.magic, spell, t.element, t.magicResist);
          const dmg = Math.round(rawDmg * combatant.craftEffect.spellMultiplier * (crit ? CRIT_MULTIPLIER : 1));
          flashEnemy(t.uid);
          updated = updated.map(e => e.uid === t.uid ? { ...e, hp: Math.max(0, e.hp - dmg) } : e);
          const eff = (() => {
            if (t.magicResist < 0.5) return "　魔法はあまり効かないようだ…";
            const e2 = getEffectiveness(spell.element, t.element);
            if (e2 >= 1.8) return "　こうかはばつぐんだ！";
            if (e2 <= 0.6) return "　こうかはいまひとつ…";
            return "";
          })();
          if (crit) msgs.push("💥会心の一撃！");
          msgs.push(`${spell.name}！ ${t.name}に${dmg}ダメージ！${eff}`);
        }
      }
    }

    setEnemies(updated); enemiesRef.current = updated;
    if (checkVictory(updated)) return;
    pushCb(msgs, advanceActor);
  }

  if (!player || !enemies.length) {
    return <div className="flex min-h-screen items-center justify-center text-gray-400 font-mono">よみこみちゅう...</div>;
  }

  const aliveEnemies = enemies.filter(e => e.hp > 0);
  const aliveTargetForDisplay = aliveEnemies[Math.min(targetIdx, Math.max(0, aliveEnemies.length - 1))];
  const allyList = getAllyList();
  const inv = getInventory();
  const itemCount = inv.filter(i => ["potion","hi_potion","ether","hi_ether"].includes(i.id)).reduce((s, i) => s + i.qty, 0);

  // Turn order display - show actor labels
  function actorLabel(a: TurnActor): string {
    if (a.kind === "player") return `あなた`;
    if (a.kind === "party") return partyMembers.find(m => m.id === a.id)?.name ?? "?";
    return enemies.find(e => e.uid === a.id)?.name ?? "?";
  }
  function actorColor(a: TurnActor): string {
    if (a.kind === "player") return "text-yellow-300";
    if (a.kind === "party") return "text-green-300";
    return "text-red-300";
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-3 font-mono select-none"
      onClick={() => {
        if (phase === "message") advance();
        if (["victory","defeat","ran"].includes(phase)) router.push("/game");
      }}
    >
      <div className="w-full max-w-lg space-y-2">

        {/* フロア + ターン順 */}
        <div className="flex justify-between items-start px-1">
          <span className={`text-sm font-bold ${isBossFloor ? "text-red-400 animate-pulse" : isRareFloor ? "text-yellow-300 animate-pulse" : "text-yellow-300"}`}>
            {isBossFloor ? "⚠️ BOSS " : isRareFloor ? "✨ レア！ " : ""}{dungeonLabel}{isFlatDungeon ? "" : ` ${floor}階`}
          </span>
          <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
            {turnOrder.map((a, i) => (
              <span
                key={`${a.id}-${i}`}
                className={`text-xs px-1.5 py-0.5 rounded border ${
                  a.id === currentActorId
                    ? "border-yellow-400 bg-yellow-900/50 font-bold text-yellow-200"
                    : "border-gray-600 bg-gray-900 opacity-60"
                } ${actorColor(a)}`}
              >
                {speedBuffedIds.has(a.id) ? "⚡" : ""}{actorLabel(a)}
              </span>
            ))}
          </div>
        </div>

        {/* 敵エリア */}
        <div className={`rounded-xl border-2 p-3 ${isBossFloor ? "border-red-600 bg-red-950/30" : isRareFloor ? "border-yellow-500 bg-yellow-950/20" : "border-gray-500 bg-gray-800"}`}>
          <div className="flex justify-center gap-4 flex-wrap">
            {enemies.map((e) => {
              const isAlive = e.hp > 0;
              const isTarget = phase === "targeting" && aliveTargetForDisplay?.uid === e.uid;
              const eSt = enemyStatuses.get(e.uid);
              return (
                <div key={e.uid} className="flex flex-col items-center gap-1">
                  {isTarget
                    ? <span className="text-yellow-400 text-sm animate-bounce">▼</span>
                    : <span className="text-transparent text-sm">▼</span>}
                  <div className={isAlive ? "" : "opacity-20"}>
                    <EnemySprite
                      shape={e.shape} color={e.color}
                      damaged={damagedUids.has(e.uid)}
                      size={enemies.length === 1 ? 110 : enemies.length === 2 ? 90 : 70}
                    />
                  </div>
                  {isAlive ? (
                    <div className="text-center space-y-0.5">
                      <div className={`text-xs font-bold ${e.isRare ? "text-yellow-300" : "text-white"}`}>
                        {e.isRare ? "✨ " : ""}{e.name}
                      </div>
                      <div className="flex flex-wrap justify-center gap-1 text-xs">
                        <span className="text-gray-300">{ELEMENT_LABEL[e.element]}</span>
                        <span className="text-gray-400">⚡{e.speed}</span>
                        {e.physResist < 0.5  && <span className="text-blue-300">🛡️物理</span>}
                        {e.magicResist < 0.5 && <span className="text-purple-300">🔮魔法</span>}
                        {eSt && (
                          <span className="rounded bg-gray-700 px-1 py-0.5 text-yellow-300">
                            {STATUS_LABEL[eSt.type]}({eSt.turnsLeft})
                          </span>
                        )}
                      </div>
                      <HpBar current={e.hp} max={e.floorHp} blocks={10} />
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 font-bold">たおれた</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* メッセージ */}
        <div className={`min-h-[72px] rounded-xl border-2 border-gray-500 bg-gray-800 p-4 text-sm leading-7 ${playerDamaged ? "border-red-500" : ""}`}>
          {phase === "message" && (
            <div>
              <p className="text-white font-medium">{displayed}</p>
              {displayed === messages[0] && (
                <p className="text-xs text-yellow-400 mt-1 animate-pulse">▼ クリックまたはEnterで進む</p>
              )}
            </div>
          )}
          {phase === "victory" && <p className="text-yellow-300 font-bold text-base">🎉 しょうり！</p>}
          {phase === "defeat"  && <p className="text-red-300 font-bold text-base">💀 やられてしまった…</p>}
          {phase === "ran"     && <p className="text-white font-medium">うまくにげられた！</p>}
          {["victory","defeat","ran"].includes(phase) && (
            <p className="text-xs text-yellow-400 mt-2 animate-pulse">▼ クリックまたはEnterでもどる</p>
          )}
          {phase === "select"         && (
            <p className="text-yellow-200 font-medium">
              {actingMemberId ? `🎮 ${partyMembers.find(m => m.id === actingMemberId)?.name ?? ""}のコマンドを選んでください` : "コマンドを選んでください"}
            </p>
          )}
          {phase === "targeting"      && <p className="text-yellow-200 font-medium">← → でターゲット選択　Enterで決定</p>}
          {phase === "ally_targeting" && <p className="text-yellow-200 font-medium">← → で味方選択　Enterで決定</p>}
          {phase === "targeting" && !["attack", "ultimate"].includes(pendingAction.current?.type ?? "") && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const t = pendingAction.current?.type;
                setPhase(t === "item" ? "items" : t === "skill" ? "skills" : "spells");
              }}
              className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded px-2 py-0.5 hover:bg-gray-700 transition-colors mt-1"
            >
              {(() => {
                const t = pendingAction.current?.type;
                return t === "item" ? "← どうぐ選択にもどる" : t === "skill" ? "← わざ選択にもどる" : "← まほう選択にもどる";
              })()}
            </button>
          )}
          {phase === "ally_targeting" && (
            <button
              onClick={(e) => { e.stopPropagation(); setPhase(allyTargetBack); }}
              className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded px-2 py-0.5 hover:bg-gray-700 transition-colors mt-1"
            >
              {allyTargetBack === "items" ? "← どうぐ選択にもどる" : "← まほう選択にもどる"}
            </button>
          )}
          {phase === "spells"         && <p className="text-yellow-200 font-medium">まほうを選んでください</p>}
          {phase === "skills"         && <p className="text-yellow-200 font-medium">わざを選んでください</p>}
          {phase === "items"          && <p className="text-yellow-200 font-medium">どうぐを選んでください</p>}
        </div>

        {/* コマンド */}
        {phase === "select" && (
          <div className="rounded-xl border-2 border-gray-500 bg-gray-800 p-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                ...(actingMemberId ? (["attack","skill","magic","item"] as const) : (["attack","skill","magic","item","run"] as const)),
                ...(canUseUltimate() ? (["ultimate"] as const) : []),
              ].map((cmd) => {
                const labels = { attack:"たたかう", skill:"わざ", magic:"まほう", item:`どうぐ(${itemCount})`, run:"にげる", ultimate:`✨ ${getActiveWeapon()?.ultimate?.name ?? "ひっさつ"}` };
                const isUltimate = cmd === "ultimate";
                return (
                  <button
                    key={cmd}
                    onClick={(e) => { e.stopPropagation(); setSelectCmd(cmd); executeSelect(cmd); }}
                    onMouseEnter={() => setSelectCmd(cmd)}
                    className={`rounded-lg py-2.5 text-sm font-bold transition-all ${isUltimate ? "col-span-2" : ""} ${
                      selectCmd === cmd
                        ? "bg-yellow-400 text-gray-900"
                        : isUltimate
                          ? "bg-gradient-to-r from-fuchsia-700 to-orange-600 text-white animate-pulse hover:opacity-90"
                          : "bg-gray-700 text-white hover:bg-gray-600"
                    }`}
                  >
                    {selectCmd === cmd ? "▶ " : ""}{labels[cmd]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 呪文選択 */}
        {phase === "spells" && (
          <div className="rounded-xl border-2 border-gray-500 bg-gray-800 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-200 font-bold">まほう選択</span>
              <button
                onClick={(e) => { e.stopPropagation(); setPhase("select"); }}
                className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded px-2 py-0.5 hover:bg-gray-700 transition-colors"
              >
                ← もどる
              </button>
            </div>
            {/* 属性相関図 */}
            <div className="mb-2 rounded bg-gray-900 border border-gray-700 px-2 py-1.5 text-[10px] text-gray-400 leading-relaxed">
              <span className="text-gray-300 font-bold mr-1">属性:</span>
              🔥火→🌪️風 💧水→🔥火 🌪️風→🌍土 🌍土→💧水
              <span className="ml-1 text-green-400">（→有利×2）</span>
              <span className="text-red-400 ml-1">（逆は×0.5）</span>
            </div>
            <div className="space-y-1 max-h-44 overflow-y-auto">
              {activeSpells.map((sp, i) => {
                // 選択中の敵に対する有利・不利を計算
                const targetEnemy = enemies[targetIdx] ?? enemies[0];
                const eff = (sp.element !== "none" && !sp.allyEffect && !sp.effect && targetEnemy)
                  ? getEffectiveness(sp.element, targetEnemy.element)
                  : 1;
                const effLabel = eff >= 2 ? <span className="text-green-400 font-bold ml-1">▲有利</span>
                               : eff <= 0.5 ? <span className="text-red-400 font-bold ml-1">▼不利</span>
                               : null;
                return (
                  <button
                    key={sp.id}
                    onClick={(ev) => {
                      ev.stopPropagation(); setSpellIdx(i);
                      pendingAction.current = { type: "spell", spell: sp };
                      if (sp.target === "all" || sp.target === "all_allies") executeAction(enemies);
                      else if (sp.target === "single_ally") { setAllyTargetBack("spells"); setAllyTargetIdx(0); setPhase("ally_targeting"); }
                      else setPhase("targeting");
                    }}
                    onMouseEnter={() => setSpellIdx(i)}
                    className={`w-full flex justify-between rounded px-3 py-2 text-sm ${
                      spellIdx === i ? "bg-yellow-400 text-gray-900 font-bold" : "bg-gray-700 text-white"
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {spellIdx === i ? "▶ " : ""}
                      {sp.name}{" "}
                      {sp.allyEffect
                        ? (sp.allyEffect.type === "speed_up" ? "⚡速↑" : sp.allyEffect.type === "atk_up" ? "💪攻↑" : "🛡️守↑")
                        : sp.effect ? STATUS_LABEL[sp.effect.status] : ELEMENT_LABEL[sp.element]}
                      {effLabel}
                    </span>
                    <span className="text-xs opacity-80">
                      MP{sp.mpCost}
                      {sp.target === "all" || sp.target === "all_allies" ? "全体" :
                       sp.target === "single_ally" ? "味方単" : "単体"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* わざ選択 */}
        {phase === "skills" && (
          <div className="rounded-xl border-2 border-gray-500 bg-gray-800 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-200 font-bold">わざ選択</span>
              <button
                onClick={(e) => { e.stopPropagation(); setPhase("select"); }}
                className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded px-2 py-0.5 hover:bg-gray-700 transition-colors"
              >
                ← もどる
              </button>
            </div>
            <div className="mb-2 rounded bg-gray-900 border border-gray-700 px-2 py-1.5 text-[10px] text-gray-400 leading-relaxed">
              そうびしている武器の属性と一致した技は<span className="text-orange-300 font-bold">ダメージ増加</span>！
              現在の武器属性：<span className="text-orange-300 font-bold">{ELEMENT_LABEL[getActiveCombatant().weaponElement]}</span>
            </div>
            <div className="space-y-1 max-h-44 overflow-y-auto">
              {activeSkills.map((sk, i) => {
                const matched = sk.element !== "none" && sk.element === getActiveCombatant().weaponElement;
                return (
                  <button
                    key={sk.id}
                    onClick={(ev) => {
                      ev.stopPropagation(); setSkillIdx(i);
                      pendingAction.current = { type: "skill", skill: sk };
                      if (sk.target === "all") executeAction(enemies);
                      else setPhase("targeting");
                    }}
                    onMouseEnter={() => setSkillIdx(i)}
                    className={`w-full flex justify-between rounded px-3 py-2 text-sm ${
                      skillIdx === i ? "bg-yellow-400 text-gray-900 font-bold" : "bg-gray-700 text-white"
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {skillIdx === i ? "▶ " : ""}
                      {sk.name}{" "}
                      {ELEMENT_LABEL[sk.element]}
                      {matched && <span className="text-orange-400 font-bold ml-1">⚔️一致！</span>}
                    </span>
                    <span className="text-xs opacity-80">
                      MP{sk.mpCost}
                      {sk.target === "all" ? "全体" : "単体"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* どうぐ選択 */}
        {phase === "items" && (
          <div className="rounded-xl border-2 border-gray-500 bg-gray-800 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-200 font-bold">どうぐ選択</span>
              <button
                onClick={(e) => { e.stopPropagation(); setPhase("select"); }}
                className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded px-2 py-0.5 hover:bg-gray-700 transition-colors"
              >
                ← もどる
              </button>
            </div>
            <div className="space-y-1 max-h-44 overflow-y-auto">
              {getUsableItems().map((u, i) => (
                <button
                  key={u.item.id}
                  onClick={(e) => { e.stopPropagation(); setItemIdx(i); selectItem(u.item); }}
                  onMouseEnter={() => setItemIdx(i)}
                  className={`w-full flex justify-between rounded px-3 py-2 text-sm ${
                    itemIdx === i ? "bg-yellow-400 text-gray-900 font-bold" : "bg-gray-700 text-white"
                  }`}
                >
                  <span>{itemIdx === i ? "▶ " : ""}{u.item.name} ×{u.entry.qty}</span>
                  <span className="text-xs opacity-80">
                    {u.item.hpRestore ? `HP+${u.item.hpRestore >= 9999 ? "全快" : u.item.hpRestore} ` : ""}
                    {u.item.mpRestore ? `MP+${u.item.mpRestore >= 9999 ? "全快" : u.item.mpRestore}` : ""}
                    {u.item.damage ? `敵に${u.item.damage}ダメージ` : ""}
                    {u.item.enemyStatus ? `敵を${STATUS_LABEL[u.item.enemyStatus.status]}に` : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 味方ターゲット選択 */}
        {phase === "ally_targeting" && (
          <div className="rounded-xl border-2 border-yellow-700 bg-yellow-950/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-yellow-200 font-bold">味方を選ぶ</span>
              <button
                onClick={(e) => { e.stopPropagation(); setPhase(allyTargetBack); }}
                className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded px-2 py-0.5 hover:bg-gray-700 transition-colors"
              >
                ← もどる
              </button>
            </div>
            <div className="space-y-1">
              {allyList.map((ally, i) => (
                <button
                  key={ally.id}
                  onClick={(e) => { e.stopPropagation(); setAllyTargetIdx(i); executeAction(enemies); }}
                  onMouseEnter={() => setAllyTargetIdx(i)}
                  className={`w-full flex justify-between rounded px-3 py-2 text-sm ${
                    allyTargetIdx === i ? "bg-yellow-400 text-gray-900 font-bold" : "bg-gray-700 text-white"
                  }`}
                >
                  <span>{allyTargetIdx === i ? "▶ " : ""}{ally.name}</span>
                  <span className="text-xs opacity-80">{ally.hp}/{ally.maxHp} HP</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* プレイヤーステータス */}
        <div className={`rounded-xl border-2 border-gray-500 bg-gray-800 p-3 text-sm transition-colors ${playerDamaged ? "border-red-500 bg-red-950/20" : ""}`}>
          <div className="flex justify-between mb-1.5">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-yellow-300 font-bold">
                Lv.{player.level} あなた（{JOB[player.jobClass]}）
              </span>
              {speedBuffedIds.has("player") && <span className="text-cyan-300 text-xs">⚡速↑</span>}
              {atkBuffedIds.has("player") && <span className="text-pink-300 text-xs">💪攻↑</span>}
              {defBuffedIds.has("player") && <span className="text-sky-300 text-xs">🛡️守↑</span>}
              {player.craftEffect.mpCostMultiplier < 1 && <span className="text-blue-300 text-xs">MP節約</span>}
              {player.craftEffect.poisonImmune && <span className="text-green-300 text-xs">毒無効</span>}
              {player.craftEffect.reflectDamage > 0 && <span className="text-orange-300 text-xs">反射{Math.round(player.craftEffect.reflectDamage*100)}%</span>}
              {player.craftEffect.spellMultiplier > 1 && <span className="text-purple-300 text-xs">魔法✨×{player.craftEffect.spellMultiplier.toFixed(1)}</span>}
              {player.craftEffect.fireOnHit > 0 && <span className="text-red-300 text-xs">🔥+{player.craftEffect.fireOnHit}</span>}
            </div>
            <div className="flex gap-2 items-center">
              {playerStatus && (
                <span className="rounded bg-yellow-900 border border-yellow-700 px-1.5 py-0.5 text-xs text-yellow-300 font-bold">
                  {STATUS_LABEL[playerStatus.type]}({playerStatus.turnsLeft})
                </span>
              )}
              <span className="text-xs text-gray-500">⚡{player.speed}{speedBuffedIds.has("player") ? "↑" : ""}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-6 text-green-400 font-bold">HP</span>
              <HpBar current={playerHp} max={player.maxHp} />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-6 text-blue-400 font-bold">MP</span>
              <MpBar current={playerMp} max={player.maxMp} />
            </div>
          </div>
        </div>

        {/* 仲間ステータス */}
        {partyMembers.length > 0 && (
          <div className="space-y-1.5">
            {partyMembers.map(m => (
              <div
                key={m.id}
                className={`rounded-xl border-2 p-2.5 text-sm transition-colors ${
                  m.hp <= 0
                    ? "border-gray-700 bg-gray-900 opacity-50"
                    : damagedPartyIds.has(m.id)
                      ? "border-red-500 bg-red-950/20"
                      : "border-green-800 bg-gray-800"
                }`}
              >
                <div className="flex justify-between mb-1">
                  <span className={`text-xs font-bold ${m.hp <= 0 ? "text-gray-500" : "text-green-300"}`}>
                    {m.name}（{JOB[m.jobClass]}）
                    {speedBuffedIds.has(m.id) && <span className="ml-1 text-cyan-300">⚡速↑</span>}
                    {atkBuffedIds.has(m.id) && <span className="ml-1 text-pink-300">💪攻↑</span>}
                    {defBuffedIds.has(m.id) && <span className="ml-1 text-sky-300">🛡️守↑</span>}
                    {m.hp <= 0 && " 💀"}
                  </span>
                  <div className="flex gap-1 items-center">
                    {m.status && m.hp > 0 && (
                      <span className="rounded bg-yellow-900 border border-yellow-700 px-1 py-0.5 text-xs text-yellow-300">
                        {STATUS_LABEL[m.status.type]}({m.status.turnsLeft})
                      </span>
                    )}
                    <span className="text-xs text-gray-500">⚡{m.speed}</span>
                  </div>
                </div>
                {m.hp > 0 && (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-6 text-green-400 font-bold">HP</span>
                      <HpBar current={m.hp} max={m.maxHp} blocks={14} />
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-6 text-blue-400 font-bold">MP</span>
                      <MpBar current={m.mp} max={m.maxMp} blocks={8} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
