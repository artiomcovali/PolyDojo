import { env } from "@/lib/env";

// --- Contract Addresses ---
export const DOJO_TOKEN_ADDRESS = env.NEXT_PUBLIC_DOJO_TOKEN_ADDRESS as `0x${string}`;
export const GAME_MANAGER_ADDRESS = env.NEXT_PUBLIC_GAME_MANAGER_ADDRESS as `0x${string}`;
export const ACHIEVEMENTS_ADDRESS = env.NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS as `0x${string}`;
export const LEADERBOARD_ADDRESS = env.NEXT_PUBLIC_LEADERBOARD_ADDRESS as `0x${string}`;
export const CHAINLINK_BTC_USD = env.NEXT_PUBLIC_CHAINLINK_BTC_USD as `0x${string}`;

// --- DojoToken ABI (ERC-20 + mint) ---
export const DOJO_TOKEN_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
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
] as const;

// --- GameManager ABI ---
export const GAME_MANAGER_ABI = [
  {
    inputs: [{ name: "user", type: "address" }],
    name: "firstMint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "roundId", type: "uint256" },
      { name: "threshold", type: "uint256" },
    ],
    name: "createRound",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "roundId", type: "uint256" },
      { name: "isYes", type: "bool" },
      { name: "amount", type: "uint256" },
      { name: "oddsAtEntry", type: "uint256" },
    ],
    name: "placeBet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "roundId", type: "uint256" },
      { name: "chainlinkPrice", type: "uint256" },
      { name: "participants", type: "address[]" },
    ],
    name: "resolveRound",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimRefill",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "hasMinted",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "hasClaimedRefill",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "roundId", type: "uint256" }],
    name: "rounds",
    outputs: [
      { name: "threshold", type: "uint256" },
      { name: "resolutionPrice", type: "uint256" },
      { name: "startTime", type: "uint256" },
      { name: "resolved", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "roundId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    name: "getBet",
    outputs: [
      { name: "isYes", type: "bool" },
      { name: "amount", type: "uint256" },
      { name: "oddsAtEntry", type: "uint256" },
      { name: "exists", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// --- Achievements ABI (ERC-1155) ---
export const ACHIEVEMENTS_ABI = [
  {
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "id", type: "uint256" }],
    name: "uri",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Achievement token IDs
export const ACHIEVEMENT_IDS = {
  TRADER_BADGE: 1,
  SHARK_BADGE: 2,
  WHALE_BADGE: 3,
  LEGEND_BADGE: 4,
  BANKRUPT_BADGE: 5,
  STREAK_3: 10,
  STREAK_5: 11,
  STREAK_10: 12,
  SCENARIO_MASTER_ENTRY: 20,
  SCENARIO_MASTER_EXIT: 21,
  SCENARIO_MASTER_SIZING: 22,
  SCENARIO_MASTER_MOMENTUM: 23,
  SCENARIO_MASTER_LAST60: 24,
  PERFECT_ROUND: 30,
  CONTRARIAN_WIN: 31,
} as const;

// --- Leaderboard ABI ---
export const LEADERBOARD_ABI = [
  {
    inputs: [{ name: "player", type: "address" }],
    name: "scores",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "player", type: "address" },
      { name: "score", type: "uint256" },
    ],
    name: "updateScore",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getTopPlayers",
    outputs: [
      { name: "", type: "address[]" },
      { name: "", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// --- Chainlink Price Feed ABI ---
export const CHAINLINK_ABI = [
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
