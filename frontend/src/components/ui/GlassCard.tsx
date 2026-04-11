"use client";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

export function GlassCard({ className, children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      className={cn(
        "relative backdrop-blur-2xl bg-[#0b0e17]/80 border border-white/[0.04]",
        "rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-6 overflow-hidden",
        "before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/[0.02] before:pointer-events-none",
        "transition-all duration-500 hover:border-white/[0.08]",
        "hover:shadow-[0_8px_40px_rgba(139,92,246,0.12)]",
        className
      )}
      whileHover={{ scale: 1.005 }}
      transition={{ type: "spring", stiffness: 400 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
