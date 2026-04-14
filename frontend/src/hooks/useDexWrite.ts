import { useWriteContract, usePublicClient, useWalletClient } from "wagmi";
import { parseEther, type Address } from "viem";
import { DEX_ADDRESS, DEX_ABI, MAINNET_CHAIN_ID } from "../lib/contracts";

export function useDexWrite() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // 🛡️ RECOVERY ENGINE: Force Manual Nonce & Gas to prevent RPC collision
  const executeTx = async (functionName: string, args: any[], value?: bigint) => {
    if (!walletClient || !publicClient) throw new Error("Wallet not connected");

    const [account] = await walletClient.getAddresses();
    const nonce = await publicClient.getTransactionCount({ address: account });
    
    // We stay strictly with the provided ABI signatures
    return await writeContractAsync({
      address: DEX_ADDRESS[MAINNET_CHAIN_ID],
      abi: DEX_ABI,
      functionName,
      args,
      value,
      nonce,
      gasPrice: parseEther("0.000000003"), // 3 Gwei
      chain: undefined, // Stealth Cloak: Prevent wallet network rejection
    } as any);
  };

  const swapDNRForKTUSD = (minOut: string, to: Address, amount: string) => 
    executeTx("swapExactDNRForKTUSD", [parseEther(minOut), to], parseEther(amount));

  const swapKTUSDForDNR = (amountIn: string, minOut: string, to: Address) => 
    executeTx("swapExactKTUSDForDNR", [parseEther(amountIn), parseEther(minOut), to]);

  const addLiquidity = (amountKTUSD: string, dnrValue: string, to: Address) => 
    executeTx("addLiquidity", [parseEther(amountKTUSD), to], parseEther(dnrValue));

  const mintCollateralized = (amountKTUSD: string, dnrCollateral: string, to: Address) => 
    executeTx("mintWithCollateral", [parseEther(amountKTUSD), to], parseEther(dnrCollateral));

  const approveKTUSD = (spender: Address, amount: string) => 
    executeTx("approve", [spender, parseEther(amount)]);

  return {
    swapDNRForKTUSD,
    swapKTUSDForDNR,
    addLiquidity,
    mintCollateralized,
    approveKTUSD
  };
}
