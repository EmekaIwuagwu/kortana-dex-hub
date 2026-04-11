"use client";
import { useState } from "react";
import { GlassCard } from "../ui/GlassCard";
import { GradientButton } from "../ui/GradientButton";
import { TokenInput } from "../swap/TokenInput";
import { useAccount, useChainId } from "wagmi";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { useDexWrite } from "@/hooks/useDexWrite";
import { formatEther, parseEther } from "viem";

export function MintCard() {
  const [collateralAmount, setCollateralAmount] = useState("");
  // ktUSD 1:1 DNR simplified for now
  const mintAmount = collateralAmount;

  const chainId = useChainId();
  const { address } = useAccount();

  const { dnrBalance, ktUSDBalance, refetchAll } = useTokenBalances(chainId);
  const { mintCollateralized } = useDexWrite();

  const [minting, setMinting] = useState(false);

  const formattedDNR = formatEther(dnrBalance);
  const formattedKTUSD = formatEther(ktUSDBalance);
  const hasInsufficientDNR = Number(collateralAmount) > Number(formattedDNR);

  const onMint = async () => {
    if (!address) return;
    setMinting(true);
    try {
      await mintCollateralized(parseEther(mintAmount), address, parseEther(collateralAmount));
      refetchAll();
      setCollateralAmount("");
    } catch (e) {
      console.error(e);
    }
    setMinting(false);
  };

  return (
    <GlassCard className="w-full max-w-[480px] mx-auto p-2 border-[#10b981]/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
      <div className="p-4 mb-2">
        <h2 className="text-xl font-bold">Mint ktUSD</h2>
        <p className="text-sm text-gray-400">Lock DNR as collateral to mint ktUSD</p>
      </div>

      <div className="flex flex-col gap-4 relative px-2">
        <div>
          <label className="text-sm text-gray-400 mb-2 block px-2">Collateral Amount (DNR)</label>
          <TokenInput
            value={collateralAmount}
            onChange={setCollateralAmount}
            symbol="DNR"
            balance={Number(formattedDNR).toFixed(4)}
            onMax={() => setCollateralAmount(Number(formattedDNR).toFixed(6))}
            error={hasInsufficientDNR}
          />
        </div>

        <div>
           <label className="text-sm text-gray-400 mb-2 block px-2">ktUSD to Mint (approx)</label>
           <TokenInput
            value={mintAmount}
            onChange={() => {}}
            symbol="ktUSD"
            disabled={true}
            balance={Number(formattedKTUSD).toFixed(4)}
          />
        </div>

        <div className="px-3">
          <div className="w-full bg-[#161b24] h-2 rounded-full overflow-hidden mt-4">
             <div className="h-full bg-green-500 w-full" />
          </div>
          <div className="text-xs text-right mt-1 text-green-400">Ratio: 150% (Safe)</div>
        </div>
      </div>

      <div className="mt-6 p-4">
        {!address ? (
          <GradientButton disabled>Connect Wallet</GradientButton>
        ) : hasInsufficientDNR ? (
          <GradientButton disabled className="!from-red-500/50 !to-red-600/50 text-red-100">
            Insufficient DNR
          </GradientButton>
        ) : (
          <GradientButton 
            onClick={onMint} 
            loading={minting} 
            disabled={!collateralAmount || Number(collateralAmount) <= 0}
            className="!from-[#10b981] !to-[#059669]"
          >
            Mint ktUSD
          </GradientButton>
        )}
      </div>
    </GlassCard>
  );
}
