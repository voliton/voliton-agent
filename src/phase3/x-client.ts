import axios from 'axios'
import { config } from '../config'
import { XPostResult } from './types'

export class XClient {
  private readonly accessToken: string
  private readonly apiBase = 'https://api.x.com/2'

  constructor(accessToken: string = config.x.accessToken) {
    this.accessToken = accessToken
  }

  isEnabled(): boolean {
    return config.x.autoPostEnabled && Boolean(this.accessToken)
  }

  async post(text: string): Promise<XPostResult | null> {
    if (!this.isEnabled()) return null

    const trimmed = text.trim()
    if (!trimmed) return null

    const response = await axios.post(
      `${this.apiBase}/tweets`,
      { text: trimmed },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    )

    return {
      id: response.data?.data?.id || '',
      text: response.data?.data?.text || trimmed,
    }
  }
}
