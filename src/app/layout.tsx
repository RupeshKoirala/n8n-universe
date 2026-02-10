import type { Metadata } from "next"
// import { Inter } from "next/font/google" // Temporarily commented out due to module resolution issues
import "./globals.css"

// const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "n8n Universe - Automation Marketplace",
  description: "Discover, buy, and download thousands of n8n automation workflows",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
