"use client";

import { useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4 pt-20">
      <GlassCard className="max-w-md w-full p-8 text-center border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Platform Error</h2>
        <p className="text-sm text-gray-400 mb-6 break-words">
          {error.message || "Something went wrong while rendering this section."}
        </p>
        <GradientButton onClick={() => reset()} className="!from-red-500 !to-red-600 hover:!from-red-400 hover:!to-red-500">
          Try Again
        </GradientButton>
      </GlassCard>
    </div>
  );
}
