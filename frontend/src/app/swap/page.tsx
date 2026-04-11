"use client";
import { SwapCard } from "@/components/swap/SwapCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { useDexRead } from "@/hooks/useDexRead";
import { formatEther } from "viem";

export default function SwapPage() {
  const { reserveDNR, reserveKTUSD } = useDexRead();
  
  const dnrRes = Number(formatEther(reserveDNR));
  const ktusdRes = Number(formatEther(reserveKTUSD));
  
  const price = ktusdRes > 0 && dnrRes > 0 ? (ktusdRes / dnrRes).toFixed(4) : "0.0000";
  const tvl = ktusdRes > 0 ? (ktusdRes * 2).toLocaleString() : "0.00";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col lg:flex-row gap-8 items-start justify-center pt-10"
    >
      <div className="w-full lg:flex-1 flex justify-end">
        <SwapCard />
      </div>
      
      <div className="w-full lg:w-[320px] lg:flex-none">
        <GlassCard className="p-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Pool Stats</h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">ktUSD/DNR Price</div>
              <div className="text-2xl font-mono font-bold">{price} <span className="text-sm text-green-400 ml-2">~</span></div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">TVL</div>
              <div className="text-xl font-mono font-bold">${tvl}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Peg Status</div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold">
                In Band ✓
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}
