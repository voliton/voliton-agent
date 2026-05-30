import { VolitonAgent } from '../agent'
import { TokenScanner } from './scanner/index'
import { WalletTracker } from './wallet-tracker/index'
import { DevTracker } from './dev-tracker/index'
import { VolitonBot } from './telegram/bot'
import { Phase3 } from '../phase3/index'
import { verifyIdentity } from './enricher/identity'
import { enrichFromDexScreener } from './enricher/dexscreener'
import { formatNewToken, formatWalletActivity, formatDevDump } from './telegram/notifications'
import { NewToken, DevAlert, WalletEntry } from './types'
import { WalletTx } from './wallet-tracker/index'
import { config } from '../config'

export class Phase2 {
  private agent: VolitonAgent
  private scanner: TokenScanner
  private walletTracker: WalletTracker
  private devTracker: DevTracker
  private bot: VolitonBot
  private voice: Phase3

  constructor(agent: VolitonAgent) {
    this.agent = agent
    this.scanner = new TokenScanner(config.scanner.intervalMs)
    this.walletTracker = new WalletTracker(config.scanner.walletCheckIntervalMs)
    this.devTracker = new DevTracker(120000)
    this.bot = new VolitonBot()
    this.voice = new Phase3()
  }

  async start(): Promise<void> {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('         PHASE 2 — THE EYES          ')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    await this.bot.start()
    await this.voice.start()

    this.scanner.onToken(async (token: NewToken) => {
      await this.handleNewToken(token)
    })

    this.walletTracker.onWalletActivity(async (wallet: WalletEntry, txs: WalletTx[]) => {
      console.log(`\n👛 Activity: ${wallet.label} — ${txs.length} new tx(s)`)
      const msg = formatWalletActivity(wallet, txs)
      await this.bot.sendToChannel(msg)
      await this.voice.postWalletActivity({ wallet, txs })
    })

    this.devTracker.onDevDump(async (alert: DevAlert) => {
      console.log(`\n🚨 DEV DUMP: ${alert.token.name} — ${alert.amount} tokens`)
      const msg = formatDevDump(alert)
      await this.bot.sendToChannel(msg, alert.token.imageUrl)
      await this.voice.postDevDump({ alert })
    })

    await this.scanner.start()
    await this.walletTracker.start()
    await this.devTracker.start()

    console.log('\n✅ Phase 2 fully operational')
    console.log('   Voliton is watching Base...\n')
  }

  stop(): void {
    this.scanner.stop()
    this.walletTracker.stop()
    this.devTracker.stop()
    this.bot.stop()
    this.voice.stop()
  }

  private async handleNewToken(token: NewToken): Promise<void> {
    try {
      console.log(`\n🔄 Processing: ${token.name} ($${token.symbol}) [${token.launchpad}]`)

      if (!token.marketCap && !token.volume24h) {
        const dex = await enrichFromDexScreener(token.address)
        if (dex.liquidity) token.marketCap = dex.liquidity
        if (dex.volume24h) token.volume24h = dex.volume24h
        if (dex.priceChange24h !== undefined) token.priceChange24h = dex.priceChange24h
        if (dex.dexUrl && !token.dexUrl) token.dexUrl = dex.dexUrl
      }

      console.log(`   🐙 Checking GitHub identity...`)
      const identity = await verifyIdentity(token.name, token.symbol)
      if (identity.githubRepo) {
        console.log(`   ✅ GitHub: ${identity.githubRepo} (${identity.githubAge})`)
        if (identity.isGithubSuspicious) console.log(`   ⚠️  SUSPICIOUS: Repo is brand new!`)
      } else {
        console.log(`   ❌ No GitHub found`)
      }

      console.log(`   🧠 Getting AI verdict...`)
      const verdict = await this.agent.analyzeCoin({
        name: token.name,
        address: token.address,
        liquidity: token.marketCap || 0,
        volume24h: token.volume24h || 0,
        priceChange24h: token.priceChange24h || 0,
        holders: undefined,
      })

      if (token.devWallet) this.devTracker.trackDev(token)

      const message = formatNewToken(token, identity, verdict)
      await this.bot.sendToChannel(message, token.imageUrl)
      await this.voice.postNewToken({ token, identity, aiVerdict: verdict })

      console.log(`   ✅ Sent to Telegram channel`)
    } catch (err: any) {
      console.error(`[Phase2] Error processing ${token.name}: ${err.message}`)
    }
  }
}
