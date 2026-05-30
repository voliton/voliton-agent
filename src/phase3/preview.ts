import {
  composeDevDumpPost,
  composeNewTokenPost,
  composeWalletActivityPost,
} from './voice'
import { DevAlert, IdentityResult, NewToken, WalletEntry } from '../phase2/types'
import { WalletTx } from '../phase2/wallet-tracker'

function printPost(label: string, text: string) {
  console.log(`\n=== ${label} (${text.length}/280) ===`)
  console.log(text)
}

const token: NewToken = {
  name: 'Volition Test',
  symbol: 'VTEST',
  address: '0x0000000000000000000000000000000000000000',
  launchpad: 'Bankr',
  deployedAt: new Date().toISOString(),
  devWallet: '0x1111111111111111111111111111111111111111',
  marketCap: 42000,
  volume24h: 9300,
  dexUrl: 'https://dexscreener.com/base/0x0000000000000000000000000000000000000000',
}

const identity: IdentityResult = {
  githubRepo: 'https://github.com/example/volition-test',
  githubAge: '4 hours',
  isGithubSuspicious: true,
  githubStars: 1,
}

const aiVerdict = [
  'VERDICT: NEUTRAL',
  'RISK: HIGH',
  'REASON: Liquidity is early and identity is still thin. I will watch before acting.',
  'ACTION: WATCH',
].join('\n')

const devAlert: DevAlert = {
  token,
  action: 'dump',
  txHash: '0x2222222222222222222222222222222222222222222222222222222222222222',
  amount: '125000.00',
  timestamp: new Date().toISOString(),
}

const wallet: WalletEntry = {
  address: '0x3333333333333333333333333333333333333333',
  label: 'Signal Wallet',
  addedAt: new Date().toISOString(),
  chatId: 'preview',
}

const txs: WalletTx[] = [
  {
    hash: '0x4444444444444444444444444444444444444444444444444444444444444444',
    from: '0x3333333333333333333333333333333333333333',
    to: '0x5555555555555555555555555555555555555555',
    value: '250000000000000000000000',
    timeStamp: Math.floor(Date.now() / 1000).toString(),
    tokenName: 'Volition Test',
    tokenSymbol: 'VTEST',
    tokenDecimal: '18',
    contractAddress: token.address,
    direction: 'out',
  },
]

printPost('New Token', composeNewTokenPost({ token, identity, aiVerdict }))
printPost('Dev Dump', composeDevDumpPost({ alert: devAlert }))
printPost('Wallet Activity', composeWalletActivityPost({ wallet, txs }))
