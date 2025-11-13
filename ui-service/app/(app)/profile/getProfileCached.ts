// AI Assistance Disclosure:
// Tool: sst/opencode (model: Polaris Alpha), date: 2025‑11-12
// Scope: Generated implementation based on component specifications for PPR and existing code structure
// Author review: Validated correctness, fixed bugs

import { cacheLife, cacheTag } from 'next/cache'
import * as userServiceClient from '@/lib/userServiceClient'

export async function getProfileCached(username: string) {
  'use cache'

  // Cache user profiles briefly to balance freshness with performance
  cacheLife('minutes')
  cacheTag(`user-profile:${username}`)

  return userServiceClient.getUserProfile(username)
}
