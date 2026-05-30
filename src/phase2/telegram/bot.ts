import TelegramBot from 'node-telegram-bot-api'
import { config } from '../../config'
import { addWallet, removeWallet, getWallets } from '../wallet-tracker/storage'

export class VolitonBot {
  private bot?: TelegramBot
  private enabled = false

  constructor() {
    if (!config.telegram.botToken) {
      console.log('⚠️  Telegram Bot disabled — set TELEGRAM_BOT_TOKEN to enable')
      return
    }
    this.enabled = true
  }

  async start(): Promise<void> {
    if (!this.enabled) return
    this.bot = new TelegramBot(config.telegram.botToken, { polling: true })
    this.registerCommands()
    console.log('✅ Telegram Bot online — polling for commands')
  }

  stop(): void {
    this.bot?.stopPolling()
  }

  // ============================================================
  // SEND — HTML parse mode (stable, no escaping needed)
  // ============================================================

  async sendToChannel(message: string, imageUrl?: string): Promise<void> {
    if (!this.bot || !config.telegram.channelId) return
    const chatId = config.telegram.channelId

    try {
      if (imageUrl) {
        // Send as photo with caption
        await this.bot.sendPhoto(chatId, imageUrl, {
          caption: message,
          parse_mode: 'HTML',
        })
      } else {
        await this.bot.sendMessage(chatId, message, {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        })
      }
    } catch (err: any) {
      // If photo fails, fall back to text only
      if (imageUrl) {
        try {
          await this.bot.sendMessage(chatId, message, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          })
        } catch (e2: any) {
          console.error('[Bot] Failed to send notification:', e2.message)
        }
      } else {
        console.error('[Bot] Failed to send notification:', err.message)
      }
    }
  }

  async sendToChat(chatId: string | number, message: string): Promise<void> {
    if (!this.bot) return
    try {
      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      })
    } catch (err: any) {
      console.error('[Bot] Failed to reply:', err.message)
    }
  }

  // ============================================================
  // COMMANDS
  // ============================================================

  private registerCommands(): void {
    if (!this.bot) return

    this.bot.onText(/\/start/, async (msg) => {
      const text = [
        '🤖 <b>Voliton Agent</b>',
        'Autonomous AI Agent on Base',
        '',
        '<b>Commands:</b>',
        '/addwallet <code>0x... Label</code> — Track a wallet',
        '/removewallet <code>0x...</code> — Stop tracking',
        '/wallets — List your tracked wallets',
        '/help — Show this message',
        '',
        '<i>Voliton watches. Voliton acts.</i>',
      ].join('\n')
      await this.sendToChat(msg.chat.id, text)
    })

    this.bot.onText(/\/help/, async (msg) => {
      const text = [
        '📖 <b>Voliton Commands</b>',
        '',
        '<b>Wallet Tracking:</b>',
        '/addwallet <code>0xABCD... MyLabel</code>',
        '/removewallet <code>0xABCD...</code>',
        '/wallets',
        '',
        '<b>Auto Notifications:</b>',
        '• New tokens from Clanker, Bankr, Virtuals, Flaunch',
        '• GitHub repo verification',
        '• Dev wallet dump alerts',
        '• Tracked wallet activity',
      ].join('\n')
      await this.sendToChat(msg.chat.id, text)
    })

    this.bot.onText(/\/addwallet (.+)/, async (msg, match) => {
      const chatId = msg.chat.id
      const args = (match?.[1] || '').trim().split(/\s+/)

      if (args.length < 2) {
        await this.sendToChat(chatId,
          '⚠️ Usage: /addwallet <code>0x... YourLabel</code>\nExample: /addwallet <code>0xAbCd...1234 Whale A</code>'
        )
        return
      }

      const address = args[0]
      const label = args.slice(1).join(' ')

      if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
        await this.sendToChat(chatId, '❌ Invalid wallet address. Must start with <code>0x</code> and be 42 characters.')
        return
      }

      const added = addWallet(address, label, String(chatId))
      if (added) {
        await this.sendToChat(chatId, `✅ Now tracking:\n<b>${label}</b>\n<code>${address}</code>`)
      } else {
        await this.sendToChat(chatId, `⚠️ Already tracked:\n<code>${address}</code>`)
      }
    })

    this.bot.onText(/\/removewallet (.+)/, async (msg, match) => {
      const chatId = msg.chat.id
      const address = (match?.[1] || '').trim()

      if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
        await this.sendToChat(chatId, '❌ Invalid wallet address.')
        return
      }

      const removed = removeWallet(address)
      if (removed) {
        await this.sendToChat(chatId, `✅ Stopped tracking:\n<code>${address}</code>`)
      } else {
        await this.sendToChat(chatId, `⚠️ Wallet not found:\n<code>${address}</code>`)
      }
    })

    this.bot.onText(/\/wallets/, async (msg) => {
      const chatId = msg.chat.id
      const wallets = getWallets(String(chatId))

      if (wallets.length === 0) {
        await this.sendToChat(chatId, '📭 No wallets tracked yet.\nUse /addwallet <code>0x... Label</code> to start.')
        return
      }

      const lines = ['👛 <b>Your Tracked Wallets:</b>', '']
      for (const w of wallets) {
        const date = new Date(w.addedAt).toLocaleDateString()
        lines.push(`<b>${w.label}</b>`)
        lines.push(`<code>${w.address}</code>`)
        lines.push(`Added: ${date}`)
        lines.push('')
      }

      await this.sendToChat(chatId, lines.join('\n'))
    })

    console.log('📲 Commands registered: /start /help /addwallet /removewallet /wallets')
  }
}
