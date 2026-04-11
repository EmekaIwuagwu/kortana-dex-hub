"use client";
import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

export function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 2 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) {
  const [mounted, setMounted] = useState(false);
  const spring = useSpring(value, { stiffness: 400, damping: 90 });
  const display = useTransform(spring, (current) =>
    prefix + current.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      spring.set(value);
    }
  }, [value, spring, mounted]);

  if (!mounted) {
    return <span>{prefix}{value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
  }

  return <motion.span>{display}</motion.span>;
}
