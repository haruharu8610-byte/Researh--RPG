"use client";

import { useEffect, useRef } from "react";
import type { EnemyShape } from "@/lib/battle";

// 1文字 = 1ピクセル (4px×4px で64x64キャンバス → 128x128表示)
type PixelDef = Record<string, string>;
type SpriteData = { grid: string[]; colors: PixelDef };

const SPRITES: Record<EnemyShape, SpriteData> = {
  slime: {
    grid: [
      "................",
      "................",
      "......DDDD......",
      ".....DBBBBBD....",
      "....DBBBBBBBDD..",
      "....DBBBBBBBD...",
      "....DBBwwBBwBD..",
      "....DBBwpBBwpD..",
      "....DBBBBBBBBD..",
      "....DBBBBBBBD...",
      ".....DBBBBBBD...",
      "......DDDDDD....",
      "................",
      "................",
      "................",
      "................",
    ],
    colors: { D: "#1e3a8a", B: "#3b82f6", w: "#ffffff", p: "#1e293b" },
  },
  bat: {
    grid: [
      "................",
      "..DD......DD....",
      ".DBBD....DBBD...",
      "DBBBD....DBBBD..",
      "DBBBDBBBDBBBD...",
      ".DBBBBBBBBBD....",
      "..DBBBBBBBD.....",
      "...DBwwBwwBD....",
      "...DBwpBwpBD....",
      "...DBBBBBBD.....",
      "....DBBBBBD.....",
      ".....DDDDD......",
      "................",
      "................",
      "................",
      "................",
    ],
    colors: { D: "#4c1d95", B: "#7c3aed", w: "#fbbf24", p: "#1e293b" },
  },
  scorpion: {
    grid: [
      "................",
      "..DD........DD..",
      ".DCCDD....DDCCD.",
      "DCCCCD....DCCCCD",
      ".DDDDD....DDDDD.",
      "...DBBBBBBBD....",
      "..DBBBBBBBBBD...",
      "..DBwwBBBwwBD...",
      "..DBwpBBBwpBD...",
      "..DBBBBBBBBBD...",
      "...DBBBBBBBBD...",
      "......DBBBD.....",
      ".......DBBD.....",
      "........DBD.....",
      ".........DR.....",
      "................",
    ],
    colors: { D: "#92400e", B: "#d97706", C: "#78350f", w: "#ffffff", p: "#1e293b", R: "#ef4444" },
  },
  golem: {
    grid: [
      "................",
      "....DDDDDDDD....",
      "...DGGGGGGGGD...",
      "...DGyyGGyyGD...",
      "...DGyyGGyyGD...",
      "...DGGGGGGGGD...",
      "..DDGGGGGGGGDD..",
      ".DGGGGGGGGGGGGD.",
      ".DGGGGGGGGGGGGD.",
      ".DGGGGGGGGGGGGD.",
      "..DDGGGGGGDDDD..",
      "...DGGGGD.......",
      "...DGGGGD.......",
      "....DDDD........",
      "................",
      "................",
    ],
    colors: { D: "#374151", G: "#6b7280", y: "#fbbf24" },
  },
  dragon: {
    grid: [
      "...DD.....DD....",
      "..DRRDD.DDRD....",
      ".DRRRRDDDRRD....",
      "..DDDRRRRDDDD...",
      "....DRRRRRRD....",
      "DDDDRRRRRRRRDDD.",
      "DRRRRRRRRRRRRRD.",
      "DRRRRRRRRRRRRRD.",
      ".DRRRRwwRwwRRD..",
      "..DRRRwpRwpRD...",
      "...DRRRRRRRD....",
      "....DRRRRRRD....",
      ".....DRRRRDD....",
      "......DRRRD.....",
      ".......DYYY.....",
      "................",
    ],
    colors: { D: "#991b1b", R: "#dc2626", w: "#fbbf24", p: "#1e293b", Y: "#f97316" },
  },
};

function renderSprite(
  ctx: CanvasRenderingContext2D,
  sprite: SpriteData,
  baseColor: number,
  scale: number = 4
) {
  ctx.clearRect(0, 0, 64, 64);
  const { grid, colors } = sprite;

  // baseColorをhex文字列に変換してBとして使える上書き
  const r = (baseColor >> 16) & 0xff;
  const g = (baseColor >> 8) & 0xff;
  const b = baseColor & 0xff;
  const resolvedColors: PixelDef = { ...colors, B: `rgb(${r},${g},${b})` };

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const ch = grid[row][col];
      if (ch === "." || !resolvedColors[ch]) continue;
      ctx.fillStyle = resolvedColors[ch];
      ctx.fillRect(col * scale, row * scale, scale, scale);
    }
  }
}

type Props = { shape: EnemyShape; color: number; damaged?: boolean; size?: number };

export default function EnemySprite({ shape, color, damaged = false, size = 128 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const sprite = SPRITES[shape];
    renderSprite(ctx, sprite, color);
  }, [shape, color]);

  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={64}
      className={`transition-opacity ${damaged ? "opacity-30" : "opacity-100"}`}
      style={{
        width: size, height: size,
        imageRendering: "pixelated",
      }}
    />
  );
}
