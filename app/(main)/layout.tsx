import { Header } from "@/components/nav/header"
import { Footer } from "@/components/nav/footer"
import { BottomNav } from "@/components/nav/bottom-nav"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 pb-20 sm:pb-8">
        {children}
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
