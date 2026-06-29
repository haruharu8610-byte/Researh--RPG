"use client";

import { useEffect, useRef } from "react";

export type JobClass = "warrior" | "mage" | "cleric" | "rogue";

export function themeToJobClass(theme: string | null): JobClass {
  if (!theme) return "warrior";
  const t = theme.toLowerCase();
  if (t.includes("生物") || t.includes("医") || t.includes("health") || t.includes("bio")) return "cleric";
  if (t.includes("数") || t.includes("物理") || t.includes("math") || t.includes("phys")) return "mage";
  if (t.includes("情報") || t.includes("プログラム") || t.includes("comp") || t.includes("cs")) return "rogue";
  return "warrior";
}

const JOB_LABEL: Record<JobClass, string> = {
  warrior: "戦士",
  mage:    "魔法使い",
  cleric:  "僧侶",
  rogue:   "盗賊",
};

// ── 装備ビジュアル定義 ──────────────────────────────────────────

/** 武器IDから (武器色メイン, 武器色アクセント) を返す */
export function weaponColors(weaponId: string | null): [string, string] {
  switch (weaponId) {
    case "wooden_sword":   return ["#a16207", "#78350f"];
    case "bronze_knife":   return ["#d97706", "#92400e"];
    case "iron_sword":     return ["#9ca3af", "#6b7280"];
    case "battle_axe":     return ["#6b7280", "#374151"];
    case "steel_sword":    return ["#e5e7eb", "#9ca3af"];
    case "wind_spear":     return ["#bae6fd", "#7dd3fc"];
    case "magic_staff":    return ["#a78bfa", "#7c3aed"];
    case "holy_staff":     return ["#fde68a", "#f59e0b"];
    case "thunder_blade":  return ["#fbbf24", "#d97706"];
    case "dark_blade":     return ["#374151", "#1e293b"];
    case "dragon_sword":   return ["#dc2626", "#991b1b"];
    case "sage_staff":     return ["#d1fae5", "#6ee7b7"];
    case "craft_wind_staff":    return ["#bae6fd", "#38bdf8"];
    case "craft_dragon_fang":   return ["#dc2626", "#7f1d1d"];
    case "craft_chaos_blade":   return ["#a78bfa", "#4c1d95"];
    case "craft_legend_sword":  return ["#fbbf24", "#d97706"];
    case "craft_bone_blade":    return ["#e5e7eb", "#9ca3af"];
    case "craft_wolf_claw":     return ["#d1d5db", "#6b7280"];
    case "craft_dark_staff":    return ["#1e293b", "#374151"];
    case "craft_angel_sword":   return ["#fef9c3", "#fde68a"];
    default:               return ["#92400e", "#78350f"]; // 素手
  }
}

/** 防具IDから (体色メイン, 体色シャドウ) を返す */
export function armorColors(armorId: string | null, jobClass: JobClass): [string, string] {
  switch (armorId) {
    case "cloth_robe":     return ["#e5e7eb", "#9ca3af"];
    case "leather_armor":  return ["#a16207", "#78350f"];
    case "bronze_shield":  return ["#d97706", "#92400e"];
    case "chain_mail":     return ["#6b7280", "#374151"];
    case "wind_cloak":     return ["#0ea5e9", "#0369a1"];
    case "iron_armor":     return ["#4b5563", "#1f2937"];
    case "magic_robe":     return ["#7c3aed", "#4c1d95"];
    case "mystic_robe":    return ["#4c1d95", "#2e1065"];
    case "silver_armor":   return ["#cbd5e1", "#94a3b8"];
    case "dragon_armor":   return ["#991b1b", "#7f1d1d"];
    case "sage_robe":      return ["#d97706", "#92400e"];
    case "craft_shell_armor":    return ["#d97706", "#92400e"];
    case "craft_golem_shield":   return ["#374151", "#1f2937"];
    case "craft_resist_robe":    return ["#4c1d95", "#2e1065"];
    case "craft_legend_armor":   return ["#b45309", "#78350f"];
    case "craft_ghost_cloak":    return ["#6d28d9", "#4c1d95"];
    case "craft_angel_robe":     return ["#fef3c7", "#fde68a"];
    default: {
      // 職業デフォルト
      const defaults: Record<JobClass, [string, string]> = {
        warrior: ["#dc2626", "#991b1b"],
        mage:    ["#7c3aed", "#4c1d95"],
        cleric:  ["#f0fdf4", "#d1fae5"],
        rogue:   ["#166534", "#14532d"],
      };
      return defaults[jobClass];
    }
  }
}

// ── ピクセルスプライト定義（B=体色, b=体影, W=武器色, w=武器アクセント） ──

type PixelDef = Record<string, string>;
type SpriteData = { grid: string[]; colors: PixelDef };

