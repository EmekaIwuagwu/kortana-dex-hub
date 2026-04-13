"use client";
import { useState } from "react";
import { GlassCard } from "../ui/GlassCard";
import { GradientButton } from "../ui/GradientButton";
import { TokenInput } from "./TokenInput";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { useDexWrite } from "@/hooks/useDexWrite";
import { usePriceQuote } from "@/hooks/usePriceQuote";
import { formatEther } from "viem";
import { TokenModal } from "./TokenModal";
import { useDexRead } from "@/hooks/useDexRead";

export function SwapCard() {
  const [isDNRtoKTUSD, setIsDNRtoKTUSD] = useState(true);
  const [sellAmount, setSellAmount] = useState("");
  const chainId = useChainId();
  const { address } = useAccount();

  const { dnrBalance, ktUSDBalance, refetchAll } = useTokenBalances(chainId);
  const { buyAmount, loading: quoting } = usePriceQuote(sellAmount, isDNRtoKTUSD);
  const { swapDNRForKTUSD, swapKTUSDForDNR } = useDexWrite();

  const [swapping, setSwapping] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const { reserveDNR, reserveKTUSD } = useDexRead();
  const dnrRes = Number(formatEther(reserveDNR));
  const ktusdRes = Number(formatEther(reserveKTUSD));
  const priceRate = ktusdRes > 0 && dnrRes > 0 ? (ktusdRes / dnrRes).toFixed(4) : "0.0000";

  const tokenInBal = isDNRtoKTUSD ? dnrBalance : ktUSDBalance;
  const tokenInSymbol = isDNRtoKTUSD ? "DNR" : "ktUSD";
  const tokenOutSymbol = isDNRtoKTUSD ? "ktUSD" : "DNR";

  const formattedBal = formatEther(tokenInBal);
  const hasInsufficientBal = Number(sellAmount) > Number(formattedBal);

  const handleSwapDir = () => {
    setIsDNRtoKTUSD(!isDNRtoKTUSD);
    setSellAmount("");
  };

  const handleMax = () => {
    // If DNR, keep some for gas (e.g. 0.01)
    if (isDNRtoKTUSD) {
      const max = Number(formattedBal) - 0.01;
      setSellAmount(max > 0 ? max.toFixed(6) : "0");
    } else {
      setSellAmount(formattedBal);
    }
  };

  const onSwap = async () => {
    if (!address) return;
    setSwapping(true);
    try {
      const minOut = BigInt(0); // slippage simplification for now
      if (isDNRtoKTUSD) {
        await swapDNRForKTUSD(sellAmount, minOut, address);
      } else {
        await swapKTUSDForDNR(sellAmount, minOut, address);
      }
      refetchAll();
      setSellAmount("");
    } catch (e) {
      console.error(e);
    }
    setSwapping(false);
  };

  return (
    <GlassCard className="w-full max-w-[480px] mx-auto p-2 border-[#00d4ff]/20 shadow-[0_0_15px_rgba(0,212,255,0.1)]">
      <div className="p-4 flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">Swap</h2>
        {/* Settings icon could go here */}
      </div>

      <div className="flex flex-col gap-1 relative">
        <TokenInput
          value={sellAmount}
          onChange={setSellAmount}
          symbol={tokenInSymbol}
          balance={Number(formattedBal).toFixed(4)}
          onMax={handleMax}
          error={hasInsufficientBal}
          onToggleModal={() => setModalOpen(true)}
        />
        
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 my-1">
          <motion.button
            onClick={handleSwapDir}
            className="w-10 h-10 rounded-xl bg-[#1c2333] border-4 border-[#0d1117] flex items-center justify-center text-white hover:text-[#00d4ff] transition-colors"
            whileTap={{ scale: 0.9, rotate: 180 }}
          >
            <ArrowDown className="w-5 h-5" />
          </motion.button>
        </div>

        <TokenInput
          value={buyAmount}
          onChange={() => {}}
          symbol={tokenOutSymbol}
          disabled={true}
          onToggleModal={() => setModalOpen(true)}
        />
      </div>

      <div className="mt-4 p-4">
        <div className="flex flex-col gap-2 mb-4 px-1">
          <div className="flex justify-between text-sm text-[#8b949e]">
            <span>Exchange Rate</span>
            <span className="text-white font-mono font-semibold">1 DNR = {priceRate} ktUSD</span>
          </div>
          <div className="flex justify-between text-sm text-[#8b949e]">
            <span>Network Fee</span>
            <span>0.3%</span>
          </div>
        </div>

        {!address ? (
          <GradientButton disabled>Connect Wallet</GradientButton>
        ) : hasInsufficientBal ? (
          <GradientButton disabled className="!from-red-500/50 !to-red-600/50 text-red-100">
            Insufficient {tokenInSymbol} Balance
          </GradientButton>
        ) : (
          <GradientButton 
            onClick={onSwap} 
            loading={swapping} 
            disabled={!sellAmount || Number(sellAmount) <= 0 || quoting || !buyAmount}
          >
            {quoting ? "Calculating..." : "Swap"}
          </GradientButton>
        )}

        <div className="mt-8 pt-4 border-t border-white/[0.04]">
           <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] uppercase font-mono font-bold text-green-500 tracking-tighter">Liquidity Locked: 100%</span>
              </div>
              <a 
                href="https://explorer.mainnet.kortana.xyz/address/0x32bC9b38D676b45642C8f3c1a8f1a70af073C0CD" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] text-gray-500 hover:text-white transition-colors flex items-center gap-1 font-mono"
              >
                PROOF <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
           </div>
        </div>
      </div>

      <TokenModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSelect={(symbol) => {
           if (symbol !== tokenInSymbol) handleSwapDir();
        }} 
      />
    </GlassCard>
  );
}
