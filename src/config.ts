import dotenv from 'dotenv'
dotenv.config()

export const config = {
  maia: {
    apiKey: process.env.MAIA_API_KEY || '',
    baseURL: process.env.MAIA_BASE_URL || 'https://api.maiarouter.ai/v1',
    model: process.env.MAIA_MODEL || 'maia/claude-sonnet-4-5',
  },
  cdp: {
    apiKeyName: process.env.CDP_API_KEY_NAME || '',
    privateKey: process.env.CDP_API_KEY_PRIVATE_KEY || '',
  },
  network: process.env.NETWORK_ID || 'base-mainnet',
  basescan: {
    apiKey: process.env.BASESCAN_API_KEY || '',
  },
  github: {
    token: process.env.GITHUB_TOKEN || '',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    channelId: process.env.TELEGRAM_CHANNEL_ID || '',
  },
  x: {
    accessToken: process.env.X_ACCESS_TOKEN || '',
    autoPostEnabled: (process.env.X_AUTO_POST_ENABLED || 'false').toLowerCase() === 'true',
    walletMinTxCount: parseInt(process.env.X_WALLET_MIN_TX_COUNT || '2'),
    walletMinTokenAmount: parseFloat(process.env.X_WALLET_MIN_TOKEN_AMOUNT || '100000'),
    walletCooldownMs: parseInt(process.env.X_WALLET_COOLDOWN_MS || '1800000'),
    voiceLogMaxEntries: parseInt(process.env.X_VOICE_LOG_MAX_ENTRIES || '1000'),
  },
  flaunch: {
    apiKey: process.env.FLAUNCH_API_KEY || '',
  },
  scanner: {
    intervalMs: parseInt(process.env.SCAN_INTERVAL_MS || '60000'),
    walletCheckIntervalMs: parseInt(process.env.WALLET_CHECK_INTERVAL_MS || '300000'),
  }
}

export function validateConfig() {
  const missing: string[] = []

  if (!config.maia.apiKey) missing.push('MAIA_API_KEY')
  if (!config.cdp.apiKeyName) missing.push('CDP_API_KEY_NAME')
  if (!config.cdp.privateKey) missing.push('CDP_API_KEY_PRIVATE_KEY')

  if (missing.length > 0) {
    console.error('Missing required environment variables:')
    missing.forEach(key => console.error(`   - ${key}`))
    process.exit(1)
  }

  if (!config.basescan.apiKey) console.warn('BASESCAN_API_KEY not set - wallet & dev tracker disabled')
  if (!config.github.token) console.warn('GITHUB_TOKEN not set - GitHub rate limit: 60 req/hour')
  if (!config.telegram.botToken) console.warn('TELEGRAM_BOT_TOKEN not set - Telegram bot disabled')
  if (!config.telegram.channelId) console.warn('TELEGRAM_CHANNEL_ID not set - auto-notifications disabled')
  if (!config.x.accessToken) console.warn('X_ACCESS_TOKEN not set - Phase 3 X auto-post disabled')
  if (!config.flaunch.apiKey) console.warn('FLAUNCH_API_KEY not set - get one at builders.flaunch.gg')

  console.log('Config validated successfully')
}
