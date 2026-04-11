import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http, encodeFunctionData, parseEther } from "viem";
import { DEX_ABI } from "@/lib/contracts";

export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    if (!process.env.FAUCET_PRIVATE_KEY) throw new Error("Faucet Private Key missing");
    if (!address) throw new Error("Address is required");

    const account = privateKeyToAccount(`0x${process.env.FAUCET_PRIVATE_KEY.replace('0x', '')}`);
    const client  = createPublicClient({ transport: http("https://poseidon-rpc.testnet.kortana.xyz/") });

    const nonce = await client.getTransactionCount({ address: account.address });
    const rawTx = await account.signTransaction({
      to: "0xA7b11655DeE84cF8BEE727fFf7539d6D300212e3",
      data: encodeFunctionData({ abi: DEX_ABI, functionName: "mint", args: [address, parseEther("10000")] }),
      gas: BigInt(200000),
      gasPrice: BigInt(1),
      nonce,
      chainId: 72511,
      type: "legacy",
    });

    const hash = await client.sendRawTransaction({ serializedTransaction: rawTx });
    return Response.json({ hash });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
