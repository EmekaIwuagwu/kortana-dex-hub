import { useWalletClient, usePublicClient, useChainId } from "wagmi";
import { encodeFunctionData, parseEther } from "viem";
import { DEX_ABI, DEX_ADDRESS } from "@/lib/contracts";
import { toast } from "sonner";

export function useDexWrite() {
  const appChainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: 9002 }); // Always read from Mainnet 9002

  const executeTx = async (
    targetAddress: `0x${string}`,
    abi: any,
    functionName: string,
    args: unknown[],
    value: bigint = BigInt(0),
    successMsg: string = "Transaction confirmed"
  ) => {
    if (!walletClient || !publicClient) throw new Error("Wallet not connected");

    try {
      // 🦸‍♂️ SUPERMAN CLOAKING MANEUVER:
      const nonce = await publicClient.getTransactionCount({ address: walletClient.account.address });
      const gasPrice = await publicClient.getGasPrice();

      const hash = await walletClient.sendTransaction({
        to: targetAddress,
        data: encodeFunctionData({
          abi,
          functionName,
          args,
        } as any) as `0x${string}`,
        value,
        gas: BigInt(600000), 
        gasPrice,
        nonce,
        type: "legacy",
        chain: undefined, // 🛡️ THE CLOAK
      } as any);

      toast.loading("Transaction pending...", { id: hash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === "success") {
        toast.success(successMsg, { id: hash });
      } else {
        toast.error("Transaction reverted", { id: hash });
      }
      return { hash, receipt };
    } catch (e: unknown) {
      console.error(e);
      const error = e as { shortMessage?: string; message?: string };
      toast.error(error.shortMessage || error.message || "Transaction failed");
      throw e;
    }
  };

  const dexAddr = DEX_ADDRESS[appChainId as keyof typeof DEX_ADDRESS] || DEX_ADDRESS[9002];

  return {
    approve: (tokenAddress: `0x${string}`, amount: bigint) =>
      executeTx(tokenAddress, DEX_ABI, "approve", [dexAddr, amount], BigInt(0), "Approval successful"),

    swapDNRForKTUSD: (dnrAmount: string, minOut: bigint, to: `0x${string}`) =>
      executeTx(dexAddr, DEX_ABI, "swapExactDNRForKTUSD", [minOut, to], parseEther(dnrAmount), "Swap successful"),
      
    swapKTUSDForDNR: (ktUSDAmount: string, minOut: bigint, to: `0x${string}`) =>
      executeTx(dexAddr, DEX_ABI, "swapExactKTUSDForDNR", [parseEther(ktUSDAmount), minOut, to], BigInt(0), "Swap successful"),

    addLiquidity: (amountKTUSD: bigint, minKTUSD: bigint, minDNR: bigint, to: `0x${string}`, valueDNR: bigint) =>
      executeTx(dexAddr, DEX_ABI, "addLiquidity", [amountKTUSD, minKTUSD, minDNR, to], valueDNR, "Liquidity added"),

    removeLiquidity: (lpAmount: bigint, minKTUSD: bigint, minDNR: bigint, to: `0x${string}`) =>
      executeTx(dexAddr, DEX_ABI, "removeLiquidity", [lpAmount, minKTUSD, minDNR, to], BigInt(0), "Liquidity removed"),

    mintCollateralized: (ktUSDAmount: bigint, to: `0x${string}`, dnrCollateral: bigint) =>
      executeTx(dexAddr, DEX_ABI, "mintWithCollateral", [ktUSDAmount, to], dnrCollateral, "ktUSD minted"),
  };
}
