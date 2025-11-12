'use client'

interface ProfileNotFoundProps {
  username: string
}

export function ProfileNotFound({ username }: ProfileNotFoundProps) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-[90vw] max-w-2xl">
        <div className="bg-card rounded-lg shadow-lg overflow-hidden border border-border p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Profile not found
          </h1>
          <p className="text-muted-foreground">
            The user {username} does not exist.
          </p>
        </div>
      </div>
    </div>
  )
}
