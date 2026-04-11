"use client";
import { useState } from "react";
import { GlassCard } from "../ui/GlassCard";
import { GradientButton } from "../ui/GradientButton";
import { TokenInput } from "../swap/TokenInput";
import { useAccount, useChainId } from "wagmi";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { useDexWrite } from "@/hooks/useDexWrite";
import { formatEther, parseEther } from "viem";

export function PoolCard() {
  const [amountDNR, setAmountDNR] = useState("");
  const [amountKTUSD, setAmountKTUSD] = useState("");
  const chainId = useChainId();
  const { address } = useAccount();

  const { dnrBalance, ktUSDBalance, refetchAll } = useTokenBalances(chainId);
  const { addLiquidity } = useDexWrite();

  const [adding, setAdding] = useState(false);

  const formattedDNR = formatEther(dnrBalance);
  const formattedKTUSD = formatEther(ktUSDBalance);

  const hasInsufficientDNR = Number(amountDNR) > Number(formattedDNR);
  const hasInsufficientKTUSD = Number(amountKTUSD) > Number(formattedKTUSD);

  const onAddLiquidity = async () => {
    if (!address) return;
    setAdding(true);
    try {
      const minDNR = BigInt(0);
      const minKTUSD = BigInt(0);
      await addLiquidity(
        parseEther(amountKTUSD),
        minKTUSD,
        minDNR,
        address,
        parseEther(amountDNR)
      );
      refetchAll();
      setAmountDNR("");
      setAmountKTUSD("");
    } catch (e) {
      console.error(e);
    }
    setAdding(false);
  };

  return (
    <GlassCard className="w-full max-w-[480px] p-2 border-[#0d1117] shadow-[0_0_15px_rgba(139,92,246,0.1)]">
      <div className="p-4 mb-2">
        <h2 className="text-xl font-bold">Add Liquidity</h2>
        <p className="text-sm text-gray-400">Receive KLP tokens</p>
      </div>

      <div className="flex flex-col gap-2 relative px-2">
        <TokenInput
          value={amountDNR}
          onChange={setAmountDNR}
          symbol="DNR"
          balance={Number(formattedDNR).toFixed(4)}
          onMax={() => setAmountDNR(Number(formattedDNR).toFixed(6))}
          error={hasInsufficientDNR}
        />
        
        <div className="flex justify-center text-gray-500 my-1">+</div>

        <TokenInput
          value={amountKTUSD}
          onChange={setAmountKTUSD}
          symbol="ktUSD"
          balance={Number(formattedKTUSD).toFixed(4)}
          onMax={() => setAmountKTUSD(Number(formattedKTUSD).toFixed(6))}
          error={hasInsufficientKTUSD}
        />
      </div>

      <div className="mt-6 p-4">
        {!address ? (
          <GradientButton disabled>Connect Wallet</GradientButton>
        ) : hasInsufficientDNR || hasInsufficientKTUSD ? (
          <GradientButton disabled className="!from-red-500/50 !to-red-600/50 text-red-100">
            Insufficient Balance
          </GradientButton>
        ) : (
          <GradientButton 
            onClick={onAddLiquidity} 
            loading={adding} 
            disabled={!amountDNR || !amountKTUSD || Number(amountDNR) <= 0 || Number(amountKTUSD) <= 0}
          >
            Add Liquidity
          </GradientButton>
        )}
      </div>
    </GlassCard>
  );
}
