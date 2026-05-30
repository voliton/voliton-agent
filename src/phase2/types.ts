// Represents a newly detected token from any launchpad
export interface NewToken {
  name: string
  symbol: string
  address: string
  launchpad: string       // 'Clanker' | 'Bankr' | 'Virtuals' | 'Flaunch'
  deployedAt: string
  devWallet: string
  twitterUrl?: string
  telegramUrl?: string
  websiteUrl?: string
  marketCap?: number
  volume24h?: number
  priceChange24h?: number
  dexUrl?: string
  imageUrl?: string       // Token logo/image URL
}

// Wallet entry stored in JSON
export interface WalletEntry {
  address: string
  label: string
  addedAt: string
  chatId: string
}

export interface WalletStorage {
  wallets: WalletEntry[]
}

// Plugin interface — add new launchpad by implementing this
export interface LaunchpadPlugin {
  name: string
  fetch(): Promise<NewToken[]>
}

// Result from GitHub + social identity check
export interface IdentityResult {
  githubRepo?: string
  githubCreatedAt?: string
  githubAge?: string
  isGithubSuspicious?: boolean
  githubStars?: number
}

// Dev behavior alert
export interface DevAlert {
  token: NewToken
  action: 'dump' | 'transfer' | 'buy'
  txHash: string
  amount: string
  timestamp: string
}
