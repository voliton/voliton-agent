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
