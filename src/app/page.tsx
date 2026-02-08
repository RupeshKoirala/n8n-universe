export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            n8n Universe
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Discover thousands of ready-to-use n8n automations
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/workflows"
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Browse Workflows
            </a>
            <a
              href="#how-it-works"
              className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">25,000+</div>
            <div className="text-gray-600 dark:text-gray-300">Workflows Available</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">$1-5</div>
            <div className="text-gray-600 dark:text-gray-300">Per Download</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center">
            <div className="text-4xl font-bold text-pink-600 mb-2">$19/mo</div>
            <div className="text-gray-600 dark:text-gray-300">Unlimited Access</div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2">Smart Search</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Find exactly what you need with AI-powered semantic search
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-2">Instant Download</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Get your workflow immediately - ready to import into n8n
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="text-xl font-bold mb-2">Quality Curated</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Every workflow is tested and verified before listing
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-8 text-white shadow-lg text-center">
            <h3 className="text-2xl font-bold mb-2">Browse Workflows</h3>
            <p className="mb-4 opacity-90">
              Explore our collection of 25,000+ ready-to-use automations
            </p>
            <a
              href="/workflows"
              className="inline-block px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Explore Now
            </a>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center border-2 border-purple-200 dark:border-purple-800">
            <h3 className="text-2xl font-bold mb-2">Upload Your Work</h3>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Share your workflows with the community and earn money
            </p>
            <a
              href="/upload"
              className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Upload Workflow
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
