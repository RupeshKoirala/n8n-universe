import type { Metadata } from 'next';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'n8n Universe - Marketplace for Automation Workflows',
  description: 'Buy and sell n8n automation workflows. Browse 25,000+ curated workflows by category, complexity, or integration.',
  keywords: 'n8n, automation, workflows, marketplace, no-code, low-code',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              {/* Logo/Brand */}
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 13m0 0l3 3h-10m0 0l-3-10m0 0 0l3-3 3h10m0 0l-3-3-10m-3 0l0 6-4l1.33-4-1.33-4l1.33 4 1.33 4 0 6 0 4 0" />
                  </svg>
                </div>
                <span className="font-bold text-xl text-gray-900 dark:text-white">
                  n8n Universe
                </span>
              </Link>

              {/* Navigation */}
              <nav className="hidden md:flex gap-6">
                <Link href="/workflows" className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium">
                  Browse Workflows
                </Link>
                <Link href="/categories" className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium">
                  Categories
                </Link>
                <Link href="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium">
                  Pricing
                </Link>
                <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium">
                  Dashboard
                </Link>
              </nav>

              {/* User Menu */}
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400">
                  Dashboard
                </Link>
                <Link href="/downloads" className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400">
                  Downloads
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1">
            {children}
          </main>

          <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Browse
                  </h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li><Link href="/categories" className="hover:text-orange-600 dark:hover:text-orange-400">By Category</Link></li>
                    <li><Link href="/trending" className="hover:text-orange-600 dark:hover:text-orange-400">Trending</Link></li>
                    <li><Link href="/new" className="hover:text-orange-600 dark:hover:text-orange-400">New Workflows</Link></li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Support
                  </h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li><Link href="/docs" className="hover:text-orange-600 dark:hover:text-orange-400">Documentation</Link></li>
                    <li><Link href="/contact" className="hover:text-orange-600 dark:hover:text-orange-400">Contact Us</Link></li>
                    <li><Link href="/faq" className="hover:text-orange-600 dark:hover:text-orange-400">FAQ</Link></li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Account
                  </h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li><Link href="/dashboard" className="hover:text-orange-600 dark:hover:text-orange-400">Dashboard</Link></li>
                    <li><Link href="/profile" className="hover:text-orange-600 dark:hover:text-orange-400">Profile</Link></li>
                    <li><Link href="/subscriptions" className="hover:text-orange-600 dark:hover:text-orange-400">Subscriptions</Link></li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Legal
                  </h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li><Link href="/terms" className="hover:text-orange-600 dark:hover:text-orange-400">Terms of Service</Link></li>
                    <li><Link href="/privacy" className="hover:text-orange-600 dark:hover:text-orange-400">Privacy Policy</Link></li>
                  </ul>
                </div>

                <div className="md:col-span-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Get Started
                  </h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li><Link href="/pricing" className="hover:text-orange-600 dark:hover:text-orange-400">View Pricing</Link></li>
                    <li><Link href="/free" className="hover:text-orange-600 dark:hover:text-orange-400">Free Trial</Link></li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8 md:col-span-4">
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
                  © 2026 n8n Universe. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
