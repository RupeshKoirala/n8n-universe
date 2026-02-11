'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface WorkflowDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  complexity: 'simple' | 'medium' | 'complex';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  price: number;
  file_path: string;
  file_size: number;
  nodes_count: number;
  integrations: string[];
  download_count: number;
  rating: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

interface Review {
  id: string;
  workflow_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
}

export default function WorkflowDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workflowId = params.id;

  const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(true);
  const [showReviews, setShowReviews] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });

  useEffect(() => {
    async function fetchWorkflowData() {
      try {
        setLoading(true);

        // Fetch workflow details
        const workflowRes = await fetch(`/api/workflows/${workflowId}`);
        if (!workflowRes.ok) {
          router.push('/workflows');
          return;
        }
        const workflowData = await workflowRes.json();
        setWorkflow(workflowData.workflow);

        // Fetch user session
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        if (sessionData.authenticated) {
          setUser(sessionData.user);
        }

        // Fetch reviews
        const reviewsRes = await fetch(`/api/workflows/${workflowId}/reviews`);
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData.reviews || []);
      } catch (error) {
        console.error('Failed to fetch workflow:', error);
        router.push('/workflows');
      } finally {
        setLoading(false);
      }
    }

    fetchWorkflowData();
  }, [workflowId, router]);

  const handleDownload = async () => {
    // Check user subscription tier
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    // Check if workflow requires payment and user doesn't have a subscription
    if (workflow && workflow.price > 0 && user.subscription_tier === 'free') {
      // Redirect to checkout for one-time purchase
      try {
        const response = await fetch('/api/checkout/subscribe?type=purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            workflowId: workflow.id,
            userId: user.id
          })
        });

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          alert('Failed to create checkout: ' + (data.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Checkout error:', error);
        alert('Failed to start checkout. Please try again.');
      }
      return;
    }

    // Free tier: limited downloads per day
    if (user.subscription_tier === 'free' && workflow && workflow.download_count >= 3) {
      alert('Free tier: Maximum 3 downloads per day reached. Upgrade to Basic or Pro for unlimited downloads.');
      return;
    }

    try {
      setDownloading(true);

      const response = await fetch(`/api/workflows/${workflowId}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
      } else if (data.download_url) {
        // Trigger download
        window.location.href = data.download_url;
      } else if (data.workflow_json) {
        // Fallback: download JSON directly
        const blob = new Blob([JSON.stringify(data.workflow_json, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${workflow.name.replace(/\s+/g, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download workflow. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (newReview.rating === 0 || !newReview.comment.trim()) {
      alert('Please provide a rating and comment.');
      return;
    }

    try {
      const response = await fetch(`/api/workflows/${workflowId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: newReview.rating,
          comment: newReview.comment.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Review submitted successfully!');
        setNewReview({ rating: 0, comment: '' });

        // Refresh reviews
        const reviewsRes = await fetch(`/api/workflows/${workflowId}/reviews`);
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData.reviews || []);
      } else {
        alert('Failed to submit review: ' + data.error);
      }
    } catch (error) {
      console.error('Review submission error:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

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

  if (!workflow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Workflow Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              The workflow you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/workflows"
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Browse All Workflows
            </Link>
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
            <Link
              href="/workflows"
              className="inline-flex items-center text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 mb-6"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7 7" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l9-7-7-7" />
              </svg>
              Back to Workflows
            </Link>

            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {workflow.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {workflow.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {workflow.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-3 mb-8">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${complexityColors[workflow.complexity]}`}>
                {workflow.complexity.charAt(0).toUpperCase() + workflow.complexity.slice(1)} complexity
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColors[workflow.difficulty]}`}>
                {workflow.difficulty.charAt(0).toUpperCase() + workflow.difficulty.slice(1)} difficulty
              </span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                {workflow.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Workflow Visualizer */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Workflow Visualizer</h2>
                    <button
                      onClick={() => setShowVisualizer(!showVisualizer)}
                      className="px-4 py-2 bg-white/20 dark:bg-black/20 text-white rounded-lg font-medium hover:bg-white/30 dark:hover:bg-black/30 transition-colors"
                    >
                      {showVisualizer ? 'Hide' : 'Show'} Visualizer
                    </button>
                  </div>
                </div>

                {showVisualizer && (
                  <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-[400px]">
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="text-6xl font-bold text-gray-400 dark:text-gray-500 mb-4">
                          {workflow.name}
                        </div>
                        <div className="space-y-2">
                          <div className="w-full h-2 bg-purple-500 rounded-full"></div>
                          <div className="w-full h-2 bg-blue-500 rounded-full"></div>
                          <div className="w-full h-2 bg-pink-500 rounded-full"></div>
                        </div>
                        <div className="mt-8 space-y-2 text-gray-600 dark:text-gray-400">
                          <div className="flex items-center justify-between">
                            <span>Nodes</span>
                            <span className="font-semibold">{workflow.nodes_count}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Size</span>
                            <span className="font-semibold">{(workflow.file_size / 1024).toFixed(1)} KB</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Created</span>
                            <span className="font-semibold">{new Date(workflow.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Workflow Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Workflow Details</h2>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-300">Price</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {workflow.price === 0 ? 'Free' : `$${workflow.price}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-300">Downloads</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {workflow.download_count.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-300">Rating</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-purple-600">
                        {workflow.rating.toFixed(1)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        ({workflow.rating_count} reviews)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-300">Updated</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Date(workflow.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Integrations */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Integrations</h3>
                  <div className="flex flex-wrap gap-2">
                    {workflow.integrations.map((integration) => (
                      <span
                        key={integration}
                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                      >
                        {integration}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Download Button */}
                <div>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                      downloading
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 hover:scale-105 active:scale-95 shadow-lg'
                    }`}
                  >
                    {downloading ? (
                      <>
                        <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018 8 0 018 0 018 0 1 4l-7-7 7-7"></path>
                        </svg>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15v4a2 2 0 002-2H7a2 2 0 002-2V5a2 2 0 002-2h11a2 2 0 002-2zm0 0l-4 4m-4 4h4M4 12v4a2 2 0 002-2h4a2 2 0 002-2v-4a2 2 0 002-2H8a2 2 0 002-2V5a2 2 0 002-2h11a2 2 0 002-2v-4a2 2 0 002-2z" />
                        </svg>
                        Download Workflow
                      </>
                    )}
                  </button>

                  {user && user.subscription_tier === 'free' && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                      Free tier: Limited to 3 downloads per day.{' '}
                      <Link href="/pricing" className="text-purple-600 dark:text-purple-400 hover:underline">
                        Upgrade for unlimited downloads
                      </Link>
                    </p>
                  )}
                </div>
              </div>

              {/* Reviews */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reviews</h2>
                  <button
                    onClick={() => setShowReviews(!showReviews)}
                    className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    {showReviews ? 'Hide' : 'Show'} All Reviews ({reviews.length})
                  </button>
                </div>

                {/* Add Review Form */}
                <form onSubmit={handleReviewSubmit} className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className={`text-2xl focus:outline-none transition-transform ${
                            newReview.rating >= star ? 'scale-125' : 'scale-100 opacity-50 hover:opacity-75'
                          }`}
                        >
                          {star <= newReview.rating ? '⭐' : '☆'}
                        </button>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {newReview.rating > 0 ? 'Click stars to rate' : 'Select rating'}
                    </span>
                  </div>

                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Share your experience with this workflow..."
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    required
                  />

                  <button
                    type="submit"
                    className="w-full px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    Submit Review
                  </button>
                </form>

                {/* Reviews List */}
                {showReviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-start gap-4 mb-3">
                          {review.user_avatar ? (
                            <img
                              src={review.user_avatar}
                              alt={review.user_name}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                              {review.user_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {review.user_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(review.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex gap-1 mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-lg ${star <= review.rating ? 'text-purple-600 dark:text-purple-400' : 'text-gray-300'}`}
                                >
                                  {star <= review.rating ? '⭐' : '☆'}
                                </span>
                              ))}
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">
                              {review.comment}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : showReviews && reviews.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No reviews yet. Be the first to review this workflow!
                  </div>
                ) : null}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Author Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">About This Workflow</h3>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h1v4H9m1 4H8" />
                    </svg>
                    <span>Created by: <span className="font-medium text-gray-900 dark:text-white">n8n-universe</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l0 0 0 0 0 0 0 0 0 12 12z" />
                    </svg>
                    <span>Last updated: <span className="font-medium text-gray-900 dark:text-white">{new Date(workflow.updated_at).toLocaleDateString()}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15v4a2 2 0 002-2H7a2 2 0 002-2v-4a2 2 0 002-2h11a2 2 0 002-2v-4a2 2 0 002-2z" />
                    </svg>
                    <span>File size: <span className="font-medium text-gray-900 dark:text-white">{(workflow.file_size / 1024).toFixed(1)} KB</span></span>
                  </div>
                </div>
              </div>

              {/* Similar Workflows */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Similar Workflows</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Workflows with similar complexity and integrations
                </p>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Link
                      key={i}
                      href={`/workflows/${workflowId}`}
                      className="block p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">
                        Similar Workflow {i}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                          {workflow.complexity}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                          {workflow.difficulty}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/workflows"
                  className="text-center text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium"
                >
                  Browse similar workflows
                </Link>
              </div>

              {/* Pricing CTA */}
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <h3 className="text-xl font-bold mb-2">Get Unlimited Access</h3>
                <p className="mb-4 text-purple-100">
                  Download unlimited workflows with a Basic or Pro subscription starting at just $19/mo.
                </p>
                <Link
                  href="/pricing"
                  className="block w-full px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold text-center hover:bg-purple-50 transition-colors"
                >
                  View Pricing Plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
