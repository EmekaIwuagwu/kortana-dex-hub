import { useWalletClient, usePublicClient, useChainId } from "wagmi";
import { encodeFunctionData, parseEther } from "viem";
import { DEX_ABI, DEX_ADDRESS } from "@/lib/contracts";
import { toast } from "sonner";

export function useDexWrite() {
  const appChainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: 9002 }); // Always read from Mainnet 9002

  const executeTx = async (
    functionName: string,
    args: unknown[],
    value: bigint = BigInt(0),
    successMsg: string = "Transaction confirmed"
  ) => {
    if (!walletClient || !publicClient) throw new Error("Wallet not connected");

    // 🕵️‍♂️ Determine the correct contract address for the current mode
    const to = DEX_ADDRESS[appChainId as keyof typeof DEX_ADDRESS] || DEX_ADDRESS[9002];
    
    try {
      // 🦸‍♂️ SUPERMAN CLOAKING MANEUVER:
      // We explicitly bypass the library's chain validation by pre-fetching 
      // the nonce and gasPrice ourselves.
      const nonce = await publicClient.getTransactionCount({ address: walletClient.account.address });
      const gasPrice = await publicClient.getGasPrice();

      const hash = await walletClient.sendTransaction({
        to,
        data: encodeFunctionData({
          abi: DEX_ABI,
          functionName,
          args,
        } as { abi: typeof DEX_ABI; functionName: string; args: unknown[] }) as `0x${string}`,
        value,
        gas: BigInt(600000), 
        gasPrice,
        nonce,
        type: "legacy",
        // 🛡️ THE CLOAK: By setting the chain to undefined here, we stop viem 
        // from injecting the 9002 ID into the wallet's internal Ethers context.
        chain: undefined, 
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

  return {
    swapDNRForKTUSD: (dnrAmount: string, minOut: bigint, to: `0x${string}`) =>
      executeTx("swapExactDNRForKTUSD", [minOut, to], parseEther(dnrAmount), "Swap successful"),
      
    swapKTUSDForDNR: (ktUSDAmount: string, minOut: bigint, to: `0x${string}`) =>
      executeTx("swapExactKTUSDForDNR", [parseEther(ktUSDAmount), minOut, to], BigInt(0), "Swap successful"),
  };
}
