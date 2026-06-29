"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import EnemySprite from "@/components/EnemySprite";
import {
  getRandomEnemyGroup, calcPlayerStats, calcPhysicalDamage, calcMagicDamage,
  getAvailableSpells, ELEMENT_LABEL,
  type ActiveEnemy, type PlayerStats, type JobClass, type Spell,
} from "@/lib/battle";
import {
  getEquippedWeapon, getEquippedArmor, getInventory, removeInventory, addInventory,
  SHOP_ITEMS, type ShopItem,
} from "@/lib/equipment";
import { addGold } from "@/lib/gold";

const JOB_KEY     = "rpg_job_class";
const VICTORY_KEY = "rpg_victories";

type Phase = "intro" | "select" | "spells" | "targeting" | "message" | "victory" | "defeat" | "ran";
type PendingAction = { type: "attack" } | { type: "spell"; spell: Spell };

// ブロック型HPバー
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
      <span className="text-xs tabular-nums text-gray-400 w-14 text-right">{current}/{max}</span>
    </div>
  );
}

function MpBar({ current, max, blocks = 12 }: { current: number; max: number; blocks?: number }) {
  const filled = Math.max(0, Math.round((current / max) * blocks));
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-px">
        {Array.from({ length: blocks }).map((_, i) => (
          <div key={i} className={`h-3 w-2.5 border border-gray-600 ${i < filled ? "bg-blue-500" : "bg-gray-800"}`} />
        ))}
      </div>
      <span className="text-xs tabular-nums text-gray-400 w-14 text-right">{current}/{max}</span>
    </div>
  );
}

