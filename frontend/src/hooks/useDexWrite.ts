import { useWalletClient, usePublicClient, useChainId } from "wagmi";
import { encodeFunctionData, parseEther } from "viem";
import { DEX_ABI, DEX_ADDRESS } from "@/lib/contracts";
import { toast } from "sonner";

export function useDexWrite() {
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId });

  const executeTx = async (
    functionName: any,
    args: any[],
    value: bigint = BigInt(0),
    successMsg: string = "Transaction confirmed"
  ) => {
    if (!walletClient || !publicClient) throw new Error("Wallet not connected");

    const to = DEX_ADDRESS[chainId as keyof typeof DEX_ADDRESS];
    if (!to) throw new Error("DEX not deployed on this chain");

    try {
      const hash = await walletClient.sendTransaction({
        to,
        data: encodeFunctionData({
          abi: DEX_ABI,
          functionName,
          args,
        } as any) as `0x${string}`,
        value,
        gas: BigInt(500000), // Bug 1 fix
        type: "legacy", // Bug 5 fix
        chain: walletClient.chain
      });

      toast.loading("Transaction pending...", { id: hash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === "success") {
        toast.success(successMsg, { id: hash });
      } else {
        toast.error("Transaction reverted", { id: hash });
      }
      return { hash, receipt };
    } catch (e: any) {
      console.error(e);
      toast.error(e.shortMessage || e.message || "Transaction failed");
      throw e;
    }
  };

  return {
    swapDNRForKTUSD: (dnrAmount: string, minOut: bigint, to: `0x${string}`) =>
      executeTx("swapExactDNRForKTUSD", [minOut, to], parseEther(dnrAmount), "Swap successful"),
      
    swapKTUSDForDNR: (ktUSDAmount: string, minOut: bigint, to: `0x${string}`) =>
      executeTx("swapExactKTUSDForDNR", [parseEther(ktUSDAmount), minOut, to], BigInt(0), "Swap successful"),

    addLiquidity: (amountKTUSD: bigint, minKTUSD: bigint, minDNR: bigint, to: `0x${string}`, valueDNR: bigint) =>
      executeTx("addLiquidity", [amountKTUSD, minKTUSD, minDNR, to], valueDNR, "Liquidity added"),

    removeLiquidity: (lpAmount: bigint, minKTUSD: bigint, minDNR: bigint, to: `0x${string}`) =>
      executeTx("removeLiquidity", [lpAmount, minKTUSD, minDNR, to], BigInt(0), "Liquidity removed"),

    mintCollateralized: (ktUSDAmount: bigint, to: `0x${string}`, dnrCollateral: bigint) =>
      executeTx("mintWithCollateral", [ktUSDAmount, to], dnrCollateral, "ktUSD minted"),
  };
}
