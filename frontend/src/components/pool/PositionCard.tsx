"use client";
import { GlassCard } from "../ui/GlassCard";
import { GradientButton } from "../ui/GradientButton";
import { useAccount, useChainId } from "wagmi";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { usePoolPosition } from "@/hooks/usePoolPosition";
import { useDexWrite } from "@/hooks/useDexWrite";
import { formatEther } from "viem";
import { useState } from "react";
import { AnimatedNumber } from "../ui/AnimatedNumber";

export function PositionCard() {
  const chainId = useChainId();
  const { address } = useAccount();
  const { klpBalance, refetchAll } = useTokenBalances(chainId);
  const { userDNR, userKTUSD, userSharePct } = usePoolPosition(klpBalance);
  const { removeLiquidity } = useDexWrite();

  const [removing, setRemoving] = useState(false);

  if (klpBalance === BigInt(0)) return null;

  const onRemoveLiquidity = async () => {
    if (!address) return;
    setRemoving(true);
    try {
      await removeLiquidity(klpBalance, BigInt(0), BigInt(0), address);
      refetchAll();
    } catch (e) {
      console.error(e);
    }
    setRemoving(false);
  };

  return (
    <GlassCard className="w-full max-w-[480px] p-6 border-[#00d4ff]/20">
      <h2 className="text-lg font-bold mb-4 text-[#00d4ff]">Your Position</h2>
      
      <div className="space-y-4 font-mono">
        <div className="flex justify-between items-center bg-[#161b24] p-3 rounded-lg">
          <span className="text-sm text-gray-400 font-sans">KLP Balance</span>
          <span className="font-bold"><AnimatedNumber value={Number(formatEther(klpBalance))} /></span>
        </div>
        
        <div className="flex justify-between items-center bg-[#161b24] p-3 rounded-lg">
          <span className="text-sm text-gray-400 font-sans">Pool Share</span>
          <span className="text-[#8b5cf6] font-bold"><AnimatedNumber value={userSharePct} suffix="%" /></span>
        </div>

        <div className="flex justify-between items-center bg-[#161b24] p-3 rounded-lg">
          <span className="text-sm text-gray-400 font-sans">DNR Earned</span>
          <span><AnimatedNumber value={Number(formatEther(userDNR))} /></span>
        </div>

        <div className="flex justify-between items-center bg-[#161b24] p-3 rounded-lg">
          <span className="text-sm text-gray-400 font-sans">ktUSD Earned</span>
          <span><AnimatedNumber value={Number(formatEther(userKTUSD))} /></span>
        </div>
      </div>

      <GradientButton 
        onClick={onRemoveLiquidity} 
        loading={removing} 
        className="mt-6 !from-red-500 !to-red-600 hover:!from-red-400 hover:!to-red-500"
      >
        Remove All Liquidity
      </GradientButton>
    </GlassCard>
  );
}
