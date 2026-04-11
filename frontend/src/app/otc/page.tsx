"use client";
import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { motion } from "framer-motion";
import { Shield, ChevronRight, BarChart3, Globe, Mail, MessageSquare, Briefcase } from "lucide-react";

export default function OTCPage() {
  return (
    <div className="max-w-6xl mx-auto py-16 px-4 space-y-20">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[#00d4ff] text-xs font-mono mb-4 uppercase tracking-widest">
            <Briefcase className="w-3 h-3" />
            Institutional Portal
        </div>
        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
          Institutional Liquidity & OTC Solutions
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          The Kortana Network provides premium liquidity services for venture funds, family offices, and high-net-worth individuals seeking large-scale exposure to DNR and ktUSD.
        </p>
      </section>

      {/* Value Propositions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            title: "Zero Slippage",
            desc: "Execute high-volume orders without moving the public market price. We source liquidity directly from the protocol treasury.",
            icon: <Shield className="w-6 h-6" />
          },
          {
            title: "Concierge Onboarding",
            desc: "Direct access to the founding team for technical integration, bridge support, and customized monetary strategies.",
            icon: <Globe className="w-6 h-6" />
          },
          {
            title: "Compliant ktUSD Minting",
            desc: "Direct-to-vault minting services for institutional partners seeking stable yield in the Kortana ecosystem.",
            icon: <BarChart3 className="w-6 h-6" />
          }
        ].map((feature, i) => (
          <GlassCard key={i} className="p-8 space-y-4 border-white/[0.03] hover:border-[#00d4ff]/20 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center text-gray-400 group-hover:text-[#00d4ff] transition-colors">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold text-white">{feature.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
          </GlassCard>
        ))}
      </div>

      {/* OTC Workflow */}
      <section className="space-y-12 bg-white/[0.01] rounded-[40px] p-12 border border-white/[0.03]">
        <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">The OTC Workflow</h2>
            <p className="text-gray-500">Fast, secure, and professional trade execution.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
                { step: "01", label: "Inquire", sub: "Submit your trade request via encrypted channel." },
                { step: "02", label: "Quote", sub: "Receive a fixed price quote with 0% slippage." },
                { step: "03", label: "Settle", sub: "Transfer USDT/USDC via multi-sig bridge." },
                { step: "04", label: "Receive", sub: "Assets delivered to your Kortana wallet instantly." }
            ].map((step, i) => (
                <div key={i} className="p-6 space-y-3 relative group">
                    <span className="text-4xl font-black text-white/5 group-hover:text-[#00d4ff]/10 transition-colors absolute top-4 right-4">{step.step}</span>
                    <p className="text-lg font-bold text-white uppercase tracking-tighter">{step.label}</p>
                    <p className="text-xs text-gray-500">{step.sub}</p>
                    {i < 3 && <ChevronRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-gray-800" />}
                </div>
            ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="max-w-4xl mx-auto space-y-12">
        <GlassCard className="p-12 border-[#00d4ff]/20 shadow-[0_0_50px_rgba(0,212,255,0.05)] text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent opacity-30"></div>
            <div className="space-y-8 relative z-10">
                <div className="space-y-4">
                    <h2 className="text-4xl font-bold">Begin your trade entry</h2>
                    <p className="text-gray-400">Our Institutional Desk is currently accepting new inquiries for DNR acquisitions exceeding $10,000 USD equivalent.</p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 justify-center">
                    <a href="mailto:support@kortana.network" className="flex items-center gap-4 px-8 py-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group">
                        <Mail className="w-5 h-5 text-[#00d4ff]" />
                        <div className="text-left">
                            <p className="text-[10px] uppercase text-gray-500 font-mono tracking-widest">Email Inquiry</p>
                            <p className="font-bold">support@kortana.network</p>
                        </div>
                    </a>
                    <a href="#" className="flex items-center gap-4 px-8 py-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group cursor-not-allowed opacity-50">
                        <MessageSquare className="w-5 h-5 text-[#8b5cf6]" />
                        <div className="text-left">
                            <p className="text-[10px] uppercase text-gray-500 font-mono tracking-widest">Telegram Desk</p>
                            <p className="font-bold font-mono text-xs text-gray-600">Locked to Partners</p>
                        </div>
                    </a>
                </div>

                <div className="pt-8 border-t border-white/[0.03]">
                    <p className="text-[10px] text-gray-600 uppercase font-mono tracking-widest leading-loose">
                        SECURE LIQUIDITY • 100% PROTOCOL BACKED • INSTITUTIONAL GRADE SETTLEMENT
                    </p>
                </div>
            </div>
        </GlassCard>
      </section>
    </div>
  );
}
