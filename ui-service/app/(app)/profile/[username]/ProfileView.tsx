'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SocialLinkDisplay } from '@/components/SocialLinkDisplay'

interface ProfileViewProps {
  profile: any
}

function getInitials(displayName: string): string {
  return displayName
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

export function ProfileView({ profile }: ProfileViewProps) {
  const displayName = profile.displayName || profile.username
  const initials = getInitials(displayName)

  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-[90vw] max-w-2xl">
        <div className="mb-4 pl-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Profile
          </h1>
        </div>

        <div className="bg-card rounded-lg shadow-lg overflow-hidden border border-border p-8">
          <main className="flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-6">
                <Avatar className="size-32 shrink-0">
                  <AvatarImage
                    src={profile.profilePictureUrl || undefined}
                    alt={displayName}
                  />
                  <AvatarFallback className="text-lg font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col gap-3 flex-1 pt-2">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                      {displayName}
                    </h2>
                    <p className="font-mono text-sm text-muted-foreground">
                      @{profile.username}
                    </p>
                  </div>

                  {profile.pronouns && profile.pronouns.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {profile.pronouns.map((pronoun: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {pronoun}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-l-2 border-primary pl-4">
                {profile.headline ? (
                  <p className="text-lg font-medium text-foreground">
                    {profile.headline}
                  </p>
                ) : (
                  <p className="text-lg font-medium text-muted-foreground italic">
                    No headline added
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <h3 className="font-semibold text-foreground">About</h3>
              {profile.aboutMeInformation ? (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {profile.aboutMeInformation}
                </p>
              ) : (
                <p className="text-muted-foreground italic">No bio added</p>
              )}
            </div>

            {profile.preferredTopics && profile.preferredTopics.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-col gap-4">
                  <h3 className="font-semibold text-foreground">
                    Preferred Languages
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {profile.preferredTopics.map((topic: string) => (
                      <Badge key={topic} variant="outline">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {profile.socialLinks && profile.socialLinks.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-col gap-4">
                  <h3 className="font-semibold text-foreground">Connect</h3>
                  <SocialLinkDisplay links={profile.socialLinks as any} />
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
