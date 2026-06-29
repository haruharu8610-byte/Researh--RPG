"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import EnemySprite from "@/components/EnemySprite";
import {
  ENEMIES, calcPlayerStats, calcPhysicalDamage, calcMagicDamage,
  getRandomEnemy, type EnemyType, type PlayerStats, type JobClass,
} from "@/lib/battle";

const JOB_KEY      = "rpg_job_class";
const POTION_KEY   = "rpg_potions";
const VICTORY_KEY  = "rpg_victories";

type Phase = "intro" | "select" | "message" | "victory" | "defeat" | "ran";

const COMMANDS = [
  { id: "attack", label: "たたかう" },
  { id: "magic",  label: "まほう"   },
  { id: "item",   label: "どうぐ"   },
  { id: "run",    label: "にげる"   },
] as const;
type CommandId = (typeof COMMANDS)[number]["id"];

function HpBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = Math.max(0, Math.round((current / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="h-3 flex-1 rounded-full bg-gray-700">
        <div className={`h-3 rounded-full transition-all duration-300 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-20 text-right text-xs tabular-nums">{current}/{max}</span>
    </div>
  );
}

export default function BattlePage() {
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerStats | null>(null);
  const [playerHp, setPlayerHp] = useState(0);
  const [playerMp, setPlayerMp] = useState(0);
  const [potions, setPotions] = useState(0);
  const [enemy, setEnemy] = useState<EnemyType | null>(null);
  const [enemyHp, setEnemyHp] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [cmdIndex, setCmdIndex] = useState(0);
  const [messages, setMessages] = useState<string[]>([]);
  const [displayedMsg, setDisplayedMsg] = useState("");
  const [shakeEnemy, setShakeEnemy] = useState(false);
  const [victories, setVictories] = useState(0);
  const pendingPhaseRef = useRef<Phase | null>(null);
  const msgQueueRef = useRef<string[]>([]);

  // タイプライター
  useEffect(() => {
    if (messages.length === 0) return;
    const full = messages[0];
    if (displayedMsg === full) return;
    const t = setTimeout(() => {
      setDisplayedMsg(full.slice(0, displayedMsg.length + 1));
    }, 40);
    return () => clearTimeout(t);
  }, [messages, displayedMsg]);

  const pushMessages = useCallback((msgs: string[], nextPhase?: Phase) => {
    pendingPhaseRef.current = nextPhase ?? null;
    setMessages(msgs);
    setDisplayedMsg("");
    setPhase("message");
  }, []);

  function advanceMessage() {
    if (displayedMsg !== messages[0]) {
      // タイプ中は全文表示
      setDisplayedMsg(messages[0]);
      return;
    }
    if (messages.length > 1) {
      const [, ...rest] = messages;
      setMessages(rest);
      setDisplayedMsg("");
    } else {
      const next = pendingPhaseRef.current;
      setMessages([]);
      setDisplayedMsg("");
      if (next) setPhase(next);
    }
  }

  // 初期化
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/"); return; }

      // タスク完了数からレベルを取得
      const res = await fetch(process.env.NEXT_PUBLIC_STATS_API_URL!, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const stats = await res.json();
      const level = Math.floor(stats.totalPoints / 100) + 1;
      const job = (localStorage.getItem(JOB_KEY) ?? "warrior") as JobClass;
      const p = calcPlayerStats(level, job);
      const savedPotions = parseInt(localStorage.getItem(POTION_KEY) ?? "3", 10);
      const savedVictories = parseInt(localStorage.getItem(VICTORY_KEY) ?? "0", 10);
      const e = getRandomEnemy(level);

      setPlayer(p);
      setPlayerHp(p.maxHp);
      setPlayerMp(p.maxMp);
      setPotions(savedPotions);
      setVictories(savedVictories);
      setEnemy(e);
      setEnemyHp(e.maxHp);
      pushMessages([`${e.name}があらわれた！`], "select");
    }
    init();
  }, [router, pushMessages]);

  // キーボード操作
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (phase === "message") {
        if (["Enter", " ", "z", "Z"].includes(e.key)) advanceMessage();
        return;
      }
      if (phase === "select") {
        if (e.key === "ArrowUp")    setCmdIndex((i) => (i + 2) % 4);
        if (e.key === "ArrowDown")  setCmdIndex((i) => (i + 2) % 4);
        if (e.key === "ArrowLeft")  setCmdIndex((i) => (i % 2 === 0 ? i + 1 : i - 1));
        if (e.key === "ArrowRight") setCmdIndex((i) => (i % 2 === 0 ? i + 1 : i - 1));
        if (["Enter", " ", "z", "Z"].includes(e.key)) handleCommand(COMMANDS[cmdIndex].id);
      }
      if (["victory", "defeat", "ran"].includes(phase)) {
        if (["Enter", " "].includes(e.key)) router.push("/game");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function enemyTurn(currentPlayerHp: number) {
    if (!enemy || !player) return;
    const dmg = calcPhysicalDamage(enemy.attack, player.defense);
    const newHp = Math.max(0, currentPlayerHp - dmg);
    setPlayerHp(newHp);
    if (newHp <= 0) {
      pushMessages([`${enemy.name}のこうげき！`, `${dmg}のダメージを受けた！`, "…やられてしまった！"], "defeat");
    } else {
      pushMessages([`${enemy.name}のこうげき！`, `${dmg}のダメージを受けた！`], "select");
    }
  }

  function handleCommand(cmd: CommandId) {
    if (!enemy || !player) return;

    if (cmd === "attack") {
      const dmg = calcPhysicalDamage(player.attack, enemy.defense);
      const newEnemyHp = Math.max(0, enemyHp - dmg);
      setEnemyHp(newEnemyHp);
      setShakeEnemy(true);
      setTimeout(() => setShakeEnemy(false), 500);
      if (newEnemyHp <= 0) {
        const newVic = victories + 1;
        setVictories(newVic);
        localStorage.setItem(VICTORY_KEY, String(newVic));
        const newPotions = potions + 1;
        setPotions(newPotions);
        localStorage.setItem(POTION_KEY, String(newPotions));
        pushMessages(
          [`${player.jobClass === "warrior" ? "けん" : "こうげき"}で${dmg}のダメージ！`, `${enemy.name}をたおした！`, `ポーション1個てにいれた！`],
          "victory"
        );
      } else {
        pushMessages([`${dmg}のダメージ！`]);
        setTimeout(() => enemyTurn(playerHp), 1200);
      }
    }

    if (cmd === "magic") {
      const mpCost = player.jobClass === "mage" ? 8 : 12;
      if (playerMp < mpCost) {
        pushMessages(["MPがたりない！"], "select");
        return;
      }
      const dmg = calcMagicDamage(player.magic);
      const newMp = playerMp - mpCost;
      const newEnemyHp = Math.max(0, enemyHp - dmg);
      setPlayerMp(newMp);
      setEnemyHp(newEnemyHp);
      setShakeEnemy(true);
      setTimeout(() => setShakeEnemy(false), 500);
      if (newEnemyHp <= 0) {
        const newVic = victories + 1;
        setVictories(newVic);
        localStorage.setItem(VICTORY_KEY, String(newVic));
        const newPotions = potions + 1;
        setPotions(newPotions);
        localStorage.setItem(POTION_KEY, String(newPotions));
        pushMessages([`まほうで${dmg}のダメージ！`, `${enemy.name}をたおした！`, "ポーション1個てにいれた！"], "victory");
      } else {
        pushMessages([`まほうで${dmg}のダメージ！`]);
        setTimeout(() => enemyTurn(playerHp), 1200);
      }
    }

    if (cmd === "item") {
      if (potions <= 0) {
        pushMessages(["どうぐがない！"], "select");
        return;
      }
      const heal = Math.floor(player.maxHp * 0.4);
      const newHp = Math.min(player.maxHp, playerHp + heal);
      const newPotions = potions - 1;
      setPlayerHp(newHp);
      setPotions(newPotions);
      localStorage.setItem(POTION_KEY, String(newPotions));
      pushMessages([`ポーションをつかった！`, `HPが${heal}回復した！`]);
      setTimeout(() => enemyTurn(newHp), 1500);
    }

    if (cmd === "run") {
      if (Math.random() < 0.5) {
        pushMessages(["うまくにげられた！"], "ran");
      } else {
        pushMessages(["にげられなかった！"]);
        setTimeout(() => enemyTurn(playerHp), 1200);
      }
    }
  }

  if (!player || !enemy) {
    return <div className="flex min-h-screen items-center justify-center text-gray-400 font-mono">よみこみちゅう...</div>;
  }

  const jobLabel: Record<string, string> = { warrior: "戦士", mage: "魔法使い", cleric: "僧侶", rogue: "盗賊" };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-4 font-mono"
      onClick={() => {
        if (phase === "message") advanceMessage();
        if (["victory", "defeat", "ran"].includes(phase)) router.push("/game");
      }}
    >
      <div className="w-full max-w-md space-y-2">

        {/* 敵エリア */}
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-yellow-300">{enemy.name}</span>
            <span className="text-xs text-gray-400">HP</span>
          </div>
          <HpBar current={enemyHp} max={enemy.maxHp} color="bg-red-500" />
          <div className="flex justify-center mt-3">
            <EnemySprite shape={enemy.shape} color={enemy.color} shake={shakeEnemy} />
          </div>
        </div>

        {/* メッセージウィンドウ */}
        <div className="min-h-[72px] rounded-xl border border-gray-700 bg-gray-900 p-4 text-sm leading-7">
          {phase === "message" && (
            <p className="text-white">
              {displayedMsg}
              {displayedMsg === messages[0] && <span className="ml-1 animate-bounce inline-block text-yellow-400">▼</span>}
            </p>
          )}
          {phase === "victory" && <p className="text-yellow-300 font-bold">🎉 しょうり！　ポーションをてにいれた！</p>}
          {phase === "defeat"  && <p className="text-red-400 font-bold">💀 やられてしまった…</p>}
          {phase === "ran"     && <p className="text-gray-300">うまくにげられた！</p>}
          {["victory","defeat","ran"].includes(phase) && (
            <p className="text-xs text-gray-500 mt-1">[ Enterキーまたはクリックでもどる ]</p>
          )}
        </div>

        {/* コマンド選択 */}
        {phase === "select" && (
          <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
            <div className="grid grid-cols-2 gap-2">
              {COMMANDS.map((cmd, i) => (
                <button
                  key={cmd.id}
                  onClick={(e) => { e.stopPropagation(); handleCommand(cmd.id); }}
                  onMouseEnter={() => setCmdIndex(i)}
                  className={`rounded-lg py-2 text-sm font-bold transition-all ${
                    cmdIndex === i
                      ? "bg-yellow-400 text-gray-900"
                      : "bg-gray-800 text-white hover:bg-gray-700"
                  }`}
                >
                  {cmdIndex === i && "▶ "}{cmd.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* プレイヤーステータス */}
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-4 text-sm">
          <div className="flex justify-between mb-2">
            <span className="text-yellow-200 font-bold">Lv.{player.level} {jobLabel[player.jobClass]}</span>
            <span className="text-gray-400 text-xs">🧪 ポーション×{potions}　🏆 {victories}勝</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-6 text-green-400">HP</span>
              <HpBar current={playerHp} max={player.maxHp} color={playerHp < player.maxHp * 0.3 ? "bg-red-500" : "bg-green-500"} />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-6 text-blue-400">MP</span>
              <HpBar current={playerMp} max={player.maxMp} color="bg-blue-500" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
