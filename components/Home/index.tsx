'use client';

import Login from '@/components/Login';
import NavTabs, { Tab } from '@/components/shared/NavTabs';
import TradeTab from '@/components/tabs/TradeTab';
import AgentTab from '@/components/tabs/AgentTab';
import LearnTab from '@/components/tabs/LearnTab';
import LeaderboardTab from '@/components/tabs/LeaderboardTab';
import ProfilePage from '@/components/pages/ProfilePage';
import SettingsPage from '@/components/pages/SettingsPage';
import { useSignIn } from '@/hooks/use-sign-in';
import { useUserData } from '@/hooks/use-user-data';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import Image from 'next/image';
import { useState } from 'react';

type Page = 'main' | 'profile' | 'settings';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('trade');
  const [activePage, setActivePage] = useState<Page>('main');
  const [presets, setPresets] = useState([50, 100, 250]);
  const [soundEffects, setSoundEffects] = useState(true);
  const { context } = useMiniKit();
  const { signIn, isSignedIn, isLoading, error, user } = useSignIn({
    autoSignIn: false,
  });
  const [devBypassed, setDevBypassed] = useState(false);

  const userName = user?.display_name || context?.user?.displayName || 'Trader';
  const pfpUrl = user?.pfp_url || context?.user?.pfpUrl;
  const walletAddress =
    user?.custody_address || (context?.user as { custodyAddress?: string })?.custodyAddress || null;

  const { dbUser, saveRound } = useUserData({
    fid: user?.fid || null,
    address: walletAddress,
    displayName: userName,
    pfpUrl,
  });

  // Gate: must be signed in to access the app
  if (!isSignedIn && !devBypassed) {
    return (
      <Login
        onSignIn={signIn}
        isLoading={isLoading}
        error={error}
        onBypass={() => setDevBypassed(true)}
      />
    );
  }

  return (
    <>
      {/* Main app — always mounted */}
      <div className={`min-h-screen bg-[#0a0a0a] text-white ${activePage !== 'main' ? 'hidden' : ''}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-gray-800/50 px-4 py-3">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-2">
              <Image src="/LogoWhite.png" alt="PolyDojo" width={48} height={48} />
              <div>
                <h1 className="text-sm font-bold leading-none">PolyDojo</h1>
                <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                  Prediction Market Trainer
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Profile */}
              <button
                onClick={() => setActivePage('profile')}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                {pfpUrl ? (
                  <Image
                    src={pfpUrl}
                    alt={userName}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px]">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-right">
                  <span className="text-xs text-gray-300 block leading-none">{userName}</span>
                  {walletAddress && (
                    <span className="text-[9px] text-gray-600 block leading-none mt-0.5">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                  )}
                </div>
              </button>
              {/* Settings */}
              <button
                onClick={() => setActivePage('settings')}
                className="w-7 h-7 rounded-lg bg-gray-800/60 hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 pt-3 pb-20 max-w-lg mx-auto">
          <div className={activeTab === 'trade' ? '' : 'hidden'}><TradeTab presets={presets} soundEffects={soundEffects} saveRound={saveRound} /></div>
          <div className={activeTab === 'agent' ? '' : 'hidden'}><AgentTab /></div>
          <div className={activeTab === 'learn' ? '' : 'hidden'}><LearnTab userId={dbUser?.id} /></div>
          <div className={activeTab === 'leaderboard' ? '' : 'hidden'}><LeaderboardTab
                userScore={dbUser?.total_score}
                userBalance={dbUser?.balance}
                userWinRate={dbUser?.win_rate}
                userStreak={dbUser?.best_streak}
                userRoundsPlayed={dbUser?.rounds_played}
              /></div>
        </main>

        {/* Bottom Nav */}
        <NavTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Profile overlay */}
      {activePage === 'profile' && (
        <ProfilePage
          userName={userName}
          pfpUrl={pfpUrl}
          walletAddress={walletAddress}
          dbUser={dbUser}
          onClose={() => setActivePage('main')}
        />
      )}

      {/* Settings overlay */}
      {activePage === 'settings' && (
        <SettingsPage
          presets={presets}
          onPresetsChange={setPresets}
          soundEffects={soundEffects}
          onSoundEffectsChange={setSoundEffects}
          onClose={() => setActivePage('main')}
        />
      )}
    </>
  );
}
