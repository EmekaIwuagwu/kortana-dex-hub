"use client";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useDexRead } from "@/hooks/useDexRead";
import { formatEther } from "viem";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

const data = [
  { name: "Mon", price: 0.98 },
  { name: "Tue", price: 0.99 },
  { name: "Wed", price: 1.01 },
  { name: "Thu", price: 1.05 },
  { name: "Fri", price: 1.00 },
  { name: "Sat", price: 0.99 },
  { name: "Sun", price: 1.00 },
];

export default function AnalyticsPage() {
  const { reserveDNR, reserveKTUSD, totalSupply, rebaseIndex } = useDexRead();

  // Basic price estimation based on AMM reserves
  const dnrRes = Number(formatEther(reserveDNR));
  const ktusdRes = Number(formatEther(reserveKTUSD));
  const spotPrice = ktusdRes > 0 ? (dnrRes / ktusdRes).toFixed(4) : "1.0000";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8 pt-10 px-4 w-full"
    >
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-sm text-gray-400 mb-8">KortanaDEX overview & ktUSD Rebase statistics</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <GlassCard className="p-4">
            <div className="text-sm text-gray-400">Price (ktUSD/DNR)</div>
            <div className="text-2xl font-mono font-bold mt-1">
              {spotPrice} <span className="text-green-400 text-sm">Active</span>
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-sm text-gray-400">TVL (DNR)</div>
            <div className="text-2xl font-mono font-bold mt-1">
              <AnimatedNumber value={dnrRes * 2} suffix=" DNR" />
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-sm text-gray-400">Rebase Index</div>
            <div className="text-2xl font-mono font-bold mt-1">
              {Number(rebaseIndex) / 1e9}
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-sm text-gray-400">ktUSD Supply</div>
            <div className="text-2xl font-mono font-bold mt-1">
              <AnimatedNumber value={Number(formatEther(totalSupply))} />
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-6 h-[400px]">
          <h3 className="font-semibold text-lg mb-6">Price History & Rebases</h3>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={data}>
              <XAxis dataKey="name" stroke="#8b949e" />
              <YAxis domain={['auto', 'auto']} stroke="#8b949e" />
              <Tooltip
                contentStyle={{ backgroundColor: "#161b24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                itemStyle={{ color: "#00d4ff" }}
              />
              <Line type="monotone" dataKey="price" stroke="#00d4ff" strokeWidth={3} dot={{ r: 4, fill: "#00d4ff" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </motion.div>
  );
}
