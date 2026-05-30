import axios from 'axios'
import { IdentityResult } from '../types'
import { config } from '../../config'

// Verify the identity of a token project
// Searches GitHub for matching repos + checks if repo is brand new (suspicious)
export async function verifyIdentity(
  tokenName: string,
  tokenSymbol: string
): Promise<IdentityResult> {
  const result: IdentityResult = {}

  await searchGithub(tokenName, tokenSymbol, result)

  return result
}

async function searchGithub(
  tokenName: string,
  tokenSymbol: string,
  result: IdentityResult
): Promise<void> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'VolitonAgent/0.2',
    }
    if (config.github.token) {
      headers['Authorization'] = `Bearer ${config.github.token}`
    }

    // Search by name first, then symbol if no results
    const queries = [
      `${tokenName} in:name,description`,
      `${tokenSymbol} in:name`,
    ]

    for (const q of queries) {
      const response = await axios.get(
        'https://api.github.com/search/repositories',
        {
          params: { q, sort: 'stars', order: 'desc', per_page: 5 },
          headers,
          timeout: 8000,
        }
      )

      const repos: any[] = response.data?.items || []
      if (repos.length === 0) continue

      // Pick best result (most stars, or most recently created for brand new projects)
      const best = repos[0]
      const createdAt = new Date(best.created_at)
      const ageInDays = Math.floor(
        (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )

      result.githubRepo = best.html_url
      result.githubCreatedAt = best.created_at
      result.githubStars = best.stargazers_count

      if (ageInDays === 0) {
        result.githubAge = 'Created TODAY ⚠️'
        result.isGithubSuspicious = true
      } else if (ageInDays < 3) {
        result.githubAge = `${ageInDays}d old ⚠️`
        result.isGithubSuspicious = true
      } else if (ageInDays < 30) {
        result.githubAge = `${ageInDays} days old`
        result.isGithubSuspicious = false
      } else {
        const months = Math.floor(ageInDays / 30)
        result.githubAge = months < 12
          ? `${months} month(s) old`
          : `${Math.floor(months / 12)} year(s) old`
        result.isGithubSuspicious = false
      }

      break // Found a result, stop searching
    }
  } catch (err: any) {
    // Rate limit hit or other error — log but don't crash
    if (err.response?.status === 403) {
      console.warn('[Identity] GitHub rate limit hit — add GITHUB_TOKEN for higher limits')
    } else {
      console.error('[Identity] GitHub search error:', err.message)
    }
  }
}
