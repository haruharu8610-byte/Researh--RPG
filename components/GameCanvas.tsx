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

type PixelDef = Record<string, string>;
type SpriteData = { grid: string[]; colors: PixelDef };

// 16×20 グリッド、4px/ピクセル → 64×80 キャンバス
const PLAYER_SPRITES: Record<JobClass, SpriteData> = {
  warrior: {
    grid: [
      "................",  // 0
      "......KGGGK.....",  // 1  兜
      ".....KGGGGGK....",  // 2
      ".....KGssssK....",  // 3  顔
      ".....KGsEEsK....",  // 4  目
      ".....KGssssK....",  // 5
      "......KGGGK.....",  // 6
      "...WWRRRRRRRR...",  // 7  体（W=剣柄）
      "...WWRRRRRRRR...",  // 8
      "...WWRRRRRRRR...",  // 9
      "....WRRRRRRR....",  // 10
      "....KRRLLLLK....",  // 11 腰
      ".....KLLkLLK....",  // 12 足
      ".....KLLkLLK....",  // 13
      ".....KTTkTTK....",  // 14 ブーツ
      "......KKkKK.....",  // 15
      "................",  // 16
      "..W.............",  // 17 剣先
      "..W.............",  // 18
      "................",  // 19
    ],
    colors: {
      K: "#374151", G: "#9ca3af", s: "#fcd9b0", E: "#1e293b",
      R: "#dc2626", W: "#e5e7eb", L: "#1d4ed8", T: "#78350f",
      k: "#1e3a8a",
    },
  },

  mage: {
    grid: [
      "......PPP.......",  // 0  帽子先端
      ".....PPPPP......",  // 1
      "....PPPPPPP.....",  // 2
      ".....PsssssP....",  // 3  顔
      ".....PsEEssP....",  // 4  目
      ".....PssssP.....",  // 5
      "....PPPPPPPP....",  // 6  帽つば
      "S...MMMMMMMMM...",  // 7  体（S=杖）
      "S...MMMMMMMMM...",  // 8
      "S...MMMMMMMMM...",  // 9
      "S...MMMMMMMMM...",  // 10
      "S....MMMMMMM....",  // 11
      "S....MMMkMMM....",  // 12 足
      "S....MMMkMMM....",  // 13
      "O....DTTkTTD....",  // 14 ブーツ
      "S.....KKkKK.....",  // 15
      "S...............",  // 16 杖
      "S...............",  // 17
      "O...............",  // 18 杖先（宝珠）
      "................",  // 19
    ],
    colors: {
      P: "#4c1d95", s: "#fcd9b0", E: "#1e293b",
      M: "#7c3aed", k: "#2e1065",
      S: "#d1d5db", O: "#a78bfa",
      D: "#374151", T: "#78350f", K: "#1e293b",
    },
  },

  cleric: {
    grid: [
      "................",  // 0
      ".....YYYYYY.....",  // 1  頭巾
      "....YYYYYYYYH...",  // 2
      "....YYssssYYH...",  // 3  顔
      "....YYsEEsYYH...",  // 4  目
      "....YYssssYYH...",  // 5
      ".....YYYYYYY....",  // 6
      "...CWWWWWWWWW...",  // 7  体（C=十字架）
      "...CWWWWWWWWW...",  // 8
      "...CCWWWWWWWW...",  // 9  十字横棒
      "....CWWWWWWW....",  // 10
      ".....WLLLLLL....",  // 11
      ".....WLLkLLL....",  // 12 足
      ".....WLLkLLL....",  // 13
      ".....TTTkTTT....",  // 14 ブーツ
      "......KKkKKK....",  // 15
      "....C...........",  // 16 杖延長
      "....C...........",  // 17
      "...CCC..........",  // 18 杖頭（十字）
      "................",  // 19
    ],
    colors: {
      Y: "#fef9c3", H: "#fde68a", s: "#fcd9b0", E: "#1e293b",
      W: "#f0fdf4", C: "#f59e0b", L: "#d1fae5",
      T: "#78350f", K: "#374151", k: "#4b5563",
    },
  },

  rogue: {
    grid: [
      "................",  // 0
      ".....DDDDD......",  // 1  フード
      "....DDDDDDD.....",  // 2
      "....DDssssD.....",  // 3  顔
      "....DDsEEsD.....",  // 4  目（鋭い）
      "....DDssssD.....",  // 5
      ".....DDDDD......",  // 6
      "..d.NNNNNNNNN...",  // 7  体（d=ダガー）
      "..d.NNNNNNNNN...",  // 8
      "..D.NNNNNNNNN...",  // 9
      "...NNNNNNNNN....",  // 10
      "....NNNkNNNN....",  // 11
      "....NNNkNNN..d..",  // 12 足（右にもダガー）
      "....NNNkNNN..d..",  // 13
      "....TTTkTTT..D..",  // 14 ブーツ
      ".....KKkKKK.....",  // 15
      "..d.............",  // 16
      "..D.............",  // 17
      "................",  // 18
      "................",  // 19
    ],
    colors: {
      D: "#374151", s: "#fcd9b0", E: "#1e293b",
      N: "#166534", k: "#14532d", d: "#9ca3af",
      T: "#78350f", K: "#1e293b",
    },
  },
};

function renderPlayerSprite(
  ctx: CanvasRenderingContext2D,
  sprite: SpriteData,
  scale = 4
) {
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

type Props = { level: number; jobClass: JobClass };

export default function GameCanvas({ level, jobClass }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offsetRef = useRef(0);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const sprite = PLAYER_SPRITES[jobClass];
    let t = 0;

    function draw() {
      t += 0.04;
      const bob = Math.sin(t) * 3; // 上下に揺れる
      offsetRef.current = bob;

      // 背景（グラデーション風）
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      // 地面
      ctx!.fillStyle = "#374151";
      ctx!.fillRect(0, canvas!.height - 16, canvas!.width, 4);

      // 影
      ctx!.fillStyle = "rgba(0,0,0,0.25)";
      ctx!.beginPath();
      ctx!.ellipse(canvas!.width / 2, canvas!.height - 14, 28, 6, 0, 0, Math.PI * 2);
      ctx!.fill();

      // スプライト（bob分オフセット）
      ctx!.save();
      ctx!.translate(
        Math.floor((canvas!.width - 64) / 2),
        Math.floor(canvas!.height - 80 - 14 + bob)
      );
      renderPlayerSprite(ctx!, sprite);
      ctx!.restore();

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [jobClass]);

  const label = JOB_LABEL[jobClass];

  // Lv10以上は金色オーラ演出（CSS）
  const aura = level >= 10 ? "shadow-[0_0_18px_4px_rgba(251,191,36,0.45)]" : "";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`rounded-xl overflow-hidden bg-gray-900 border border-gray-700 ${aura}`}>
        {/* 名前バー */}
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
