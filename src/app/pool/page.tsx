"use client";
import { PoolCard } from "@/components/pool/PoolCard";
import { PositionCard } from "@/components/pool/PositionCard";
import { motion } from "framer-motion";

export default function PoolPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-8 pt-10 px-4"
    >
      <div className="text-center max-w-xl">
        <h1 className="text-3xl font-bold text-white mb-4">Liquidity Pool</h1>
        <p className="text-gray-400 text-sm">Add liquidity to earn 0.3% fees on all trades proportional to your share of the pool.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 w-full justify-center items-start">
        <PoolCard />
        <PositionCard />
      </div>
    </motion.div>
  );
}
