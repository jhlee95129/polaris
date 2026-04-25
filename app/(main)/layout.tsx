import { BottomNav } from "@/components/nav/bottom-nav"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-md min-h-svh pb-20">
      {children}
      <BottomNav />
    </div>
  )
}
