"use client";
import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

export function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 2 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) {
  const [mounted, setMounted] = useState(false);
  const [displayValue, setDisplayValue] = useState("");
  const spring = useSpring(value, { stiffness: 400, damping: 90 });

  useEffect(() => {
    setMounted(true);
    const format = (v: number) => prefix + v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    setDisplayValue(format(value));
  }, []);

  useEffect(() => {
    if (mounted) spring.set(value);
  }, [value, spring, mounted]);

  useEffect(() => {
    return spring.onChange((latest) => {
      const formatted = prefix + latest.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
      setDisplayValue(formatted);
    });
  }, [spring, prefix, suffix, decimals]);

  return <motion.span>{mounted ? displayValue : ""}</motion.span>;
}
