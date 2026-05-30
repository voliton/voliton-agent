import { config } from '../config'
import { WalletTx } from '../phase2/wallet-tracker'
import { XClient } from './x-client'
import {
  composeDevDumpPost,
  composeNewTokenPost,
  composeWalletActivityPost,
  txTokenAmount,
} from './voice'
import { DevDumpVoiceEvent, NewTokenVoiceEvent, WalletActivityVoiceEvent } from './types'

export class Phase3 {
  private readonly xClient: XClient

  constructor(xClient: XClient = new XClient()) {
    this.xClient = xClient
  }

  async start(): Promise<void> {
    console.log('\n====================================')
    console.log('         PHASE 3 - THE VOICE         ')
    console.log('====================================\n')

    if (!this.xClient.isEnabled()) {
      console.log('Phase 3 disabled - set X_ACCESS_TOKEN to enable X auto-post')
      return
    }

    console.log('Phase 3 online - Voliton can post to X')
  }

  stop(): void {
    // No long-running resources yet.
  }

  async postNewToken(event: NewTokenVoiceEvent): Promise<void> {
    await this.safePost(composeNewTokenPost(event), 'new token')
  }

  async postDevDump(event: DevDumpVoiceEvent): Promise<void> {
    await this.safePost(composeDevDumpPost(event), 'dev dump')
  }

  async postWalletActivity(event: WalletActivityVoiceEvent): Promise<void> {
    if (!this.isSignificantWalletActivity(event.txs)) return
    await this.safePost(composeWalletActivityPost(event), 'wallet activity')
  }

  private isSignificantWalletActivity(txs: WalletTx[]): boolean {
    if (txs.length >= config.x.walletMinTxCount) return true
    return txs.some(tx => txTokenAmount(tx) >= config.x.walletMinTokenAmount)
  }

  private async safePost(text: string, label: string): Promise<void> {
    try {
      const result = await this.xClient.post(text)
      if (result?.id) {
        console.log(`[Phase3] Posted ${label} to X: ${result.id}`)
      }
    } catch (err: any) {
      const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message
      console.error(`[Phase3] Failed to post ${label}: ${detail}`)
    }
  }
}
