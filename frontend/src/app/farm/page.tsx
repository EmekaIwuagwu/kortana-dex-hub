"use client";
import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { DEX_ADDRESS, FARM_ADDRESS, FARM_ABI, DEX_ABI } from "@/lib/contracts";
import { formatEther, parseEther } from "viem";
import { Coins, Droplets, TrendingUp, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function FarmPage() {
  const { address, chainId } = useAccount();
  const [amount, setAmount] = useState("");
  
  const farmAddr = chainId ? FARM_ADDRESS[chainId as keyof typeof FARM_ADDRESS] : undefined;
  const monoAddr = chainId ? DEX_ADDRESS[chainId as keyof typeof DEX_ADDRESS] : undefined;
  // KLP is internal to MonoDEX — all LP operations go to monoAddr

  // 1. Read KLP Balance (via lpBalanceOf on MonoDEX)
  const { data: lpBalance, refetch: refetchLP } = useReadContract({
    address: monoAddr as `0x${string}`,
    abi: DEX_ABI,
    functionName: "lpBalanceOf",
    args: [address as `0x${string}`],
    query: { enabled: !!address && !!monoAddr, refetchInterval: 5000 }
  });

  // 2. Read Pending Rewards
  const { data: pendingDNR, refetch: refetchPending } = useReadContract({
    address: farmAddr as `0x${string}`,
    abi: FARM_ABI,
    functionName: "pendingDNR",
    args: [BigInt(0), address as `0x${string}`],
    query: { enabled: !!address && !!farmAddr, refetchInterval: 5000 }
  });

  // 3. Read Staked Amount
  const { data: userInfo, refetch: refetchUser } = useReadContract({
    address: farmAddr as `0x${string}`,
    abi: FARM_ABI,
    functionName: "userInfo",
    args: [BigInt(0), address as `0x${string}`],
    query: { enabled: !!address && !!farmAddr }
  });

  // 5. Read Farm Global Data (dnrPerSecond and Total Staked LP)
  const { data: dnrPerSec } = useReadContract({
    address: farmAddr as `0x${string}`,
    abi: FARM_ABI,
    functionName: "dnrPerSecond",
    query: { enabled: !!farmAddr }
  });

  const { data: totalStakedLP } = useReadContract({
    address: monoAddr as `0x${string}`,
    abi: DEX_ABI,
    functionName: "lpBalanceOf",
    args: [farmAddr as `0x${string}`],
    query: { enabled: !!monoAddr && !!farmAddr }
  });

  const { data: reserves } = useReadContract({
    address: monoAddr as `0x${string}`,
    abi: DEX_ABI,
    functionName: "getReserves",
    query: { enabled: !!monoAddr }
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: monoAddr as `0x${string}`,
    abi: DEX_ABI,
    functionName: "lpAllowance",
    args: [address as `0x${string}`, farmAddr as `0x${string}`],
    query: { enabled: !!address && !!monoAddr && !!farmAddr }
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      refetchLP();
      refetchPending();
      refetchUser();
      refetchAllowance();
      toast.success("Transaction Confirmed!");
    }
  }, [isSuccess]);

  const handleDeposit = async () => {
    if (!amount || !farmAddr || !monoAddr) return;
    const amountBig = parseEther(amount);

    // If LP allowance is insufficient, call lpApprove on MonoDEX first
    if (!allowance || (allowance as bigint) < amountBig) {
      writeContract({
        address: monoAddr as `0x${string}`,
        abi: DEX_ABI,
        functionName: "lpApprove",
        args: [farmAddr as `0x${string}`, amountBig * BigInt(10)],
      });
      return;
    }

    writeContract({
      address: farmAddr as `0x${string}`,
      abi: FARM_ABI,
      functionName: "deposit",
      args: [BigInt(0), amountBig],
    });
  };

  const handleHarvest = () => {
    if (!farmAddr) return;
    writeContract({
      address: farmAddr as `0x${string}`,
      abi: FARM_ABI,
      functionName: "deposit",
      args: [BigInt(0), BigInt(0)],
    });
  };

  const userStaked = userInfo ? (userInfo as [bigint, bigint])[0] : BigInt(0);

  // APR Calculation
  let liveApr = "0%";
  if (dnrPerSec && totalStakedLP && reserves) {
    const dnrPerSecNum = Number(formatEther(dnrPerSec as bigint));
    const totalStakedNum = Number(formatEther(totalStakedLP as bigint));
    const dnrReserves = Number(formatEther((reserves as [bigint, bigint, number])[0]));
    const lpTotalSupply = Number(formatEther(1000000n * BigInt(1e18))); // MonoDEX genesis LP is 1M

    if (totalStakedNum > 0 && dnrReserves > 0) {
      const annualRewards = dnrPerSecNum * 365 * 24 * 3600;
      const dnrPerLp = dnrReserves / lpTotalSupply;
      const tvlInDnr = totalStakedNum * dnrPerLp * 2;
      const aprValue = (annualRewards / tvlInDnr) * 100;
      liveApr = aprValue > 10000 ? ">10,000%" : `${Math.floor(aprValue).toLocaleString()}%`;
    } else if (totalStakedNum === 0) {
      liveApr = "∞%"; // No stakers yet
    }
  }

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00d4ff] to-[#8b5cf6]">
          Kortana Yield Farm
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          Stake your KLP tokens to earn $DNR rewards. 
          Maximize your capital efficiency with protocol-native incentives.
        </p>

        <div className="flex justify-center mt-6">
           <a 
              href="https://explorer.mainnet.kortana.xyz/address/0x32bC9b38D676b45642C8f3c1a8f1a70af073C0CD" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-all group"
           >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-mono font-bold text-gray-300">Liquidity Locked & Verified</span>
              <span className="text-[10px] text-gray-500 group-hover:text-white transition-colors">↗</span>
           </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="flex flex-col items-center p-8 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-[#00d4ff]/10 flex items-center justify-center text-[#00d4ff]">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-mono uppercase tracking-widest">Your Staked KLP</p>
            <p className="text-3xl font-bold text-white mt-1">{Number(formatEther(userStaked)).toFixed(4)}</p>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col items-center p-8 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center text-[#8b5cf6]">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-mono uppercase tracking-widest">Pending Rewards</p>
            <p className="text-3xl font-bold text-white mt-1">{pendingDNR ? Number(formatEther(pendingDNR as bigint)).toFixed(6) : "0.000000"} DNR</p>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col items-center p-8 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-mono uppercase tracking-widest">Current APR</p>
            <p className="text-3xl font-bold text-white mt-1">{liveApr}</p>
          </div>
        </GlassCard>
      </div>

      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Active Farm Pools</h2>
        <div className="grid grid-cols-1 gap-6">
          <GlassCard className="p-0 overflow-hidden group border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
            <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/[0.02]">
              <div className="flex items-center gap-6">
                <div className="flex -space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#8b5cf6] border-2 border-[#0d1117] flex items-center justify-center font-bold text-white z-20 shadow-lg">D</div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#00d4ff] border-2 border-[#0d1117] flex items-center justify-center font-bold text-white z-10 shadow-lg">k</div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">DNR / ktUSD</h3>
                  <p className="text-sm text-gray-500">Native Liquidity Rewards Pool</p>
                </div>
              </div>

              <div className="flex items-center gap-12 text-center">
                <div>
                  <p className="text-xs text-gray-500 font-mono uppercase">multiplier</p>
                  <p className="text-lg font-bold text-[#00d4ff]">40x</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-mono uppercase">APR</p>
                  <p className="text-lg font-bold text-green-400">{liveApr}</p>
                </div>
              </div>

              <div className="w-full md:w-auto">
                <div className="text-xs text-gray-500 mb-2 font-mono uppercase tracking-tighter">Your Wallet: {lpBalance ? Number(formatEther(lpBalance as bigint)).toFixed(4) : "0.0000"} KLP</div>
                <input 
                  type="number"
                  placeholder="0.0"
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 w-full md:w-32 focus:outline-none focus:border-cyan-500 text-white font-mono"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-white/[0.04] grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/[0.02]">
                    <div>
                      <p className="text-xs text-gray-500 font-mono uppercase">DNR Earned</p>
                      <p className="text-2xl font-bold text-white">{pendingDNR ? Number(formatEther(pendingDNR as bigint)).toFixed(4) : "0.0000"}</p>
                    </div>
                    <button 
                      onClick={handleHarvest}
                      disabled={isPending || isConfirming || !pendingDNR || (pendingDNR as bigint) === 0n}
                      className="px-6 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] text-gray-300 font-bold transition-all disabled:opacity-50 active:scale-95"
                    >
                      {isPending || isConfirming ? <Loader2 className="w-5 h-5 animate-spin" /> : "Harvest"}
                    </button>
                  </div>
               </div>
               <div className="space-y-4">
                  <GradientButton 
                    className="w-full py-4 text-sm tracking-widest shadow-xl uppercase font-bold"
                    onClick={handleDeposit}
                    disabled={isPending || isConfirming}
                  >
                    {isPending || isConfirming ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 
                      (!allowance || (allowance as bigint) < parseEther(amount || "0") ? "Approve & Stake" : "Stake KLP Tokens")}
                  </GradientButton>
               </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
