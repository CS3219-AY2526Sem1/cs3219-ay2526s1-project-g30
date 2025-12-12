export function NavbarSkeleton() {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="h-6 w-32 rounded bg-white/10" />
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-white/10" />
        <div className="h-4 w-16 rounded bg-white/10" />
      </div>
    </div>
  )
}
