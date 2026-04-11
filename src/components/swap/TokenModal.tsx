"use client";
import { useState } from "react";
import { X, Search, AlertCircle } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
}

export function TokenModal({ isOpen, onClose, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const isAddress = search.startsWith("0x") && search.length === 42;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <GlassCard className="w-full max-w-md bg-[#0d1117] border border-gray-800 flex flex-col p-0 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#161b24]">
          <h2 className="text-lg font-bold text-white">Select a token</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search name or paste address"
              className="w-full bg-[#060810] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-[#00d4ff] transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
          </div>

          <div className="flex gap-2 mb-4">
            <button onClick={() => { onSelect("DNR"); onClose(); }} className="px-3 py-1.5 rounded-full border border-gray-800 bg-[#161b24] hover:bg-[#1a2333] flex items-center gap-2 transition-colors">
              <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#8b5cf6] flex items-center justify-center text-[10px] font-bold text-white">D</span>
              <span className="font-semibold text-white">DNR</span>
            </button>
            <button onClick={() => { onSelect("ktUSD"); onClose(); }} className="px-3 py-1.5 rounded-full border border-gray-800 bg-[#161b24] hover:bg-[#1a2333] flex items-center gap-2 transition-colors">
              <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#8b5cf6] flex items-center justify-center text-[10px] font-bold text-white">k</span>
              <span className="font-semibold text-white">ktUSD</span>
            </button>
          </div>
        </div>

        <div className="border-t border-gray-800 bg-[#0d1117] min-h-[250px] overflow-y-auto w-full">
          {isAddress ? (
            <div className="p-4 flex items-center justify-between hover:bg-[#161b24] cursor-pointer transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 font-bold">
                  ?
                </div>
                <div>
                  <div className="font-semibold text-white">Unknown Token</div>
                  <div className="text-xs text-gray-500">{search.slice(0, 6)}...{search.slice(-4)}</div>
                </div>
              </div>
              <button 
                className="px-3 py-1 rounded bg-[#00d4ff]/10 text-[#00d4ff] font-semibold text-sm hover:bg-[#00d4ff] hover:text-[#060810] transition-colors"
                onClick={() => alert("Kortana MonoDEX Architecture requires migrating to the generic V2 Router Factory to swap non-native custom token pairs. Currently strictly restricted to ktUSD/DNR for native pool security.")}
              >
                Import
              </button>
            </div>
          ) : (
            <div className="p-4 flex items-center gap-3 hover:bg-[#161b24] cursor-pointer transition-colors" onClick={() => { onSelect("DNR"); onClose(); }}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#8b5cf6] flex items-center justify-center text-xs font-bold text-white shadow-sm">D</div>
              <div className="flex flex-col">
                <span className="font-semibold text-white">DNR</span>
                <span className="text-xs text-gray-500">Kortana Native</span>
              </div>
            </div>
          )}
          {!isAddress && (
             <div className="p-4 flex items-center gap-3 hover:bg-[#161b24] cursor-pointer transition-colors" onClick={() => { onSelect("ktUSD"); onClose(); }}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#8b5cf6] flex items-center justify-center text-xs font-bold text-white shadow-sm">k</div>
              <div className="flex flex-col">
                <span className="font-semibold text-white">ktUSD</span>
                <span className="text-xs text-gray-500">Kortana Stablecoin</span>
              </div>
            </div>
          )}
        </div>
        
        {isAddress && (
           <div className="p-3 bg-red-500/10 border-t border-red-500/20 flex gap-2 items-start text-xs text-red-200">
             <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
             <p>Anyone can create a token, including fake versions of existing tokens. Import custom contracts at your own risk.</p>
           </div>
        )}
      </GlassCard>
    </div>
  );
}
