"use client";
import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { Book, Shield, Zap, TrendingUp, Anchor, Info } from "lucide-react";

export default function DocsPage() {
  const sections = [
    {
      id: "intro",
      title: "Introduction",
      icon: <Book className="w-5 h-5" />,
      content: "KortanaDEX is the native liquidity layer of the Kortana Network. Unlike traditional exchanges, it is built to sustain a native stablecoin ecosystem through an integrated rebase and collateralization engine."
    },
    {
      id: "dnr",
      title: "$DNR Token",
      icon: <TrendingUp className="w-5 h-5" />,
      content: "DNR (Dinar) is the native utility and governance token of the Kortana L1. It is used for gas fees, collateral to mint ktUSD, and as rewards for liquidity providers in the Farming ecosystem."
    },
    {
      id: "ktusd",
      title: "$ktUSD Stability",
      icon: <Anchor className="w-5 h-5" />,
      content: "ktUSD is an elastic stablecoin pegged to $1.00. It maintains stability through a dual-mechanism: (1) Collateralization by DNR and (2) Supply Rebasing. When the price of ktUSD deviates from $1.00 by more than 5%, the protocol automatically adjusts supply to restore the peg."
    },
    {
        id: "farming",
        title: "Yield Farming",
        icon: <Zap className="w-5 h-5" />,
        content: "Users who provide liquidity on KortanaDEX receive KLP tokens. By staking these in the Yield Farm, users earn DNR rewards. This mechanism ensures deep liquidity and minimizes slippage for all traders."
    },
    {
        id: "security",
        title: "Protocol Security",
        icon: <Shield className="w-5 h-5" />,
        content: "KortanaDEX prioritizes safety. 100% of the initial liquidity is cryptographically locked for 6 months. Furthermore, the MonoDEX architecture minimizes cross-contract risks by handling swaps and stablecoin logic in a single optimized contract."
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 flex flex-col md:flex-row gap-12">
      {/* Sidebar navigation */}
      <aside className="md:w-64 h-fit sticky top-28 space-y-2 hidden md:block">
        <p className="text-xs font-mono uppercase text-gray-500 mb-6 tracking-widest px-4">Documentation</p>
        {sections.map(s => (
          <a key={s.id} href={`#${s.id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.03] transition-all text-gray-400 hover:text-white group">
            <span className="text-gray-600 group-hover:text-[#00d4ff]">{s.icon}</span>
            <span className="text-sm font-medium">{s.title}</span>
          </a>
        ))}
      </aside>

      {/* Main content */}
      <main className="flex-1 space-y-16">
        <section className="space-y-4">
            <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00d4ff] to-[#8b5cf6]">Whitepaper</h1>
            <p className="text-xl text-gray-400">Understanding the Kortana Monetary Protocol and Decentralized Exchange.</p>
        </section>

        {sections.map(s => (
          <section key={s.id} id={s.id} className="space-y-6 pt-8 scroll-mt-28">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-[#00d4ff]">
                    {s.icon}
                </div>
                <h2 className="text-3xl font-bold text-white">{s.title}</h2>
            </div>
            
            <GlassCard className="p-8 leading-relaxed text-gray-300 border-white/[0.02]">
                {s.content}
                
                {s.id === "ktusd" && (
                    <div className="mt-8 p-6 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-mono text-cyan-500">
                            <Info className="w-4 h-4" />
                            <span>ALGORITHMIC LOGIC</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-white">Price &gt; $1.05</p>
                                <p className="text-xs text-gray-500">Positive Rebase: Supply expands to dilute price.</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-white">Price &lt; $0.95</p>
                                <p className="text-xs text-gray-500">Negative Rebase: Supply contracts to increase price.</p>
                            </div>
                        </div>
                    </div>
                )}
            </GlassCard>
          </section>
        ))}

        <footer className="pt-20 pb-10 border-t border-white/[0.03] text-center">
            <p className="text-sm text-gray-500">Built for a decentralized future on Kortana Network.</p>
        </footer>
      </main>
    </div>
  );
}
