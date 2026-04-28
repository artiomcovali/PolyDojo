'use client';

import { MiniAppProvider } from '@/contexts/miniapp-context';
import { env } from '@/lib/env';
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import { baseSepolia } from 'viem/chains';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MiniKitProvider
      projectId={env.NEXT_PUBLIC_MINIKIT_PROJECT_ID}
      notificationProxyUrl="/api/notification"
      chain={baseSepolia}
      config={{
        // Force Coinbase Smart Wallet (passkey) — EOAs can't receive paymaster
        // sponsorship, so we don't let users create one.
        wallet: { preference: 'smartWalletOnly' },
        // Sponsor gas for every tx via CDP paymaster on Base Sepolia.
        // Leave unset in env to fall back to user-paid gas.
        paymaster: env.NEXT_PUBLIC_CDP_PAYMASTER_URL || undefined,
      }}
    >
      <MiniAppProvider>{children}</MiniAppProvider>
    </MiniKitProvider>
  );
}
