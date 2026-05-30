# VOLITON
### Autonomous AI Agent on Base

> *"Others talk. Voliton acts."*

Voliton is an autonomous AI agent built on top of Base MCP — the onchain execution layer launched by Coinbase on May 26, 2026. Voliton observes, analyzes, and acts on Base blockchain without waiting to be told.

---

## What Voliton Does

- 🔍 **Scans** new tokens from Clanker, Bankr, Virtuals, Flaunch in real-time
- 🐙 **Verifies** GitHub repo + social identity for every new token
- 🧠 **Analyzes** each token autonomously via AI verdict
- 👛 **Tracks** custom wallets — notifies on every transaction
- 🚨 **Alerts** when dev wallets dump after launch
- 📡 **Broadcasts** everything to your Telegram channel automatically
- 🗣️ **Posts** to X autonomously when launches, dev dumps, or significant wallet moves happen

---

## Build Phases

| Phase | Name | Status |
|-------|------|--------|
| Phase 1 | The Brain — Core agent + Claude connection | ✅ Done |
| Phase 2 | The Eyes — Scanner + Wallet Tracker + Identity + Dev Tracker | ✅ Done |
| Phase 3 | The Voice — X auto-post | ✅ Done |
| Phase 4 | The Hands — Onchain execution via Base MCP | ⏳ Pending |
| Phase 5 | The Economy — Token utility + revenue sharing | ⏳ Pending |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Agent Brain | Claude via Maia Router |
| Coin Scanner | Clanker API, Bankr API, Virtuals API, Flaunch API |
| Market Data | DexScreener API (free) |
| Wallet/Dev Tracking | BaseScan API |
| GitHub Verification | GitHub Search API |
| Community Layer | Telegram Bot |
| Blockchain | Base Mainnet |
| Runtime | Node.js + TypeScript |

---

## Setup

### Prerequisites
- Node.js 18+
- Coinbase Developer Platform account
- Maia Router API key
- Telegram Bot (create via @BotFather)
- BaseScan API key (free at basescan.org/register)
- GitHub Personal Access Token (optional but recommended)

### Installation

```bash
git clone https://github.com/voliton/voliton-agent
cd voliton-agent
npm install
```

### Configuration

```bash
cp .env.example .env
```

Fill in your `.env` — required fields:

```env
# Required
MAIA_API_KEY=your_maia_api_key
CDP_API_KEY_NAME=your_cdp_key_id
CDP_API_KEY_PRIVATE_KEY=your_cdp_private_key

# Recommended
BASESCAN_API_KEY=your_basescan_key
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHANNEL_ID=your_channel_id

# Optional (higher GitHub rate limits)
GITHUB_TOKEN=your_github_token

# Phase 3 - X API v2 OAuth 2.0 user access token
X_ACCESS_TOKEN=your_x_oauth2_user_access_token
X_AUTO_POST_ENABLED=false
```

### Run

```bash
npm start
```

### Preview Phase 3 Voice

```bash
npm run voice:preview
```

This prints sample X posts locally without calling the X API.

---

## Telegram Commands

| Command | Description |
|---------|-------------|
| `/start` | Show welcome message |
| `/help` | Show all commands |
| `/addwallet 0x... Label` | Start tracking a wallet |
| `/removewallet 0x...` | Stop tracking a wallet |
| `/wallets` | List your tracked wallets |

---

## Adding a New Launchpad (Plugin System)

Create a new file in `src/phase2/scanner/plugins/`:

```typescript
import { BaseLaunchpadPlugin } from './base.plugin'
import { NewToken } from '../../types'

export class MyLaunchpadPlugin extends BaseLaunchpadPlugin {
  name = 'MyLaunchpad'

  async fetch(): Promise<NewToken[]> {
    // Fetch and return new tokens
    return []
  }
}
```

Register it in `src/phase2/scanner/index.ts`:

```typescript
import { MyLaunchpadPlugin } from './plugins/mylaunchpad.plugin'
this.plugins = [
  // existing plugins...
  new MyLaunchpadPlugin(),
]
```

---

## Token

**$VOLITON** — launched on Base via Bankr

Hold $VOLITON to unlock agent capabilities:

| Tier | Amount | Access |
|------|--------|--------|
| Free | 0 | Public dashboard & verdicts |
| Tier 1 | 100K | Yield optimization |
| Tier 2 | 500K | Priority signals + alpha |
| Tier 3 | 1M | Direct agent influence + revenue share |

---

## Links

- 🌐 Website: coming soon
- 🐦 X: [@VolitonBase](https://x.com/VolitonBase)
- 💬 Telegram: coming soon
- 📊 Token: coming soon

---

*Built on Base. Powered by will.*
