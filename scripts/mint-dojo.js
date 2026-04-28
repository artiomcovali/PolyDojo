/* eslint-disable */
// One-off: mint $DOJO to a wallet for demos/testing.
// Usage: node scripts/mint-dojo.js [recipient] [amount]
//   recipient defaults to your dev wallet, amount defaults to 1000.

require("dotenv").config({ path: ".env.local" });
const { createWalletClient, createPublicClient, http, parseEther } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { baseSepolia } = require("viem/chains");

const DOJO_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

async function main() {
  const recipient = process.argv[2] || "0x6B65E5DfeD1b1A2F8730E887c7A9D6dCf4F3Cbc8";
  const amount = process.argv[3] || "1000";
  const dojo = process.env.NEXT_PUBLIC_DOJO_TOKEN_ADDRESS;
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!dojo) throw new Error("NEXT_PUBLIC_DOJO_TOKEN_ADDRESS missing in .env.local");
  if (!pk) throw new Error("DEPLOYER_PRIVATE_KEY missing in .env.local");

  const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);
  const wallet = createWalletClient({ account, chain: baseSepolia, transport: http() });
  const client = createPublicClient({ chain: baseSepolia, transport: http() });

  const before = await client.readContract({ address: dojo, abi: DOJO_ABI, functionName: "balanceOf", args: [recipient] });
  console.log(`balance before: ${before} wei`);

  const txHash = await wallet.writeContract({
    address: dojo,
    abi: DOJO_ABI,
    functionName: "mint",
    args: [recipient, parseEther(amount)],
  });
  console.log(`tx: ${txHash}`);
  const receipt = await client.waitForTransactionReceipt({ hash: txHash });
  if (receipt.status !== "success") throw new Error(`mint reverted (${txHash})`);

  const after = await client.readContract({ address: dojo, abi: DOJO_ABI, functionName: "balanceOf", args: [recipient] });
  console.log(`minted ${amount} DOJO to ${recipient}`);
  console.log(`balance after:  ${after} wei`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
