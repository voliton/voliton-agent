import { IdentityResult, NewToken, DevAlert, WalletEntry } from '../phase2/types'
import { WalletTx } from '../phase2/wallet-tracker'

export interface XPostResult {
  id: string
  text: string
}

export interface NewTokenVoiceEvent {
  token: NewToken
  identity: IdentityResult
  aiVerdict: string
}

export interface DevDumpVoiceEvent {
  alert: DevAlert
}

export interface WalletActivityVoiceEvent {
  wallet: WalletEntry
  txs: WalletTx[]
}

export interface ParsedVerdict {
  verdict?: string
  risk?: string
  reason?: string
  action?: string
}

export type VoiceEventType = 'new_token' | 'dev_dump' | 'wallet_activity'
export type VoicePostStatus = 'posted' | 'skipped' | 'failed'

export interface VoiceLogEntry {
  id: string
  eventKey: string
  type: VoiceEventType
  status: VoicePostStatus
  reason?: string
  text: string
  createdAt: string
  postedAt?: string
  xPostId?: string
  error?: string
}

export interface VoiceLogStorage {
  entries: VoiceLogEntry[]
}
