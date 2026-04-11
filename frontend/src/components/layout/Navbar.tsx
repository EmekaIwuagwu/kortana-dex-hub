"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const links = [
  { name: "Swap", href: "/swap" },
  { name: "Pool", href: "/pool" },
  { name: "Mint", href: "/mint" },
  { name: "Farm", href: "/farm" },
  { name: "Docs", href: "/docs" },
  { name: "Analytics", href: "/analytics" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 inset-x-0 h-20 border-b border-[rgba(255,255,255,0.06)] bg-[#060810]/80 backdrop-blur-xl z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00d4ff] to-[#8b5cf6] opacity-20 blur-md rounded-lg"></div>
              <img src="/logo.png" alt="Kortana" className="w-9 h-9 object-contain relative z-10" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); e.currentTarget.nextElementSibling?.classList.add('flex') }} />
              <div className="hidden w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#8b5cf6] items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                K
              </div>
            </div>
            <span className="font-bold text-white text-xl tracking-tight">Kortana<span className="text-[#00d4ff]">DEX</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:text-white",
                    isActive ? "text-white" : "text-gray-400"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white/10 rounded-lg"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ConnectButton showBalance={false} />
        </div>
      </div>
    </nav>
  );
}