function makeSprite(jobClass: JobClass, weaponId: string | null, armorId: string | null): SpriteData {
  const [W, w] = weaponColors(weaponId);
  const [B, b] = armorColors(armorId, jobClass);

  const bases: Record<JobClass, SpriteData> = {
    warrior: {
      grid: [
        "................",
        "......KGGGK.....",
        ".....KGGGGGK....",
        ".....KGssssK....",
        ".....KGsEEsK....",
        ".....KGssssK....",
        "......KGGGK.....",
        "...WWBBBBBBbK...",
        "...WWBBBBBBbK...",
        "...WWBBBBBBbK...",
        "....WBBBBBBbK...",
        "....KBBLLLLbK...",
        ".....KLLkLLK....",
        ".....KLLkLLK....",
        ".....KTTkTTK....",
        "......KKkKK.....",
        "..W.............",
        "..w.............",
        "................",
        "................",
      ],
      colors: { K:"#1e293b", G:"#9ca3af", s:"#fcd9b0", E:"#1e293b", B, b, W, w, L:"#1d4ed8", k:"#1e3a8a", T:"#78350f" },
    },
    mage: {
      grid: [
        "......PPP.......",
        ".....PPPPP......",
        "....PPPPPPP.....",
        ".....PssssP.....",
        ".....PsEEsP.....",
        ".....PssssP.....",
        "....PPPPPPPP....",
        "W...BBBBBBBbK...",
        "W...BBBBBBBbK...",
        "W...BBBBBBBbK...",
        "W...BBBBBBBbK...",
        "W....BBBBBBb....",
        ".....BBBkBBb....",
        ".....BBBkBBb....",
        "w....TTTkTTT....",
        "W.....KKkKK.....",
        "W...............",
        "W...............",
        "w...............",
        "................",
      ],
      colors: { K:"#1e293b", P:"#4c1d95", s:"#fcd9b0", E:"#1e293b", B, b, W, w, k:"#2e1065", T:"#78350f" },
    },
    cleric: {
      grid: [
        "................",
        ".....YYYYYYY....",
        "....YYYYYYYYY...",
        "....YYssssYYY...",
        "....YYsEEsYYY...",
        "....YYssssYYY...",
        ".....YYYYYYY....",
        "...W.BBBBBBbK...",
        "...WWBBBBBBbK...",
        "...W.BBBBBBbK...",
        "....WBBBBBBbK...",
        ".....BBBkBBb....",
        ".....BBBkBBb....",
        ".....BBBkBBb....",
        "w....TTTkTTT....",
        "W.....KKkKK.....",
        "W...............",
        "W...............",
        "wWw.............",
        "................",
      ],
      colors: { K:"#1e293b", Y:"#fef9c3", s:"#fcd9b0", E:"#1e293b", B, b, W, w, k:"#4b5563", T:"#78350f" },
    },
    rogue: {
      grid: [
        "................",
        ".....DDDDD......",
        "....DDDDDDD.....",
        "....DDssssD.....",
        "....DDsEEsD.....",
        "....DDssssD.....",
        ".....DDDDD......",
        "..WwBBBBBBBb....",
        "..WwBBBBBBBb....",
        "..WwBBBBBBBb....",
        "...BBBBBBBBb....",
        "....BBBkBBb..Ww.",
        "....BBBkBBb..Ww.",
        "....BBBkBBb.....",
        "....TTTkTTT.....",
        ".....KKkKK......",
        "..W.............",
        "..w.............",
        "................",
        "................",
      ],
      colors: { K:"#1e293b", D:"#374151", s:"#fcd9b0", E:"#1e293b", B, b, W, w, k:"#14532d", T:"#78350f" },
    },
  };
  return bases[jobClass];
}

function renderSprite(ctx: CanvasRenderingContext2D, sprite: SpriteData, scale = 4) {
  ctx.clearRect(0, 0, 64, 80);
  const { grid, colors } = sprite;
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const ch = grid[row][col];
      if (ch === "." || !colors[ch]) continue;
      ctx.fillStyle = colors[ch];
      ctx.fillRect(col * scale, row * scale, scale, scale);
    }
  }
}

// ── コンポーネント ──────────────────────────────────────────────

type Props = {
  level: number;
  jobClass: JobClass;
  weaponId?: string | null;
  armorId?: string | null;
};

export default function GameCanvas({ level, jobClass, weaponId = null, armorId = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const sprite = makeSprite(jobClass, weaponId ?? null, armorId ?? null);
    let t = 0;

    function draw() {
      t += 0.04;
      const bob = Math.sin(t) * 3;
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      ctx!.fillStyle = "#374151";
      ctx!.fillRect(0, canvas!.height - 16, canvas!.width, 4);

      ctx!.fillStyle = "rgba(0,0,0,0.25)";
      ctx!.beginPath();
      ctx!.ellipse(canvas!.width / 2, canvas!.height - 14, 28, 6, 0, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.save();
      ctx!.translate(
        Math.floor((canvas!.width - 64) / 2),
        Math.floor(canvas!.height - 80 - 14 + bob)
      );
      renderSprite(ctx!, sprite);
      ctx!.restore();

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [jobClass, weaponId, armorId]);

  const label = JOB_LABEL[jobClass];
  const aura  = level >= 10 ? "shadow-[0_0_18px_4px_rgba(251,191,36,0.45)]" : "";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`rounded-xl overflow-hidden bg-gray-900 border border-gray-700 ${aura}`}>
        <div className="flex items-center justify-center gap-2 px-4 pt-2 pb-1">
          <span className="text-yellow-300 font-bold text-sm font-mono">Lv.{level}</span>
          <span className="text-gray-300 text-sm">{label}</span>
          {level >= 10 && <span className="text-xs text-yellow-400 animate-pulse">✨</span>}
        </div>
        <canvas
          ref={canvasRef}
          width={160}
          height={120}
          style={{ imageRendering: "pixelated", display: "block" }}
        />
      </div>
    </div>
  );
}
