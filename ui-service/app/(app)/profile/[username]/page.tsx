import { getProfileCached } from '../getProfileCached'
import { ProfileNotFound } from './ProfileNotFound'
import { ProfileView } from './ProfileView'

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params

  const profile = await getProfileCached(username).catch((error) => {
    console.error(
      `Failed to fetch user profile for username ${username}:`,
      error,
    )
    return null
  })

  if (!profile) {
    return <ProfileNotFound username={username} />
  }

  return <ProfileView profile={profile} />
}
