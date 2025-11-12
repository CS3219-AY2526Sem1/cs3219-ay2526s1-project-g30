import { cacheLife, cacheTag } from 'next/cache'
import * as userServiceClient from '@/lib/userServiceClient'

export async function getProfileCached(username: string) {
  'use cache'

  // Cache user profiles briefly to balance freshness with performance
  cacheLife('minutes')
  cacheTag(`user-profile:${username}`)

  return userServiceClient.getUserProfile(username)
}
