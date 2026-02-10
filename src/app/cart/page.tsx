'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CartItem {
  workflow_id: string;
  workflow_name: string;
  workflow_price: number;
  thumbnail_url?: string;
  complexity: 'simple' | 'medium' | 'complex';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: string;
}

interface User {
  id: string;
  email: string;
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse saved cart:', error);
      }
    }

    // Load user session
    async function loadUser() {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to load user session:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('cart');
    }
  }, [cart]);

  const removeFromCart = (workflowId: string) => {
    setCart(prev => prev.filter(item => item.workflow_id !== workflowId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const updateQuantity = (workflowId: string, change: number) => {
    // For individual workflows, quantity is always 1
    // This is for future implementation of bundle purchases
    // Currently just removes or keeps the item
    setCart(prev => prev.filter(item => item.workflow_id !== workflowId));
  };

  const handleCheckout = async () => {
    if (!user) {
      alert('Please sign in to proceed with checkout');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    // Redirect to checkout page
    window.location.href = '/checkout';
  };

  const cartTotal = cart.reduce((total, item) => total + item.workflow_price, 0);
  const freeUserTier = user?.subscription_tier === 'free';

  const complexityColors = {
    simple: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
    complex: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200'
  };

  const difficultyColors = {
    beginner: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    intermediate: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
    advanced: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200',
    expert: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Shopping Cart
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {cart.length} {cart.length === 1 ? 'workflow' : 'workflows'} in your cart
            </p>
          </div>

          {/* Cart Items */}
          {cart.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-16 text-center">
              <div className="mb-8">
                <svg className="w-24 h-24 mx-auto text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l-4 4h2a2 2 0 012 0v2a2 2 0 01-2 83V6.25l-5.87 5.87a1 1 0 01-2.83 0-1.42V5.17l5.87-5.87a1 1 0 01-2.83 0-1.42z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6v-2H5a2 2 0 00-2H7a2 2 0 00 2v2a2 2 0 012 0v2a2 2 0 01-2.83V6.25l-5.87 5.87a1 1 0 01-2.83 0-1.42V5.17l5.87-5.87a1 1 0 01-2.83 0-1.42z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Your cart is empty
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Browse our marketplace and add workflows to your cart
              </p>
              <Link
                href="/workflows"
                className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
              >
                Browse Workflows
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {cart.map((item) => (
                <div key={item.workflow_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex gap-6">
                    {/* Thumbnail */}
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.workflow_name}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                        {item.workflow_name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Item Details */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {item.workflow_name}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${complexityColors[item.complexity]}`}>
                          {item.complexity.charAt(0).toUpperCase() + item.complexity.slice(1)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[item.difficulty]}`}>
                          {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                          {item.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {item.complexity} • {item.difficulty} • Single workflow download
                      </p>
                    </div>

                    {/* Price & Actions */}
                    <div className="flex flex-col gap-2 text-right">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                        ${item.workflow_price}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.workflow_id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Remove from cart"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 012-2.83V17M12 17.257 1.059.269-1.34 4.471-4.471-2.83-2.83V7a2 2 0 012-2.83-2.83 2.828 12.143l.857.867 12.142-2.83V9.586c0-1.028.536-1.878-2.617-5.084-.283-2.034-3.834.768-4.03 4.484-5.038l5.66 2.326 5.084.806-3.834.768-4.034-.283 2.034-3.834.768-4.034z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cart Summary & Actions */}
          {cart.length > 0 && (
            <>
              {/* Free Tier Warning */}
              {freeUserTier && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m6-6 6-6v12a2 2 0 012 2 2.828 12.143-12.142-2.83V17M12 17.257 1.059.269-1.34 4.471-4.471-2.83-2.83V7a2 2 0 012-2.83-2.83 2.828 12.143l.857.867 12.142-2.83V9.586c0-1.028.536-1.878-2.617-5.084-.283-2.034-3.834.768-4.034 4.484-5.038l5.66 2.326 5.084.806-3.834.768-4.034-.283 2.034-3.834.768-4.034z" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-100 mb-2">
                        Free Tier Limitation
                      </h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-200">
                        Free tier users can only purchase up to 3 workflows at once. You have {cart.length} {cart.length === 1 ? 'workflow' : 'workflows'} in your cart.
                      </p>
                      {cart.length > 3 && (
                        <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-2">
                          Please remove {cart.length - 3} {cart.length - 3 === 1 ? 'workflow' : 'workflows'} to proceed with checkout.
                        </p>
                      )}
                      <Link
                        href="/pricing"
                        className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
                      >
                        Upgrade to Basic ($9/mo) or Pro ($19/mo) for unlimited downloads
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Cart Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Order Summary
                  </h2>
                  <button
                    onClick={clearCart}
                    className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Clear Cart
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
                    <span className="font-medium text-gray-900 dark:text-white">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Discount</span>
                    <span className="font-medium text-green-600 dark:text-green-400">-$0.00</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Tax</span>
                    <span className="font-medium text-gray-900 dark:text-white">$0.00</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={checkingOut || (freeUserTier && cart.length > 3)}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                    checkingOut
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 hover:scale-105 active:scale-95 shadow-lg'
                  } ${freeUserTier && cart.length > 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {checkingOut ? (
                    <>
                      <svg className="w-5 h-5 mr-2 animate-spin inline" fill="none" stroke="currentColor" viewBox="0 0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018 8 0 018 0 1 4l-7-7 7-7"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Checkout
                      <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12l14 12M12 5l7 7-7 7m0 0l-7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {/* Continue Shopping */}
              <div className="text-center">
                <Link
                  href="/workflows"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Continue shopping for more workflows
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
