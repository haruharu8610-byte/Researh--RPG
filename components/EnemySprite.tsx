"use client";

import { useEffect, useRef } from "react";
import type { EnemyShape } from "@/lib/battle";

type Props = { shape: EnemyShape; color: number; shake?: boolean };

function hexToRgb(hex: number) {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8)  & 0xff;
  const b =  hex        & 0xff;
  return `rgb(${r},${g},${b})`;
}

function drawEnemy(ctx: CanvasRenderingContext2D, shape: EnemyShape, color: string) {
  ctx.clearRect(0, 0, 200, 180);
  ctx.fillStyle = color;

  if (shape === "slime") {
    // 体（楕円ぽい blob）
    ctx.beginPath();
    ctx.ellipse(100, 110, 55, 45, 0, 0, Math.PI * 2);
    ctx.fill();
    // 目
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.ellipse(85, 100, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(115, 100, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.ellipse(88, 97, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(118, 97, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
  }

  if (shape === "bat") {
    // 羽左
    ctx.beginPath();
    ctx.moveTo(100, 100); ctx.bezierCurveTo(60, 60, 20, 50, 30, 110);
    ctx.bezierCurveTo(50, 120, 80, 115, 100, 100); ctx.fill();
    // 羽右
    ctx.beginPath();
    ctx.moveTo(100, 100); ctx.bezierCurveTo(140, 60, 180, 50, 170, 110);
    ctx.bezierCurveTo(150, 120, 120, 115, 100, 100); ctx.fill();
    // 体
    ctx.beginPath(); ctx.ellipse(100, 105, 22, 28, 0, 0, Math.PI * 2); ctx.fill();
    // 目
    ctx.fillStyle = "#ff0";
    ctx.beginPath(); ctx.ellipse(91, 98, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(109, 98, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.ellipse(92, 99, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(110, 99, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
  }

  if (shape === "scorpion") {
    // 胴体
    ctx.beginPath(); ctx.ellipse(100, 110, 30, 22, 0, 0, Math.PI * 2); ctx.fill();
    // 頭
    ctx.beginPath(); ctx.ellipse(100, 82, 20, 18, 0, 0, Math.PI * 2); ctx.fill();
    // ハサミ左
    ctx.fillRect(52, 88, 30, 10);
    ctx.beginPath(); ctx.ellipse(52, 88, 12, 9, -0.4, 0, Math.PI * 2); ctx.fill();
    // ハサミ右
    ctx.fillRect(118, 88, 30, 10);
    ctx.beginPath(); ctx.ellipse(148, 88, 12, 9, 0.4, 0, Math.PI * 2); ctx.fill();
    // 尻尾（曲線）
    ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(100, 132); ctx.bezierCurveTo(130, 145, 150, 120, 140, 90);
    ctx.stroke();
    // 毒針
    ctx.fillStyle = "#ef4444";
    ctx.beginPath(); ctx.arc(140, 86, 6, 0, Math.PI * 2); ctx.fill();
    // 目
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.ellipse(92, 78, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(108, 78, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
  }

  if (shape === "golem") {
    // 胴体
    ctx.fillRect(70, 85, 60, 60);
    // 頭
    ctx.fillRect(72, 52, 56, 48);
    // 腕左
    ctx.fillRect(44, 90, 26, 40);
    // 腕右
    ctx.fillRect(130, 90, 26, 40);
    // 足
    ctx.fillRect(74, 145, 20, 20);
    ctx.fillRect(106, 145, 20, 20);
    // 目（光る）
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(80, 64, 14, 14);
    ctx.fillRect(106, 64, 14, 14);
    // クラック（亀裂）
    ctx.strokeStyle = "#374151"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(97, 90); ctx.lineTo(103, 115); ctx.stroke();
  }

  if (shape === "dragon") {
    // 翼左
    ctx.beginPath();
    ctx.moveTo(90, 90); ctx.bezierCurveTo(50, 50, 15, 60, 25, 115);
    ctx.bezierCurveTo(45, 130, 75, 115, 90, 90); ctx.fill();
    // 翼右
    ctx.beginPath();
    ctx.moveTo(110, 90); ctx.bezierCurveTo(150, 50, 185, 60, 175, 115);
    ctx.bezierCurveTo(155, 130, 125, 115, 110, 90); ctx.fill();
    // 体
    ctx.beginPath(); ctx.ellipse(100, 115, 32, 38, 0, 0, Math.PI * 2); ctx.fill();
    // 首・頭
    ctx.beginPath(); ctx.ellipse(100, 72, 20, 22, 0, 0, Math.PI * 2); ctx.fill();
    // 角
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath(); ctx.moveTo(90, 55); ctx.lineTo(84, 35); ctx.lineTo(96, 52); ctx.fill();
    ctx.beginPath(); ctx.moveTo(110, 55); ctx.lineTo(116, 35); ctx.lineTo(104, 52); ctx.fill();
    // 目
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath(); ctx.ellipse(91, 68, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(109, 68, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.ellipse(92, 69, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(110, 69, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
    // 炎
    ctx.fillStyle = "#f97316";
    ctx.beginPath(); ctx.moveTo(85, 84); ctx.bezierCurveTo(75, 100, 65, 95, 70, 110); ctx.bezierCurveTo(78, 108, 82, 100, 88, 90); ctx.fill();
  }
}

export default function EnemySprite({ shape, color, shake }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawEnemy(ctx, shape, hexToRgb(color));
  }, [shape, color]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={180}
      className={`${shake ? "animate-bounce" : ""}`}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
