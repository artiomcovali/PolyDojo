export interface Scenario {
  id: number;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  category: "entry" | "exit" | "sizing" | "momentum" | "last60";
  setup: {
    currentPrice: number;
    threshold: number;
    secondsRemaining: number;
    yesOdds: number;
    position: { isYes: boolean; entryOdds: number } | null;
    recentTrend: "up" | "down" | "flat" | "volatile";
  };
  choices: {
    text: string;
    correct: boolean;
    explanation: string;
  }[];
  xp: number;
}

export const scenarios: Scenario[] = [
  {
    id: 1,
    title: "The Safe Entry",
    description:
      "BTC is $400 below the threshold with 3 minutes left. The price has been drifting lower steadily.",
    difficulty: "Beginner",
    category: "entry",
    setup: {
      currentPrice: 67200,
      threshold: 67600,
      secondsRemaining: 180,
      yesOdds: 0.22,
      position: null,
      recentTrend: "down",
    },
    choices: [
      {
        text: "Buy NO at 78¢ — price is far below, momentum is down",
        correct: true,
        explanation:
          "Strong play. Price is $400 below threshold with downward momentum and 3 minutes left. NO at 78¢ gives good value.",
      },
      {
        text: "Buy YES at 22¢ — cheap odds, could spike back",
        correct: false,
        explanation:
          "Cheap doesn't mean good value. A $400 gap with downward momentum in 3 minutes is very hard to close.",
      },
      {
        text: "Wait for better odds",
        correct: false,
        explanation:
          "Waiting risks the odds getting worse. At 78¢ with this setup, NO is already well-priced.",
      },
      {
        text: "Skip this market entirely",
        correct: false,
        explanation:
          "This is one of the clearest setups you'll see. Skipping it means leaving easy points on the table.",
      },
    ],
    xp: 50,
  },
  {
    id: 2,
    title: "The Safe Exit",
    description:
      "You bought YES at 45¢. BTC has risen above the threshold and YES is now at 82¢ with 90 seconds left.",
    difficulty: "Beginner",
    category: "exit",
    setup: {
      currentPrice: 67750,
      threshold: 67600,
      secondsRemaining: 90,
      yesOdds: 0.82,
      position: { isYes: true, entryOdds: 0.45 },
      recentTrend: "up",
    },
    choices: [
      {
        text: "Sell YES now at 82¢ — lock in profit",
        correct: true,
        explanation:
          "Selling at 82¢ gives you 37¢ profit per share. With 90 seconds of volatility risk, locking in is smart.",
      },
      {
        text: "Hold to resolution — price is above threshold",
        correct: false,
        explanation:
          "Holding risks a last-minute reversal. You'd gain 18¢ more but risk losing your entire 37¢ profit.",
      },
      {
        text: "Buy more YES to increase position",
        correct: false,
        explanation:
          "At 82¢, YES is expensive. Adding at this price gives poor risk/reward with 90 seconds of volatility ahead.",
      },
      {
        text: "Sell half, hold half",
        correct: false,
        explanation:
          "Not bad, but with 90 seconds left, the risk of reversal makes a full exit the cleaner play here.",
      },
    ],
    xp: 50,
  },
  {
    id: 3,
    title: "Overpriced YES",
    description:
      "BTC is only $50 above the threshold. YES is trading at 72¢ with 4 minutes left. Market is calm.",
    difficulty: "Beginner",
    category: "entry",
    setup: {
      currentPrice: 67650,
      threshold: 67600,
      secondsRemaining: 240,
      yesOdds: 0.72,
      position: null,
      recentTrend: "flat",
    },
    choices: [
      {
        text: "Skip — YES at 72¢ is overpriced for only $50 above threshold",
        correct: true,
        explanation:
          "With 4 minutes left and only $50 above, a lot can change. 72¢ is too rich — the fair odds are closer to 55¢.",
      },
      {
        text: "Buy YES at 72¢ — price is above threshold",
        correct: false,
        explanation:
          "Being above threshold doesn't make YES worth 72¢. With 4 minutes left, $50 is nothing — BTC moves $50 in seconds.",
      },
      {
        text: "Buy NO at 28¢ — it's cheap",
        correct: false,
        explanation:
          "NO at 28¢ is slightly underpriced here but the edge is thin. Better to skip than bet on a coin flip.",
      },
      {
        text: "Buy YES but with a small position",
        correct: false,
        explanation:
          "A small bad bet is still a bad bet. The issue is price, not size.",
      },
    ],
    xp: 50,
  },
  {
    id: 4,
    title: "The Momentum Read",
    description:
      "BTC has been climbing steadily for the last 2 minutes (+$250). It's now $100 below threshold with 2 minutes left.",
    difficulty: "Beginner",
    category: "momentum",
    setup: {
      currentPrice: 67500,
      threshold: 67600,
      secondsRemaining: 120,
      yesOdds: 0.48,
      position: null,
      recentTrend: "up",
    },
    choices: [
      {
        text: "Buy YES at 48¢ — momentum is clearly upward",
        correct: true,
        explanation:
          "Strong upward momentum with only $100 to close in 2 minutes. YES at 48¢ is underpriced given the trend.",
      },
      {
        text: "Buy NO at 52¢ — still below threshold",
        correct: false,
        explanation:
          "Being below threshold means nothing when momentum is strongly upward. Price gained $250 in 2 minutes.",
      },
      {
        text: "Wait for BTC to cross threshold first",
        correct: false,
        explanation:
          "By then YES will be 65¢+. The whole point is buying before the move completes.",
      },
      {
        text: "Skip — too unpredictable",
        correct: false,
        explanation:
          "Strong momentum with a small gap is actually one of the more predictable setups.",
      },
    ],
    xp: 50,
  },
  {
    id: 5,
    title: "Position Sizing Basics",
    description:
      "YES and NO are both at 50¢. BTC is exactly at the threshold with 3 minutes left. You have 1,000 $DOJO. How much do you bet?",
    difficulty: "Beginner",
    category: "sizing",
    setup: {
      currentPrice: 67600,
      threshold: 67600,
      secondsRemaining: 180,
      yesOdds: 0.5,
      position: null,
      recentTrend: "flat",
    },
    choices: [
      {
        text: "Bet 50-100 $DOJO — small size for a coin flip",
        correct: true,
        explanation:
          "At 50/50 odds with no edge, you should bet small or skip. 5-10% of your stack limits downside.",
      },
      {
        text: "Bet 500 $DOJO — go big, it's 50/50",
        correct: false,
        explanation:
          "50/50 means no edge. Betting half your stack on a coin flip is how you go broke fast.",
      },
      {
        text: "Bet 200 $DOJO on YES — slight bullish feeling",
        correct: false,
        explanation:
          "A 'feeling' is not a strategy. Without a real edge, keep position size small.",
      },
      {
        text: "All in on NO — 1,000 $DOJO",
        correct: false,
        explanation:
          "Never go all-in on a 50/50. Bankroll management is the #1 skill in prediction markets.",
      },
    ],
    xp: 50,
  },
  {
    id: 6,
    title: "Last 60 Seconds",
    description:
      "You hold YES. BTC is $80 above threshold with 60 seconds left. YES is at 74¢. Price is jittery.",
    difficulty: "Intermediate",
    category: "last60",
    setup: {
      currentPrice: 67680,
      threshold: 67600,
      secondsRemaining: 60,
      yesOdds: 0.74,
      position: { isYes: true, entryOdds: 0.55 },
      recentTrend: "volatile",
    },
    choices: [
      {
        text: "Sell YES at 74¢ — lock in 19¢ profit, avoid last-minute chaos",
        correct: true,
        explanation:
          "With jittery price action, $80 above threshold is not safe in 60 seconds. Locking in 19¢/share profit is the disciplined play.",
      },
      {
        text: "Hold — $80 above should resolve YES",
        correct: false,
        explanation:
          "$80 can vanish in seconds when price is jittery. The extra 26¢ upside isn't worth risking your 19¢ profit.",
      },
      {
        text: "Buy more YES — it's going to win",
        correct: false,
        explanation:
          "Adding at 74¢ in the last 60 seconds with volatile price action is extremely risky.",
      },
      {
        text: "Sell half, hold half",
        correct: false,
        explanation:
          "Not terrible, but the jittery price action makes a full exit the safer choice.",
      },
    ],
    xp: 75,
  },
  {
    id: 7,
    title: "The Spike Trap",
    description:
      "BTC suddenly spiked $300 upward in 20 seconds. It's now $50 above threshold. YES jumped to 68¢. 2 minutes left.",
    difficulty: "Intermediate",
    category: "momentum",
    setup: {
      currentPrice: 67650,
      threshold: 67600,
      secondsRemaining: 120,
      yesOdds: 0.68,
      position: null,
      recentTrend: "up",
    },
    choices: [
      {
        text: "Don't buy — spikes often reverse, and YES at 68¢ is expensive for $50 above",
        correct: true,
        explanation:
          "Sharp spikes frequently retrace. Buying at 68¢ when price is barely above threshold after a spike is chasing the move.",
      },
      {
        text: "Buy YES — momentum is strong",
        correct: false,
        explanation:
          "The momentum already happened. Buying after a $300 spike at premium odds is classic FOMO trading.",
      },
      {
        text: "Buy NO — the spike will reverse",
        correct: false,
        explanation:
          "While spikes often retrace, it's not guaranteed. NO at 32¢ isn't cheap enough for the risk.",
      },
      {
        text: "Wait 30 seconds then decide",
        correct: false,
        explanation:
          "Reasonable instinct, but the best play is to avoid the trade entirely. The risk/reward is poor on both sides.",
      },
    ],
    xp: 75,
  },
  {
    id: 8,
    title: "The Reversal Setup",
    description:
      "BTC overshot threshold by $200, then reversed and is now $150 below. 2.5 minutes left. YES dropped to 30¢.",
    difficulty: "Intermediate",
    category: "entry",
    setup: {
      currentPrice: 67450,
      threshold: 67600,
      secondsRemaining: 150,
      yesOdds: 0.3,
      position: null,
      recentTrend: "down",
    },
    choices: [
      {
        text: "Buy NO at 70¢ — reversal confirmed, price heading away from threshold",
        correct: true,
        explanation:
          "The failed breakout above threshold followed by reversal is a strong signal. NO at 70¢ with downward momentum is solid.",
      },
      {
        text: "Buy YES at 30¢ — it was above threshold recently",
        correct: false,
        explanation:
          "Past price action doesn't predict future movement. The reversal signals sellers are in control.",
      },
      {
        text: "Wait for NO to get cheaper",
        correct: false,
        explanation:
          "NO might get cheaper but it might not. 70¢ is fair value given the setup — don't get greedy.",
      },
      {
        text: "Skip — too volatile to read",
        correct: false,
        explanation:
          "A clear reversal pattern is actually one of the easier reads. Overshoot + reject = continuation.",
      },
    ],
    xp: 75,
  },
  {
    id: 9,
    title: "The Calm Market",
    description:
      "BTC has barely moved in 3 minutes — hovering $30 above threshold. YES at 56¢. 2 minutes left. Very low volatility.",
    difficulty: "Intermediate",
    category: "sizing",
    setup: {
      currentPrice: 67630,
      threshold: 67600,
      secondsRemaining: 120,
      yesOdds: 0.56,
      position: null,
      recentTrend: "flat",
    },
    choices: [
      {
        text: "Small YES bet — calm markets tend to stay where they are",
        correct: true,
        explanation:
          "In low volatility, price is less likely to make big moves. YES at 56¢ with $30 above is slight value, but keep size small since the edge is thin.",
      },
      {
        text: "Big YES bet — calm means it'll stay above",
        correct: false,
        explanation:
          "Even calm markets can shift. $30 is razor-thin. The edge exists but doesn't justify a large position.",
      },
      {
        text: "Buy NO — it only takes one move to go below",
        correct: false,
        explanation:
          "True, but low volatility means that one move is less likely. NO at 44¢ is slightly overpriced here.",
      },
      {
        text: "Skip — no real edge in calm markets",
        correct: false,
        explanation:
          "Actually, calm markets are slightly predictable — price tends to stay near where it is. There's a small YES edge.",
      },
    ],
    xp: 75,
  },
  {
    id: 10,
    title: "Contrarian Entry",
    description:
      "Everyone is buying YES at 78¢. BTC is $200 above threshold but momentum has stalled. 3 minutes left.",
    difficulty: "Intermediate",
    category: "entry",
    setup: {
      currentPrice: 67800,
      threshold: 67600,
      secondsRemaining: 180,
      yesOdds: 0.78,
      position: null,
      recentTrend: "flat",
    },
    choices: [
      {
        text: "Buy NO at 22¢ — YES is overpriced with stalled momentum",
        correct: true,
        explanation:
          "When momentum stalls, the crowd is often wrong. YES at 78¢ with 3 minutes of risk and flat momentum is overpriced. NO at 22¢ has great risk/reward.",
      },
      {
        text: "Buy YES — $200 above is a big lead",
        correct: false,
        explanation:
          "3 minutes is a long time. $200 can evaporate quickly, especially when momentum has stalled.",
      },
      {
        text: "Skip — don't fight the crowd",
        correct: false,
        explanation:
          "The crowd creates mispricings. When YES is overpriced due to recency bias, contrarian NO is profitable.",
      },
      {
        text: "Wait for YES to drop then buy",
        correct: false,
        explanation:
          "If YES drops, it means NO is getting more expensive. The time to be contrarian is now, when NO is cheap.",
      },
    ],
    xp: 75,
  },
  {
    id: 11,
    title: "The Double Dip",
    description:
      "BTC touched threshold twice from below and got rejected both times. It's now $120 below. 2 minutes left.",
    difficulty: "Intermediate",
    category: "momentum",
    setup: {
      currentPrice: 67480,
      threshold: 67600,
      secondsRemaining: 120,
      yesOdds: 0.35,
      position: null,
      recentTrend: "down",
    },
    choices: [
      {
        text: "Buy NO at 65¢ — double rejection is a strong bearish signal",
        correct: true,
        explanation:
          "Two failed attempts to break threshold is a classic technical pattern. Sellers are strong at that level. NO is well-priced.",
      },
      {
        text: "Buy YES at 35¢ — third time's the charm",
        correct: false,
        explanation:
          "Failed breakouts typically lead to continuation away from the level, not through it. Third attempt in 2 minutes is unlikely.",
      },
      {
        text: "Wait to see if it tests again",
        correct: false,
        explanation:
          "A third test is unlikely with 2 minutes left. By waiting, you risk NO getting more expensive.",
      },
      {
        text: "Skip — double dips are hard to read",
        correct: false,
        explanation:
          "Double rejections are actually one of the clearest patterns. Two tests + two rejections = strong resistance.",
      },
    ],
    xp: 75,
  },
  {
    id: 12,
    title: "Early Exit Math",
    description:
      "You hold NO (bought at 55¢). NO is now at 75¢ with 2 minutes left. BTC is $180 below threshold, drifting lower.",
    difficulty: "Intermediate",
    category: "exit",
    setup: {
      currentPrice: 67420,
      threshold: 67600,
      secondsRemaining: 120,
      yesOdds: 0.25,
      position: { isYes: false, entryOdds: 0.55 },
      recentTrend: "down",
    },
    choices: [
      {
        text: "Hold to resolution — NO should win, and you'll get 100¢ instead of 75¢",
        correct: true,
        explanation:
          "With $180 below and downward momentum, NO winning is very likely. Holding gives you 45¢ profit vs 20¢ by selling now. The extra risk is small.",
      },
      {
        text: "Sell at 75¢ — take the guaranteed profit",
        correct: false,
        explanation:
          "25¢ more upside vs $180 gap with momentum in your favor. This is a case where holding is clearly better.",
      },
      {
        text: "Sell half at 75¢, hold half",
        correct: false,
        explanation:
          "Reasonable in general, but the setup strongly favors holding. $180 below with momentum is as safe as it gets.",
      },
      {
        text: "Buy more NO at 75¢",
        correct: false,
        explanation:
          "NO at 75¢ only gives 25¢ upside vs 75¢ downside. Adding at this price is poor risk/reward even if NO wins.",
      },
    ],
    xp: 75,
  },
  {
    id: 13,
    title: "High Volatility Entry",
    description:
      "BTC is swinging wildly — $500 range in the last 2 minutes. Currently $100 above threshold. YES at 58¢. 3 minutes left.",
    difficulty: "Advanced",
    category: "entry",
    setup: {
      currentPrice: 67700,
      threshold: 67600,
      secondsRemaining: 180,
      yesOdds: 0.58,
      position: null,
      recentTrend: "volatile",
    },
    choices: [
      {
        text: "Skip — high volatility makes any position risky",
        correct: true,
        explanation:
          "With $500 swings, $100 above threshold means nothing. Both YES and NO are essentially coin flips. The smart play is no play.",
      },
      {
        text: "Buy YES — price is above threshold",
        correct: false,
        explanation:
          "In high volatility, $100 above is meaningless. Price could be $400 below in 30 seconds.",
      },
      {
        text: "Buy NO — volatility will push it below",
        correct: false,
        explanation:
          "Volatility goes both ways. NO at 42¢ isn't cheap enough to justify the risk.",
      },
      {
        text: "Small YES bet — at least I'm on the right side",
        correct: false,
        explanation:
          "There is no 'right side' in extreme volatility. $100 above with $500 swings has no meaningful edge.",
      },
    ],
    xp: 100,
  },
  {
    id: 14,
    title: "The Momentum Trap",
    description:
      "BTC is rallying hard (+$350 in 90 seconds). Only $30 below threshold now. YES at 52¢. 1.5 minutes left.",
    difficulty: "Advanced",
    category: "momentum",
    setup: {
      currentPrice: 67570,
      threshold: 67600,
      secondsRemaining: 90,
      yesOdds: 0.52,
      position: null,
      recentTrend: "up",
    },
    choices: [
      {
        text: "Buy YES at 52¢ — momentum will carry it through",
        correct: false,
        explanation:
          "Strong momentum often stalls near round numbers / thresholds. Resistance at the threshold level is real.",
      },
      {
        text: "Wait to see if it breaks through — then buy YES",
        correct: true,
        explanation:
          "Let the breakout confirm. If BTC clears threshold convincingly, YES will be more expensive but much safer. If it stalls, you avoided a losing trade.",
      },
      {
        text: "Buy NO — rallies always fade",
        correct: false,
        explanation:
          "'Always' is dangerous thinking. This rally could break through. NO at 48¢ isn't cheap enough.",
      },
      {
        text: "Buy YES but set a mental stop to sell if it reverses",
        correct: false,
        explanation:
          "Mental stops are unreliable, especially in fast markets. Better to wait for confirmation.",
      },
    ],
    xp: 100,
  },
  {
    id: 15,
    title: "The Dead Cat Bounce",
    description:
      "BTC dropped $400, then bounced $150 in the last 30 seconds. Still $250 below threshold. YES at 18¢. 2 minutes left.",
    difficulty: "Advanced",
    category: "momentum",
    setup: {
      currentPrice: 67350,
      threshold: 67600,
      secondsRemaining: 120,
      yesOdds: 0.18,
      position: null,
      recentTrend: "down",
    },
    choices: [
      {
        text: "Buy NO at 82¢ — the bounce is a dead cat bounce, $250 gap is too large",
        correct: true,
        explanation:
          "A small bounce after a big drop usually isn't a reversal. $250 below with 2 minutes is a tall order even with the bounce.",
      },
      {
        text: "Buy YES at 18¢ — bounce shows recovery starting",
        correct: false,
        explanation:
          "A $150 bounce after a $400 drop is typical dead cat behavior. It doesn't signal recovery.",
      },
      {
        text: "Wait — the bounce might continue",
        correct: false,
        explanation:
          "Even if the bounce continues, $250 in 2 minutes is a big ask. NO at 82¢ is well-priced now.",
      },
      {
        text: "Skip — hard to read bounces after crashes",
        correct: false,
        explanation:
          "Actually this is a readable pattern. Dead cat bounces after sharp drops are common and NO is clearly favored.",
      },
    ],
    xp: 100,
  },
  {
    id: 16,
    title: "Sizing for Conviction",
    description:
      "BTC is $500 below threshold with 1 minute left. NO at 94¢. You have 800 $DOJO. Almost certain NO wins.",
    difficulty: "Advanced",
    category: "sizing",
    setup: {
      currentPrice: 67100,
      threshold: 67600,
      secondsRemaining: 60,
      yesOdds: 0.06,
      position: null,
      recentTrend: "down",
    },
    choices: [
      {
        text: "Bet 200 $DOJO on NO — guaranteed 6¢ profit per share is still profit",
        correct: true,
        explanation:
          "At 94¢ with 6¢ upside, even large positions yield small returns. 200 $DOJO earns ~$12.70. Size moderately — the edge is real but reward is small.",
      },
      {
        text: "Bet 700 $DOJO on NO — it's basically free money",
        correct: false,
        explanation:
          "'Basically free money' thinking leads to ruin. Black swan events happen. 700 on a 6¢ upside bet risks 700 to make ~$44. Not worth it.",
      },
      {
        text: "Skip — 6¢ profit per share isn't worth it",
        correct: false,
        explanation:
          "Small edges add up. Skipping high-probability bets with positive expected value is leaving money on the table.",
      },
      {
        text: "Buy YES at 6¢ — lottery ticket",
        correct: false,
        explanation:
          "BTC recovering $500 in 60 seconds would be historically unprecedented. This is burning money.",
      },
    ],
    xp: 100,
  },
  {
    id: 17,
    title: "The 2-Minute Entry",
    description:
      "New market just opened 3 minutes ago. You were away and now have 2 minutes left. BTC is $80 above threshold. YES at 62¢.",
    difficulty: "Advanced",
    category: "entry",
    setup: {
      currentPrice: 67680,
      threshold: 67600,
      secondsRemaining: 120,
      yesOdds: 0.62,
      position: null,
      recentTrend: "flat",
    },
    choices: [
      {
        text: "Small YES bet — $80 above with flat action slightly favors YES",
        correct: true,
        explanation:
          "With flat trend and $80 above, YES has a slight edge at 62¢ for 2 minutes. Keep it small since there's not much time to recover if wrong.",
      },
      {
        text: "Big YES bet — need to make up for missing the first 3 minutes",
        correct: false,
        explanation:
          "Never size up to compensate for missed opportunities. That's revenge trading.",
      },
      {
        text: "Buy NO at 38¢ — late entries often get trapped",
        correct: false,
        explanation:
          "Late entry bias isn't real. The odds are the odds. With $80 above and flat action, NO is slightly overpriced at 38¢.",
      },
      {
        text: "Skip — not enough time to manage the position",
        correct: false,
        explanation:
          "2 minutes is enough. Many of the best trades happen in the final minutes when odds are clearer.",
      },
    ],
    xp: 100,
  },
  {
    id: 18,
    title: "Back-to-Back Markets",
    description:
      "You just won 3 rounds in a row. New market opened. BTC is exactly at threshold. YES/NO both at 50¢. You feel invincible.",
    difficulty: "Advanced",
    category: "sizing",
    setup: {
      currentPrice: 67600,
      threshold: 67600,
      secondsRemaining: 300,
      yesOdds: 0.5,
      position: null,
      recentTrend: "flat",
    },
    choices: [
      {
        text: "Small bet or skip — 50/50 is a coin flip regardless of streak",
        correct: true,
        explanation:
          "Past wins don't change current odds. A 50/50 market has zero edge. Your streak is irrelevant to this market.",
      },
      {
        text: "Bet big on YES — riding the hot streak",
        correct: false,
        explanation:
          "Hot hand fallacy. Your previous wins have zero impact on this independent market event.",
      },
      {
        text: "Bet big on NO — due for a loss, hedge by picking NO",
        correct: false,
        explanation:
          "Gambler's fallacy. You're not 'due' for anything. Each market is independent.",
      },
      {
        text: "Medium YES bet — confidence is an edge",
        correct: false,
        explanation:
          "Confidence from winning isn't an analytical edge. The market doesn't care about your feelings.",
      },
    ],
    xp: 100,
  },
  {
    id: 19,
    title: "The News Spike",
    description:
      "You hold NO (bought at 60¢). Suddenly BTC spikes $300 — now $100 above threshold. YES at 65¢. 2 minutes left.",
    difficulty: "Expert",
    category: "exit",
    setup: {
      currentPrice: 67700,
      threshold: 67600,
      secondsRemaining: 120,
      yesOdds: 0.65,
      position: { isYes: false, entryOdds: 0.6 },
      recentTrend: "up",
    },
    choices: [
      {
        text: "Sell NO immediately at 35¢ — cut losses before it gets worse",
        correct: true,
        explanation:
          "After a sudden $300 spike, the situation has fundamentally changed. Selling at 35¢ means a 25¢ loss per share, but holding could mean losing 60¢ per share.",
      },
      {
        text: "Hold — spikes often reverse",
        correct: false,
        explanation:
          "Hope is not a strategy. While spikes can reverse, you're now $100 wrong-side with 2 minutes of risk.",
      },
      {
        text: "Buy more NO to average down",
        correct: false,
        explanation:
          "Averaging down on a losing position after a fundamental shift is how traders blow up.",
      },
      {
        text: "Sell NO and flip to YES",
        correct: false,
        explanation:
          "Selling NO is right, but chasing the spike with YES at 65¢ is FOMO. Just take the loss and wait for the next market.",
      },
    ],
    xp: 150,
  },
  {
    id: 20,
    title: "The Perfect Round",
    description:
      "BTC is $180 below threshold. Momentum is downward. 3.5 minutes left. NO at 68¢. You have 600 $DOJO. After entry, price drops further — NO hits 85¢ with 1 minute left.",
    difficulty: "Expert",
    category: "exit",
    setup: {
      currentPrice: 67420,
      threshold: 67600,
      secondsRemaining: 210,
      yesOdds: 0.32,
      position: null,
      recentTrend: "down",
    },
    choices: [
      {
        text: "Buy NO at 68¢ with 100 $DOJO, then sell at 85¢ with 1 minute left",
        correct: true,
        explanation:
          "Perfect execution: good entry (68¢ with strong signal), appropriate size (1/6 of stack), and profit-taking at 85¢ before resolution risk. This is the template for a high-scoring round.",
      },
      {
        text: "Buy NO at 68¢ with 300 $DOJO and hold to resolution",
        correct: false,
        explanation:
          "Entry is good but 50% of stack is too large, and holding to resolution when you can lock in 85¢ is greedy.",
      },
      {
        text: "Wait for NO to hit 60¢ then buy big",
        correct: false,
        explanation:
          "NO is trending up, not down. Waiting for cheaper odds means you'll miss the trade entirely.",
      },
      {
        text: "Buy NO at 68¢ with 100 $DOJO and hold to resolution for max profit",
        correct: false,
        explanation:
          "Close, but selling at 85¢ is better. The last minute carries resolution risk, and 85¢ locks in 17¢/share vs hoping for 32¢/share.",
      },
    ],
    xp: 150,
  },
];
