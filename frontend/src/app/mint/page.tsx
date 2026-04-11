"use client";
import { MintCard } from "@/components/mint/MintCard";
import { motion } from "framer-motion";

export default function MintPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-8 pt-10 px-4"
    >
      <div className="text-center max-w-xl">
        <h1 className="text-3xl font-bold text-white mb-4">Collateralized Minting</h1>
        <p className="text-gray-400 text-sm">Lock your native DNR as collateral to mint ktUSD, opening up the synthetic rebase economy on Kortana.</p>
      </div>
      <MintCard />
    </motion.div>
  );
}
