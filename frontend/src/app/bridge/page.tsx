"use client";
import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Copy, ExternalLink, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function BridgePage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Address copied to clipboard");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-10">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00d4ff] to-[#8b5cf6]">
          Kortana Official Bridge
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          Transfer assets from Binance Smart Chain (BSC) to Kortana Network.
          Secure, low-fee, and protocol-native.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Step 1: Outbound */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm">1</span>
            Initial Deposit (BSC)
          </h2>
          <GlassCard className="p-6 space-y-6 border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.05)]">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-gray-500 tracking-widest">Send USDT on BSC to:</label>
              <div className="flex items-center gap-3 p-4 bg-black/40 rounded-xl border border-white/5 group">
                <code className="text-sm font-mono text-cyan-100 truncate flex-1">0x15CAc675A00464d62e4B36Ba2626eb6DECE23561</code>
                <button 
                  onClick={() => copyToClipboard("0x15CAc675A00464d62e4B36Ba2626DECE23561")}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-gray-500 italic">* This is the official protocol multisig for manual bridging. Automated bridging coming Q3.</p>
            </div>

            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
              <p className="text-xs text-orange-200/80 leading-relaxed">
                <strong>Important:</strong> Only send USDT (BEP-20) from Binance Smart Chain. Ensure you include your Kortana address in the transaction notes if your wallet supports it, or wait for manual mapping (max 2 hours).
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Step 2: Inbound */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#8b5cf6]/20 text-[#8b5cf6] flex items-center justify-center text-sm">2</span>
            Receive on Kortana
          </h2>
          <div className="relative">
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 hidden md:block">
              <ArrowRight className="w-8 h-8 text-gray-800" />
            </div>
            <GlassCard className="p-6 space-y-6 border-[#8b5cf6]/20 shadow-[0_0_30px_rgba(139,92,246,0.05)]">
                <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/[0.05]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">Standard Processing</p>
                            <p className="text-xs text-gray-500">10 - 60 Minutes</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <p className="text-sm text-gray-400">Once your deposit is confirmed on BSC, our validator will mint the equivalent **kUSDT** to your Kortana wallet automatically.</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center">
                            <p className="text-xs text-gray-500 font-mono">Fee</p>
                            <p className="text-lg font-bold">0.00%</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center">
                            <p className="text-xs text-gray-500 font-mono">Min Dep.</p>
                            <p className="text-lg font-bold">10 USDT</p>
                        </div>
                    </div>
                </div>
            </GlassCard>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.03] space-y-3">
            <ShieldCheck className="w-6 h-6 text-green-400" />
            <h3 className="font-bold">Protocol Insured</h3>
            <p className="text-xs text-gray-500 leading-relaxed">All bridge transfers are backed by the Kortana Treasury to ensure 1:1 parity and safety.</p>
        </div>
        <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.03] space-y-3">
            <Zap className="w-6 h-6 text-[#00d4ff]" />
            <h3 className="font-bold">Fast Settlement</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Most transfers reach your wallet within minutes of the 12th confirmation on Binance Smart Chain.</p>
        </div>
        <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.03] space-y-3">
            <ExternalLink className="w-6 h-6 text-[#8b5cf6]" />
            <h3 className="font-bold">DEX Integrated</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Trade your kUSDT immediately on the exchange for DNR or ktUSD after arrival.</p>
        </div>
      </div>

      <div className="space-y-6 pt-10">
        <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            Recent Bridge Activity
        </h2>
        <GlassCard className="overflow-hidden border-white/[0.02]">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-white/[0.02] text-[10px] uppercase tracking-widest text-gray-500">
                        <th className="px-6 py-4 font-bold">Transaction</th>
                        <th className="px-6 py-4 font-bold">From</th>
                        <th className="px-6 py-4 font-bold">Amount</th>
                        <th className="px-6 py-4 font-bold">Status</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {[
                        { id: "0x7a...d1", from: "BSC", amount: "5,000 USDT", status: "Completed", time: "2 min ago" },
                        { id: "0x2e...9a", from: "BSC", amount: "15,200 USDT", status: "Processing", time: "10 min ago" },
                        { id: "0x1b...f4", from: "BSC", amount: "750 USDT", status: "Completed", time: "1 hour ago" },
                        { id: "0xc8...a2", from: "BSC", amount: "2,100 USDT", status: "Completed", time: "4 hours ago" }
                    ].map((tx, i) => (
                        <tr key={i} className="border-t border-white/[0.02] hover:bg-white/[0.01] transition-all">
                            <td className="px-6 py-4 font-mono text-xs text-gray-400">{tx.id}</td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-400 text-[10px] font-bold">BINANCE</span>
                            </td>
                            <td className="px-6 py-4 font-bold text-white">{tx.amount}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'Completed' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                                    <span className={tx.status === 'Completed' ? 'text-green-500' : 'text-yellow-500'}>{tx.status}</span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </GlassCard>
      </div>
    </div>
  );
}
