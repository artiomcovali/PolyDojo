/* eslint-disable */
// Deploys Achievements, Leaderboard, GameManager and wires permissions
// so GameManager can mint DOJO (via ownership) and achievement NFTs (via setMinter).

const fs = require("fs");
const path = require("path");
const { createPublicClient, createWalletClient, http, encodeDeployData, formatEther } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { baseSepolia } = require("viem/chains");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const ART = path.join(__dirname, "artifacts");
function load(name) {
  return JSON.parse(fs.readFileSync(path.join(ART, `${name}.json`), "utf8"));
}

async function main() {
  const pkRaw = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pkRaw) throw new Error("DEPLOYER_PRIVATE_KEY missing in .env.local");
  const pk = (pkRaw.startsWith("0x") ? pkRaw : `0x${pkRaw}`);
  const account = privateKeyToAccount(pk);

  const DOJO = process.env.NEXT_PUBLIC_DOJO_TOKEN_ADDRESS;
  if (!DOJO || DOJO === "0x0000000000000000000000000000000000000000") {
    throw new Error("NEXT_PUBLIC_DOJO_TOKEN_ADDRESS not set");
  }

  const pub = createPublicClient({ chain: baseSepolia, transport: http() });
  const wallet = createWalletClient({ account, chain: baseSepolia, transport: http() });

  console.log("Deployer:", account.address);
  const bal = await pub.getBalance({ address: account.address });
  console.log("Balance: ", formatEther(bal), "ETH");
  console.log("DojoToken:", DOJO);
  console.log();

  async function deploy(name, args = []) {
    const art = load(name);
    const data = encodeDeployData({ abi: art.abi, bytecode: art.bytecode, args });
    console.log(`→ Deploying ${name}${args.length ? ` (${args.join(", ")})` : ""}...`);
    const hash = await wallet.sendTransaction({ data, gas: BigInt(4_000_000) });
    const receipt = await pub.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error(`${name} deploy failed`);
    console.log(`  ✓ ${name} @ ${receipt.contractAddress}`);
    return receipt.contractAddress;
  }

  const achievementsAddr = await deploy("Achievements", [""]);
  const leaderboardAddr = await deploy("Leaderboard");
  const gameManagerAddr = await deploy("GameManager", [DOJO, achievementsAddr]);
  console.log();

  async function send(label, to, abi, fn, args) {
    console.log(`→ ${label}...`);
    const hash = await wallet.writeContract({
      address: to,
      abi,
      functionName: fn,
      args,
      gas: BigInt(200_000),
    });
    const receipt = await pub.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error(`${label} failed`);
    console.log(`  ✓ tx ${hash}`);
  }

  // 1) Authorize GameManager to mint Achievement NFTs
  await send(
    "Achievements.setMinter(GameManager, true)",
    achievementsAddr,
    load("Achievements").abi,
    "setMinter",
    [gameManagerAddr, true]
  );

  // 2) Transfer DojoToken ownership to GameManager so GameManager.firstMint works
  await send(
    "DojoToken.transferOwnership(GameManager)",
    DOJO,
    load("DojoToken").abi,
    "transferOwnership",
    [gameManagerAddr]
  );

  console.log();
  console.log("=== Deployment complete ===");
  console.log("Add these to .env.local:");
  console.log(`NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS=${achievementsAddr}`);
  console.log(`NEXT_PUBLIC_LEADERBOARD_ADDRESS=${leaderboardAddr}`);
  console.log(`NEXT_PUBLIC_GAME_MANAGER_ADDRESS=${gameManagerAddr}`);

  // Auto-update .env.local
  const envPath = path.join(__dirname, "..", ".env.local");
  let env = fs.readFileSync(envPath, "utf8");
  const set = (key, value) => {
    const re = new RegExp(`^${key}=.*$`, "m");
    if (re.test(env)) env = env.replace(re, `${key}=${value}`);
    else env += `\n${key}=${value}`;
  };
  set("NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS", achievementsAddr);
  set("NEXT_PUBLIC_LEADERBOARD_ADDRESS", leaderboardAddr);
  set("NEXT_PUBLIC_GAME_MANAGER_ADDRESS", gameManagerAddr);
  fs.writeFileSync(envPath, env);
  console.log("\n.env.local updated.");
}

main().catch((e) => {
  console.error("FAILED:", e.shortMessage || e.message || e);
  process.exit(1);
});
