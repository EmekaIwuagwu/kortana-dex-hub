"use client";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  symbol: string;
  balance?: string;
  onMax?: () => void;
  usdValue?: string;
  error?: boolean;
  disabled?: boolean;
  onToggleModal?: () => void;
}

export function TokenInput({ value, onChange, symbol, balance, onMax, usdValue, error, disabled, onToggleModal }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={cn(
        "relative rounded-xl bg-[#161b24] border border-[rgba(255,255,255,0.06)] p-4 transition-all duration-300",
        focused && !error && "border-[#00d4ff] shadow-[0_0_12px_rgba(0,212,255,0.2)]",
        error && "border-[#ef4444] shadow-[0_0_12px_rgba(239,68,68,0.2)]"
      )}
    >
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            if (/^\d*\.?\d*$/.test(e.target.value)) {
              onChange(e.target.value);
            }
          }}
          placeholder="0.0"
          className="bg-transparent border-none outline-none text-4xl font-mono text-white placeholder-gray-600 w-full"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
        />
        <div className="flex items-center gap-2 pl-4 flex-shrink-0">
          {onMax && (
            <button
              onClick={onMax}
              className="text-xs font-semibold text-gray-500 hover:text-[#00d4ff] px-2 py-1 bg-white/5 rounded transition-colors"
            >
              MAX
            </button>
          )}
          <button 
            type="button" 
            onClick={onToggleModal}
            className="group flex items-center gap-2 bg-[#060810] hover:bg-[#1a2333] transition-colors px-3 py-1.5 rounded-full border border-white/10 pr-2 cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#8b5cf6] flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
              {symbol.charAt(0)}
            </div>
            <span className="font-semibold text-white tracking-wide">{symbol}</span>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 text-sm">
        <span className="text-[#8b949e]">
          {usdValue ? `~$${usdValue}` : ""}
        </span>
        {balance !== undefined && (
          <span className="text-[#8b949e]">
            Balance: <span className="font-mono">{balance}</span>
          </span>
        )}
      </div>
    </div>
  );
}