export default function BattlePage() {
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerStats | null>(null);
  const [playerHp, setPlayerHp] = useState(0);
  const [playerMp, setPlayerMp] = useState(0);
  const [enemies, setEnemies] = useState<ActiveEnemy[]>([]);
  const [targetIdx, setTargetIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [messages, setMessages] = useState<string[]>([]);
  const [displayed, setDisplayed] = useState("");
  const [damagedUids, setDamagedUids] = useState<Set<string>>(new Set());
  const [victories, setVictories] = useState(0);
  const [spells, setSpells] = useState<Spell[]>([]);
  const [spellIdx, setSpellIdx] = useState(0);
  const pendingPhase = useRef<Phase | null>(null);
  const pendingAction = useRef<PendingAction | null>(null);
  const playerHpRef = useRef(0);
  const playerMpRef = useRef(0);
  const enemiesRef = useRef<ActiveEnemy[]>([]);

  // タイプライター
  useEffect(() => {
    if (!messages.length) return;
    if (displayed === messages[0]) return;
    const t = setTimeout(() => setDisplayed(messages[0].slice(0, displayed.length + 1)), 40);
    return () => clearTimeout(t);
  }, [messages, displayed]);

  const pushMessages = useCallback((msgs: string[], next?: Phase) => {
    pendingPhase.current = next ?? null;
    setMessages(msgs);
    setDisplayed("");
    setPhase("message");
  }, []);

  function advance() {
    if (displayed !== messages[0]) { setDisplayed(messages[0]); return; }
    if (messages.length > 1) {
      const [, ...rest] = messages;
      setMessages(rest);
      setDisplayed("");
    } else {
      const next = pendingPhase.current;
      setMessages([]); setDisplayed("");
      if (next) setPhase(next);
    }
  }

  // 敵ターン
  const doEnemyTurn = useCallback((curHp: number) => {
    const alive = enemiesRef.current.filter((e) => e.hp > 0);
    if (!alive.length || !player) return;

    const msgs: string[] = [];
    let hp = curHp;
    for (const e of alive) {
      const dmg = calcPhysicalDamage(e.attack, player.defense);
      hp = Math.max(0, hp - dmg);
      msgs.push(`${e.name}のこうげき！ ${dmg}ダメージ！`);
      if (hp <= 0) break;
    }
    setPlayerHp(hp);
    playerHpRef.current = hp;
    if (hp <= 0) pushMessages([...msgs, "やられてしまった…"], "defeat");
    else pushMessages(msgs, "select");
  }, [player, pushMessages]);

  // 初期化
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/"); return; }
      const res = await fetch(process.env.NEXT_PUBLIC_STATS_API_URL!, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const stats = await res.json();
      const level = Math.floor(stats.totalPoints / 100) + 1;
      const job = (localStorage.getItem(JOB_KEY) ?? "warrior") as JobClass;
      const weapon = getEquippedWeapon();
      const armor  = getEquippedArmor();
      const p = calcPlayerStats(
        level, job,
        weapon?.attackBonus ?? 0, weapon?.magicBonus ?? 0,
        armor?.defenseBonus ?? 0, armor?.magicBonus ?? 0,
      );
      const grp = getRandomEnemyGroup(level);
      const vic = parseInt(localStorage.getItem(VICTORY_KEY) ?? "0", 10);
      const availableSpells = getAvailableSpells(level, job);

      setPlayer(p);
      setPlayerHp(p.maxHp); playerHpRef.current = p.maxHp;
      setPlayerMp(p.maxMp); playerMpRef.current = p.maxMp;
      setEnemies(grp); enemiesRef.current = grp;
      setVictories(vic);
      setSpells(availableSpells);

      const names = grp.length === 1
        ? `${grp[0].name}があらわれた！`
        : `${grp[0].name}が ${grp.length}体あらわれた！`;
      pushMessages([names], "select");
    }
    init();
  }, [router, pushMessages]);

  // キーボード操作
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const key = e.key;
      if (phase === "message") {
        if (["Enter"," ","z"].includes(key)) advance();
        return;
      }
      if (["victory","defeat","ran"].includes(phase)) {
        if (["Enter"," "].includes(key)) router.push("/game");
        return;
      }
      if (phase === "select") {
        const CMDS = ["attack","magic","item","run"];
        const cur = CMDS.indexOf(selectCmd);
        if (key === "ArrowUp")    setSelectCmd(CMDS[(cur+2)%4] as SelectCmd);
        if (key === "ArrowDown")  setSelectCmd(CMDS[(cur+2)%4] as SelectCmd);
        if (key === "ArrowLeft")  setSelectCmd(CMDS[cur%2===0?cur+1:cur-1] as SelectCmd);
        if (key === "ArrowRight") setSelectCmd(CMDS[cur%2===0?cur+1:cur-1] as SelectCmd);
        if (["Enter","z"].includes(key)) executeSelect(selectCmd);
      }
      if (phase === "spells") {
        if (key === "ArrowUp")    setSpellIdx((i) => Math.max(0, i - 1));
        if (key === "ArrowDown")  setSpellIdx((i) => Math.min(spells.length - 1, i + 1));
        if (["Enter","z"].includes(key)) {
          pendingAction.current = { type: "spell", spell: spells[spellIdx] };
          if (spells[spellIdx].target === "all") { executeAction(enemies); }
          else setPhase("targeting");
        }
        if (key === "Escape" || key === "x") setPhase("select");
      }
      if (phase === "targeting") {
        const alive = enemies.filter(e => e.hp > 0);
        if (key === "ArrowLeft")  setTargetIdx((i) => (i - 1 + alive.length) % alive.length);
        if (key === "ArrowRight") setTargetIdx((i) => (i + 1) % alive.length);
        if (["Enter","z"].includes(key)) executeAction(enemies);
        if (key === "Escape" || key === "x") setPhase("select");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  type SelectCmd = "attack" | "magic" | "item" | "run";
  const [selectCmd, setSelectCmd] = useState<SelectCmd>("attack");

  function executeSelect(cmd: SelectCmd) {
    if (cmd === "attack") {
      pendingAction.current = { type: "attack" };
      if (enemies.filter(e => e.hp > 0).length > 1) setPhase("targeting");
      else executeAction(enemies);
    }
    if (cmd === "magic") {
      if (!spells.length) { pushMessages(["つかえるまほうがない！"], "select"); return; }
      setPhase("spells");
    }
    if (cmd === "item") useItem();
    if (cmd === "run") {
      if (Math.random() < 0.5) pushMessages(["うまくにげられた！"], "ran");
      else {
        pushMessages(["にげられなかった！"]);
        setTimeout(() => doEnemyTurn(playerHpRef.current), 1200);
      }
    }
  }

  function useItem() {
    const inv = getInventory();
    const potionEntry = inv.find(i => ["potion","hi_potion"].includes(i.id));
    const etherEntry  = inv.find(i => ["ether","hi_ether"].includes(i.id));
    if (!potionEntry && !etherEntry) { pushMessages(["どうぐがない！"], "select"); return; }

    // ポーションがあればHP回復、なければエーテルでMP回復
    if (potionEntry) {
      const item = SHOP_ITEMS.find(i => i.id === potionEntry.id)!;
      removeInventory(potionEntry.id, 1);
      const heal = item.hpRestore!;
      const newHp = Math.min(player!.maxHp, playerHpRef.current + heal);
      setPlayerHp(newHp); playerHpRef.current = newHp;
      pushMessages([`${item.name}をつかった！ HPが${heal}回復！`]);
      setTimeout(() => doEnemyTurn(playerHpRef.current), 1200);
    } else if (etherEntry) {
      const item = SHOP_ITEMS.find(i => i.id === etherEntry.id)!;
      removeInventory(etherEntry.id, 1);
      const restore = item.mpRestore!;
      const newMp = Math.min(player!.maxMp, playerMpRef.current + restore);
      setPlayerMp(newMp); playerMpRef.current = newMp;
      pushMessages([`${item.name}をつかった！ MPが${restore}回復！`]);
      setTimeout(() => doEnemyTurn(playerHpRef.current), 1200);
    }
  }

  function flashDamage(uid: string) {
    setDamagedUids((s) => new Set([...s, uid]));
    setTimeout(() => setDamagedUids((s) => { const n = new Set(s); n.delete(uid); return n; }), 400);
  }

  function executeAction(currentEnemies: ActiveEnemy[]) {
    if (!player || !pendingAction.current) return;
    const action = pendingAction.current;
    const alive = currentEnemies.filter((e) => e.hp > 0);
    const aliveTargetIdx = Math.min(targetIdx, alive.length - 1);

    let updatedEnemies = [...currentEnemies];
    const msgs: string[] = [];

    if (action.type === "attack") {
      const target = alive[aliveTargetIdx];
      const dmg = calcPhysicalDamage(player.attack, target.defense);
      flashDamage(target.uid);
      updatedEnemies = updatedEnemies.map((e) =>
        e.uid === target.uid ? { ...e, hp: Math.max(0, e.hp - dmg) } : e
      );
      msgs.push(`${target.name}に ${dmg}のダメージ！`);
    }

    if (action.type === "spell") {
      const spell = action.spell;
      if (playerMpRef.current < spell.mpCost) {
        pushMessages(["MPがたりない！"], "select"); return;
      }
      const newMp = playerMpRef.current - spell.mpCost;
      setPlayerMp(newMp); playerMpRef.current = newMp;

      const targets = spell.target === "all" ? alive : [alive[aliveTargetIdx]];
      for (const t of targets) {
        const dmg = calcMagicDamage(player.magic, spell, t.element);
        const eff = dmg / (Math.floor(player.magic * 0.8 + spell.power));
        const effText = eff >= 1.8 ? "こうかはばつぐんだ！" : eff <= 0.6 ? "こうかはいまひとつ…" : "";
        flashDamage(t.uid);
        updatedEnemies = updatedEnemies.map((e) =>
          e.uid === t.uid ? { ...e, hp: Math.max(0, e.hp - dmg) } : e
        );
        msgs.push(`${spell.name}！ ${t.name}に${dmg}ダメージ！${effText}`);
      }
    }

    setEnemies(updatedEnemies);
    enemiesRef.current = updatedEnemies;

    const allDead = updatedEnemies.every((e) => e.hp <= 0);
    if (allDead) {
      const totalExp  = updatedEnemies.reduce((s, e) => s + e.expReward, 0);
      const totalGold = updatedEnemies.reduce((s, e) => s + e.goldReward, 0);
      addGold(totalGold);
      addInventory("potion", 1);
      const newVic = victories + 1;
      setVictories(newVic);
      localStorage.setItem(VICTORY_KEY, String(newVic));
      pushMessages([...msgs, `てきをたおした！`, `${totalGold}Gてにいれた！`, `ポーション1個もらった！`], "victory");
    } else {
      pushMessages(msgs);
      setTimeout(() => doEnemyTurn(playerHpRef.current), 1500);
    }
  }

  if (!player || !enemies.length) {
    return <div className="flex min-h-screen items-center justify-center text-gray-400 font-mono">よみこみちゅう...</div>;
  }

  const alive = enemies.filter((e) => e.hp > 0);
  const aliveTargetIdx = Math.min(targetIdx, Math.max(0, alive.length - 1));
  const JOB: Record<string, string> = { warrior:"戦士", mage:"魔法使い", cleric:"僧侶", rogue:"盗賊" };
  const inv = getInventory();
  const potionCount = inv.filter(i => ["potion","hi_potion"].includes(i.id)).reduce((s,i)=>s+i.qty,0);
  const etherCount  = inv.filter(i => ["ether","hi_ether"].includes(i.id)).reduce((s,i)=>s+i.qty,0);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-3 font-mono select-none"
      onClick={() => {
        if (phase === "message") advance();
        if (["victory","defeat","ran"].includes(phase)) router.push("/game");
      }}
    >
      <div className="w-full max-w-lg space-y-2">

        {/* 敵エリア */}
        <div className="rounded-xl border-2 border-gray-500 bg-gray-800 p-3">
          <div className="flex justify-center gap-4">
            {enemies.map((e, i) => {
              const isAlive = e.hp > 0;
              const isTarget = phase === "targeting" && alive[aliveTargetIdx]?.uid === e.uid;
              return (
                <div key={e.uid} className="flex flex-col items-center gap-1">
                  {isTarget && <span className="text-yellow-400 text-sm animate-bounce">▼</span>}
                  {!isTarget && <span className="text-transparent text-sm">▼</span>}
                  <div className={`${!isAlive ? "opacity-20" : ""}`}>
                    <EnemySprite
                      shape={e.shape}
                      color={e.color}
                      damaged={damagedUids.has(e.uid)}
                      size={enemies.length === 1 ? 120 : enemies.length === 2 ? 96 : 80}
                    />
                  </div>
                  {isAlive && (
                    <div className="text-center">
                      <div className="text-xs text-white font-bold">{e.name}</div>
                      <div className="text-xs text-gray-300">{ELEMENT_LABEL[e.element]}</div>
                      <HpBar current={e.hp} max={e.maxHp} blocks={10} />
                    </div>
                  )}
                  {!isAlive && <div className="text-xs text-gray-400 font-bold">たおれた</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* メッセージウィンドウ */}
        <div className="min-h-[72px] rounded-xl border-2 border-gray-500 bg-gray-800 p-4 text-sm leading-7">
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
          {phase === "select" && (
            <p className="text-yellow-200 font-medium">コマンドを選んでください</p>
          )}
          {phase === "targeting" && (
            <p className="text-yellow-200 font-medium">← → でターゲット選択　Enterで決定</p>
          )}
          {phase === "spells" && (
            <p className="text-yellow-200 font-medium">まほうを選んでください　Escでもどる</p>
          )}
          {phase === "intro" && (
            <p className="text-white font-medium animate-pulse">読み込み中...</p>
          )}
        </div>

        {/* コマンド */}
        {phase === "select" && (
          <div className="rounded-xl border-2 border-gray-500 bg-gray-800 p-3">
            <div className="grid grid-cols-2 gap-2">
              {(["attack","magic","item","run"] as const).map((cmd) => {
                const labels = { attack:"たたかう", magic:"まほう", item:`どうぐ(${potionCount+etherCount})`, run:"にげる" };
                return (
                  <button
                    key={cmd}
                    onClick={(e) => { e.stopPropagation(); setSelectCmd(cmd); executeSelect(cmd); }}
                    onMouseEnter={() => setSelectCmd(cmd)}
                    className={`rounded-lg py-2 text-sm font-bold transition-all ${
                      selectCmd === cmd ? "bg-yellow-400 text-gray-900" : "bg-gray-800 text-white hover:bg-gray-700"
                    }`}
                  >
                    {selectCmd === cmd ? "▶ " : ""}{labels[cmd]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 魔法選択 */}
        {phase === "spells" && (
          <div className="rounded-xl border-2 border-gray-500 bg-gray-800 p-3">
            <div className="text-xs text-gray-200 mb-2 font-bold">まほう選択 (Escでもどる)</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {spells.map((sp, i) => (
                <button
                  key={sp.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSpellIdx(i);
                    pendingAction.current = { type: "spell", spell: sp };
                    if (sp.target === "all") executeAction(enemies);
                    else setPhase("targeting");
                  }}
                  onMouseEnter={() => setSpellIdx(i)}
                  className={`w-full flex justify-between rounded px-3 py-1.5 text-sm ${
                    spellIdx === i ? "bg-yellow-400 text-gray-900 font-bold" : "bg-gray-800 text-white"
                  }`}
                >
                  <span>{spellIdx === i ? "▶ " : ""}{sp.name} {ELEMENT_LABEL[sp.element]}</span>
                  <span className="text-xs opacity-70">MP {sp.mpCost}　{sp.target === "all" ? "全体" : "単体"}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* プレイヤーステータス */}
        <div className="rounded-xl border-2 border-gray-500 bg-gray-800 p-3 text-sm">
          <div className="flex justify-between mb-2">
            <span className="text-yellow-300 font-bold">Lv.{player.level} {JOB[player.jobClass]}</span>
            <span className="text-gray-200 text-xs font-bold">🏆 {victories}勝</span>
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

      </div>
    </div>
  );
}
