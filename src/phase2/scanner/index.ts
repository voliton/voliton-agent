import { LaunchpadPlugin, NewToken } from '../types'
import { ClankerPlugin } from './plugins/clanker.plugin'
import { BankrPlugin } from './plugins/bankr.plugin'
import { VirtualsPlugin } from './plugins/virtuals.plugin'
import { FlaunchPlugin } from './plugins/flaunch.plugin'

export class TokenScanner {
  private plugins: LaunchpadPlugin[]
  private seenTokens: Set<string> = new Set()
  private onNewToken?: (token: NewToken) => Promise<void>
  private intervalMs: number
  private timer?: NodeJS.Timeout
  private isInitialSeed = true

  constructor(intervalMs: number = 60000) {
    this.intervalMs = intervalMs
    // Load default plugins
    this.plugins = [
      new ClankerPlugin(),
      new BankrPlugin(),
      new VirtualsPlugin(),
      new FlaunchPlugin(),
    ]
    console.log(`🔌 Plugins loaded: ${this.plugins.map(p => p.name).join(' | ')}`)
    console.log(`   (Add more: scanner.addPlugin(new YourPlugin()))`)
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  // Add a new launchpad plugin at runtime
  addPlugin(plugin: LaunchpadPlugin) {
    this.plugins.push(plugin)
    console.log(`🔌 Plugin added: ${plugin.name}`)
  }

  // Register callback for new token events
  onToken(callback: (token: NewToken) => Promise<void>) {
    this.onNewToken = callback
  }

  // Start autonomous scanning
  async start() {
    console.log(`\n🔍 Scanner starting — interval: ${this.intervalMs / 1000}s`)

    // First scan seeds known tokens (no callbacks fired)
    console.log('⏳ Seeding known tokens from all launchpads...')
    await this.runScan(true)
    console.log(`✅ Seeded ${this.seenTokens.size} existing tokens`)
    this.isInitialSeed = false

    // Start polling
    this.timer = setInterval(() => this.runScan(false), this.intervalMs)
    console.log('✅ Scanner running autonomously\n')
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      console.log('⏹️ Scanner stopped')
    }
  }

  // ============================================================
  // PRIVATE
  // ============================================================

  private async runScan(isSeed: boolean): Promise<void> {
    const newTokens: NewToken[] = []

    for (const plugin of this.plugins) {
      try {
        const tokens = await plugin.fetch()
        for (const token of tokens) {
          if (!token.address) continue
          const key = `${plugin.name}:${token.address}`
          if (!this.seenTokens.has(key)) {
            this.seenTokens.add(key)
            if (!isSeed) {
              newTokens.push(token)
            }
          }
        }
      } catch (err: any) {
        console.error(`[Scanner] ${plugin.name} error: ${err.message}`)
      }
    }

    if (!isSeed && newTokens.length > 0) {
      console.log(`\n🆕 ${newTokens.length} new token(s) detected!`)
      for (const token of newTokens) {
        console.log(`   → [${token.launchpad}] ${token.name} ($${token.symbol})`)
        console.log(`     ${token.address}`)
        if (this.onNewToken) {
          await this.onNewToken(token).catch(err =>
            console.error('[Scanner] onToken callback error:', err.message)
          )
        }
      }
    }
  }
}
