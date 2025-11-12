import { cacheLife, cacheTag } from 'next/cache'
import * as userServiceClient from '@/lib/userServiceClient'

export async function getProfileCached(username: string) {
  'use cache'

  cacheLife('hours')
  cacheTag(`user-profile:${username}`)

  return userServiceClient.getUserProfile(username)
}
