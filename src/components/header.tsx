'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Header() {
  const [session, setSession] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">n</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              n8n Universe
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/workflows"
              className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors"
            >
              Workflows
            </Link>
            <Link
              href="/pricing"
              className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors"
            >
              Pricing
            </Link>

            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors"
                >
                  Dashboard
                </Link>
                {session.user?.user_metadata?.subscription_tier === 'enterprise' && (
                  <Link
                    href="/admin"
                    className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors"
                >
                  {session.user?.user_metadata?.avatar_url ? (
                    <img
                      src={session.user.user_metadata.avatar_url}
                      alt={session.user.user_metadata.username || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      {session.user.email?.[0]?.toUpperCase()}
                    </div>
                  )}
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-4">
              <Link
                href="/workflows"
                className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Workflows
              </Link>
              <Link
                href="/pricing"
                className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>

              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  {session.user?.user_metadata?.subscription_tier === 'enterprise' && (
                    <Link
                      href="/admin"
                      className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-left text-red-600 dark:text-red-400 font-medium transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login"
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
