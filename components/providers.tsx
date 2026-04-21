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
    >
      <MiniAppProvider>{children}</MiniAppProvider>
    </MiniKitProvider>
  );
}
