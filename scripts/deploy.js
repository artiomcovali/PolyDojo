/* eslint-disable */
// Deploys DojoToken, Achievements, Leaderboard, GameManager and wires permissions:
// - GameManager gets minter access on DojoToken and Achievements
// - User's Smart Wallet calls firstMint via cron/admin

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

  const pub = createPublicClient({ chain: baseSepolia, transport: http() });
  const wallet = createWalletClient({ account, chain: baseSepolia, transport: http() });

  console.log("Deployer:", account.address);
  const bal = await pub.getBalance({ address: account.address });
  console.log("Balance: ", formatEther(bal), "ETH");
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

  // Deploy all four contracts fresh
  const dojoAddr = await deploy("DojoToken");
  const achievementsAddr = await deploy("Achievements", [""]);
  const leaderboardAddr = await deploy("Leaderboard");
  const gameManagerAddr = await deploy("GameManager", [dojoAddr, achievementsAddr]);
  console.log();

  // Grant GameManager mint/burn rights on DojoToken
  await send(
    "DojoToken.setMinter(GameManager, true)",
    dojoAddr,
    load("DojoToken").abi,
    "setMinter",
    [gameManagerAddr, true]
  );

  // Grant GameManager mint rights on Achievements
  await send(
    "Achievements.setMinter(GameManager, true)",
    achievementsAddr,
    load("Achievements").abi,
    "setMinter",
    [gameManagerAddr, true]
  );

  console.log();
  console.log("=== Deployment complete ===");
  console.log("Addresses updated in .env.local:");
  console.log(`NEXT_PUBLIC_DOJO_TOKEN_ADDRESS=${dojoAddr}`);
  console.log(`NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS=${achievementsAddr}`);
  console.log(`NEXT_PUBLIC_LEADERBOARD_ADDRESS=${leaderboardAddr}`);
  console.log(`NEXT_PUBLIC_GAME_MANAGER_ADDRESS=${gameManagerAddr}`);

  const envPath = path.join(__dirname, "..", ".env.local");
  let env = fs.readFileSync(envPath, "utf8");
  const set = (key, value) => {
    const re = new RegExp(`^${key}=.*$`, "m");
    if (re.test(env)) env = env.replace(re, `${key}=${value}`);
    else env += `\n${key}=${value}`;
  };
  set("NEXT_PUBLIC_DOJO_TOKEN_ADDRESS", dojoAddr);
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
