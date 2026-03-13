import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NEYNAR_API_KEY: z.string().optional().default(""),
    JWT_SECRET: z.string().min(1),
    REDIS_URL: z.string().optional().default(""),
    REDIS_TOKEN: z.string().optional().default(""),
    GROQ_API_KEY: z.string().optional().default(""),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),
    DEPLOYER_PRIVATE_KEY: z.string().optional().default(""),
  },
  client: {
    NEXT_PUBLIC_URL: z.string().min(1),
    NEXT_PUBLIC_APP_ENV: z
      .enum(["development", "production"])
      .optional()
      .default("development"),
    NEXT_PUBLIC_MINIKIT_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_FARCASTER_HEADER: z.string().optional().default(""),
    NEXT_PUBLIC_FARCASTER_PAYLOAD: z.string().optional().default(""),
    NEXT_PUBLIC_FARCASTER_SIGNATURE: z.string().optional().default(""),
    NEXT_PUBLIC_SUPABASE_URL: z.string().optional().default(""),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().default(""),
    NEXT_PUBLIC_DOJO_TOKEN_ADDRESS: z.string().optional().default("0x0000000000000000000000000000000000000000"),
    NEXT_PUBLIC_GAME_MANAGER_ADDRESS: z.string().optional().default("0x0000000000000000000000000000000000000000"),
    NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS: z.string().optional().default("0x0000000000000000000000000000000000000000"),
    NEXT_PUBLIC_LEADERBOARD_ADDRESS: z.string().optional().default("0x0000000000000000000000000000000000000000"),
    NEXT_PUBLIC_CHAINLINK_BTC_USD: z.string().optional().default("0x64c911996D3c6aC71f9b455B1E8E7266BcbBF15"),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_MINIKIT_PROJECT_ID: process.env.NEXT_PUBLIC_MINIKIT_PROJECT_ID,
    NEXT_PUBLIC_FARCASTER_HEADER: process.env.NEXT_PUBLIC_FARCASTER_HEADER,
    NEXT_PUBLIC_FARCASTER_PAYLOAD: process.env.NEXT_PUBLIC_FARCASTER_PAYLOAD,
    NEXT_PUBLIC_FARCASTER_SIGNATURE: process.env.NEXT_PUBLIC_FARCASTER_SIGNATURE,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_DOJO_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_DOJO_TOKEN_ADDRESS,
    NEXT_PUBLIC_GAME_MANAGER_ADDRESS: process.env.NEXT_PUBLIC_GAME_MANAGER_ADDRESS,
    NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS: process.env.NEXT_PUBLIC_ACHIEVEMENTS_ADDRESS,
    NEXT_PUBLIC_LEADERBOARD_ADDRESS: process.env.NEXT_PUBLIC_LEADERBOARD_ADDRESS,
    NEXT_PUBLIC_CHAINLINK_BTC_USD: process.env.NEXT_PUBLIC_CHAINLINK_BTC_USD,
  },
});
