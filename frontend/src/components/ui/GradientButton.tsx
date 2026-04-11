"use client";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

interface Props extends HTMLMotionProps<"button"> {
  loading?: boolean;
  children?: React.ReactNode;
}

export function GradientButton({ className, children, loading, disabled, ...props }: Props) {
  return (
    <motion.button
      className={cn(
        "relative flex items-center justify-center w-full px-6 py-4 rounded-2xl",
        "font-bold tracking-wide uppercase text-sm text-white",
        "transition-all duration-300 overflow-hidden group border border-white/5",
        (disabled || loading) 
          ? "bg-[#11141c] text-gray-500 cursor-not-allowed shadow-none" 
          : "bg-gradient-to-r from-[#00d4ff] to-[#8b5cf6] hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(0,212,255,0.4)] border-white/10",
        className
      )}
      whileTap={!(disabled || loading) ? { scale: 0.97 } : undefined}
      disabled={disabled || loading}
      {...props}
    >
      {/* Dynamic Shine effect on hover */}
      {!(disabled || loading) && (
        <div className="absolute inset-0 -translate-x-[150%] skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-shimmer" />
      )}
      {loading && (
        <div className="absolute inset-0 bg-white/10 animate-pulse" />
      )}
      {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
      {children}
    </motion.button>
  );
}
