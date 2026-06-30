"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BattleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error("battle page crashed:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-6 text-center font-mono">
      <div className="text-4xl mb-3">💥</div>
      <h1 className="text-base font-bold text-red-400 mb-2">バトル中にエラーが発生しました</h1>
      <p className="text-xs text-gray-400 mb-1 max-w-sm break-words">{error.message || "不明なエラー"}</p>
      {error.digest && <p className="text-[10px] text-gray-600 mb-4">digest: {error.digest}</p>}
      <div className="flex gap-3 mt-4">
        <button
          onClick={() => reset()}
          className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
        >
          やり直す
        </button>
        <button
          onClick={() => router.push("/game")}
          className="rounded-lg border border-indigo-600 bg-indigo-950 px-4 py-2 text-sm font-bold text-indigo-300 hover:bg-indigo-900"
        >
          ホームにもどる
        </button>
      </div>
    </div>
  );
}
