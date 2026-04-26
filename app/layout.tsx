import type { Metadata, Viewport } from "next"
import { Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import GlobalHeader from "@/components/nav/global-header"
import { cn } from "@/lib/utils"

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "폴라리스 — 길을 잃었을 때, 방향을 잡아주는 별",
  description:
    "한 번 명식 입력하면, 그 다음부터는 친구한테 고민 털어놓듯 사주를 보는 앱. 길을 잃었을 때 방향을 잡아주는 북극성.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable)}
    >
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-svh bg-background">
        <ThemeProvider>
          <GlobalHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
