import { config } from '../config'
import { WalletTx } from '../phase2/wallet-tracker'
import { XClient } from './x-client'
import { appendVoiceLog, findRecentVoiceLog, findVoiceLogByEventKey } from './storage'
import {
  composeDevDumpPost,
  composeNewTokenPost,
  composeWalletActivityPost,
  txTokenAmount,
} from './voice'
import {
  DevDumpVoiceEvent,
  NewTokenVoiceEvent,
  VoiceEventType,
  VoiceLogEntry,
  WalletActivityVoiceEvent,
} from './types'
import { randomUUID } from 'crypto'

export class Phase3 {
  private readonly xClient: XClient
  private queue: Promise<void> = Promise.resolve()

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
    const eventKey = `new_token:${event.token.address.toLowerCase()}`
    const text = composeNewTokenPost(event)
    await this.enqueue(() => this.handleVoicePost('new_token', eventKey, text))
  }

  async postDevDump(event: DevDumpVoiceEvent): Promise<void> {
    const eventKey = `dev_dump:${event.alert.token.address.toLowerCase()}`
    const text = composeDevDumpPost(event)
    await this.enqueue(() => this.handleVoicePost('dev_dump', eventKey, text))
  }

  async postWalletActivity(event: WalletActivityVoiceEvent): Promise<void> {
    const eventKey = `wallet_activity:${event.wallet.address.toLowerCase()}`
    const text = composeWalletActivityPost(event)

    if (!this.isSignificantWalletActivity(event.txs)) {
      await this.enqueue(async () => {
        this.logSkipped('wallet_activity', eventKey, text, 'not_significant')
      })
      return
    }

    await this.enqueue(() => this.handleVoicePost('wallet_activity', eventKey, text))
  }

  private isSignificantWalletActivity(txs: WalletTx[]): boolean {
    if (txs.length >= config.x.walletMinTxCount) return true
    return txs.some(tx => txTokenAmount(tx) >= config.x.walletMinTokenAmount)
  }

  private enqueue(task: () => Promise<void>): Promise<void> {
    this.queue = this.queue.then(task, task)
    return this.queue
  }

  private async handleVoicePost(type: VoiceEventType, eventKey: string, text: string): Promise<void> {
    const duplicate = this.findDuplicate(type, eventKey)
    if (duplicate) {
      this.logSkipped(type, eventKey, text, duplicate)
      return
    }

    if (!this.xClient.isEnabled()) {
      this.logSkipped(type, eventKey, text, 'x_disabled')
      return
    }

    try {
      const result = await this.xClient.post(text)
      if (result?.id) {
        this.logPosted(type, eventKey, text, result.id)
        console.log(`[Phase3] Posted ${type} to X: ${result.id}`)
        return
      }
      this.logSkipped(type, eventKey, text, 'x_disabled')
    } catch (err: any) {
      const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message
      this.logFailed(type, eventKey, text, detail)
      console.error(`[Phase3] Failed to post ${type}: ${detail}`)
    }
  }

  private findDuplicate(type: VoiceEventType, eventKey: string): string | null {
    if (type === 'wallet_activity') {
      const recent = findRecentVoiceLog(type, eventKey, config.x.walletCooldownMs)
      return recent ? 'cooldown' : null
    }

    const existing = findVoiceLogByEventKey(eventKey)
    return existing ? 'duplicate' : null
  }

  private logPosted(type: VoiceEventType, eventKey: string, text: string, xPostId: string): void {
    this.writeLog({
      type,
      eventKey,
      text,
      status: 'posted',
      xPostId,
      postedAt: new Date().toISOString(),
    })
  }

  private logSkipped(type: VoiceEventType, eventKey: string, text: string, reason: string): void {
    this.writeLog({
      type,
      eventKey,
      text,
      status: 'skipped',
      reason,
    })
    console.log(`[Phase3] Skipped ${type}: ${reason}`)
  }

  private logFailed(type: VoiceEventType, eventKey: string, text: string, error: string): void {
    this.writeLog({
      type,
      eventKey,
      text,
      status: 'failed',
      error,
    })
  }

  private writeLog(entry: Omit<VoiceLogEntry, 'id' | 'createdAt'>): void {
    appendVoiceLog({
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...entry,
    })
  }
}
