"use client";

import { type JobClass } from "./GameCanvas";

const JOBS: { id: JobClass; label: string; emoji: string; desc: string }[] = [
  { id: "warrior", label: "戦士",    emoji: "⚔️",  desc: "力と剣で切り拓く" },
  { id: "mage",    label: "魔法使い", emoji: "🔮",  desc: "知識と魔法を操る" },
  { id: "cleric",  label: "僧侶",    emoji: "✨",  desc: "癒しと光の使い手" },
  { id: "rogue",   label: "盗賊",    emoji: "🗡️",  desc: "素早さと知略で勝つ" },
];

type Props = {
  current: JobClass;
  onChange: (j: JobClass) => void;
};

export default function JobClassSelector({ current, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {JOBS.map((job) => (
        <button
          key={job.id}
          onClick={() => onChange(job.id)}
          className={`rounded-xl border p-3 text-left transition-all ${
            current === job.id
              ? "border-indigo-500 bg-indigo-950"
              : "border-gray-700 bg-gray-900 hover:border-gray-500"
          }`}
        >
          <div className="text-xl">{job.emoji}</div>
          <div className="mt-1 text-sm font-semibold">{job.label}</div>
          <div className="text-xs text-gray-400">{job.desc}</div>
        </button>
      ))}
    </div>
  );
}
