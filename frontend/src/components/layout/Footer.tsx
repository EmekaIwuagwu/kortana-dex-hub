"use client";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.04] bg-[#030408]/80 backdrop-blur-md mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00d4ff] to-[#8b5cf6] opacity-30 blur-md rounded-lg"></div>
              <img src="/website-logo.png" alt="Kortana" className="w-8 h-8 object-contain relative z-10" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); e.currentTarget.nextElementSibling?.classList.add('flex') }} />
              <div className="hidden w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#8b5cf6] items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                K
              </div>
            </div>
            <span className="font-bold text-white text-xl tracking-tight">Kortana<span className="text-[#00d4ff]">DEX</span></span>
          </Link>
          <p className="text-gray-500 text-sm mt-1">The flagship decentralized exchange on Kortana EVM.</p>
        </div>

        <div className="flex items-center gap-6">
          <a href="#" className="text-gray-500 hover:text-[#00d4ff] transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
            </svg>
          </a>
          <a href="#" className="text-gray-500 hover:text-[#8b5cf6] transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.48 2 2 6.28 2 11.5c0 3.03 1.57 5.72 4.02 7.42-.25 1.53-1.07 3.01-1.09 3.04-.04.09-.02.2.06.27.08.06.18.06.26.01 3.25-1.93 4.88-3.08 5.6-3.41C11.23 18.94 11.61 19 12 19c5.52 0 10-4.28 10-9.5S17.52 2 12 2z" clipRule="evenodd" />
            </svg>
          </a>
          <a href="#" className="text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </div>
      
      <div className="w-full border-t border-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600 font-mono">
          <p>© {new Date().getFullYear()} Kortana Network. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Network Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
