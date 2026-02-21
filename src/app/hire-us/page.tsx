import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Hire Us - Custom Workflow Development',
  description: 'Get custom n8n workflows built for your business. Expert automation developers ready to help.',
};

export default function HireUsPage() {
  const services = [
    {
      name: 'Simple Workflow',
      description: 'Basic automation with 2-5 nodes',
      features: ['2-5 nodes', '1 integration', 'Documentation', '1 revision'],
      price: '$99-$199',
      delivery: '1-2 business days',
      popular: false,
    },
    {
      name: 'Complex Workflow',
      description: 'Advanced automation with multiple integrations',
      features: ['5-10 nodes', '3-5 integrations', 'Full documentation', '2 revisions', 'Testing support'],
      price: '$299-$499',
      delivery: '3-5 business days',
      popular: true,
    },
    {
      name: 'Enterprise Solution',
      description: 'Full-scale automation system for your business',
      features: ['Unlimited nodes', 'Unlimited integrations', 'Custom UI', 'Priority support', 'Monthly maintenance', 'Team training'],
      price: '$999-$2,499',
      delivery: '1-3 weeks',
      popular: false,
    },
  ];

  const process = [
    { step: '1', title: 'Describe Your Needs', description: 'Tell us what you want to automate and we\'ll suggest the best approach.' },
    { step: '2', title: 'Get a Quote', description: 'We\'ll review your requirements and provide a detailed quote.' },
    { step: '3', title: 'We Build It', description: 'Our experts develop and test your workflow.' },
    { step: '4', title: 'Delivery & Support', description: 'We deliver the workflow and provide implementation support.' },
  ];

  const faqs = [
    {
      question: 'How long does it take?',
      answer: 'Simple workflows take 1-2 days, complex ones 3-5 days, and enterprise solutions 1-3 weeks depending on complexity.',
    },
    {
      question: 'What happens if the workflow doesn\'t work?',
      answer: 'We provide testing and revisions as part of our service. If it doesn\'t work as specified, we\'ll fix it for free.',
    },
    {
      question: 'Do you offer ongoing maintenance?',
      answer: 'Yes! Enterprise packages include monthly maintenance. We also offer separate maintenance contracts.',
    },
    {
      question: 'What if I need changes later?',
      answer: 'We offer revision rounds with each package. For larger changes, we can provide a new quote.',
    },
    {
      question: 'Can you integrate with any service?',
      answer: 'Yes! n8n supports 400+ integrations. If a service has an API, we can integrate with it.',
    },
    {
      question: 'Is my payment protected?',
      answer: 'Yes! We use escrow-style payment. Payment is released only when you\'re satisfied with the work.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Get Custom Workflows Built for Your Business
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Don't see what you need in our marketplace? Our expert team will build
            custom n8n workflows tailored to your specific requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#contact"
              className="px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg"
            >
              Start Your Project
            </a>
            <a
              href="#services"
              className="px-8 py-4 bg-white text-purple-600 border-2 border-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
            >
              View Services
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-purple-600">500+</div>
              <div className="text-gray-600 mt-2">Workflows Built</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600">200+</div>
              <div className="text-gray-600 mt-2">Happy Clients</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600">98%</div>
              <div className="text-gray-600 mt-2">Satisfaction Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600">24h</div>
              <div className="text-gray-600 mt-2">Average Response</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Service Package
            </h2>
            <p className="text-xl text-gray-600">
              Transparent pricing with clear deliverables
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service) => (
              <div
                key={service.name}
                className={`bg-white rounded-2xl shadow-lg p-8 ${
                  service.popular ? 'ring-4 ring-purple-600 transform scale-105' : ''
                }`}
              >
                {service.popular && (
                  <div className="text-center mb-4">
                    <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{service.name}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="text-4xl font-bold text-purple-600 mb-4">{service.price}</div>
                <div className="text-sm text-gray-500 mb-6">Delivered in {service.delivery}</div>
                <ul className="space-y-3 mb-8">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className={`block text-center py-3 rounded-lg font-semibold transition-colors ${
                    service.popular
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Get Started
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple process from start to finish
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {process.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details key={idx} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-900 hover:bg-gray-50 flex justify-between items-center">
                  {faq.question}
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-gray-600">{faq.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Start Your Project
            </h2>
            <p className="text-xl text-gray-600">
              Fill out the form and we'll get back to you within 24 hours
            </p>
          </div>

          <form className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What do you want to automate? *
              </label>
              <textarea
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Describe the automation you need..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Range
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">Select your budget</option>
                <option value="simple">$99-$199 (Simple)</option>
                <option value="complex">$299-$499 (Complex)</option>
                <option value="enterprise">$999-$2,499 (Enterprise)</option>
                <option value="custom">Custom (I'll provide a budget)</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                When do you need it?
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">Select timeline</option>
                <option value="asap">ASAP</option>
                <option value="1week">Within 1 week</option>
                <option value="2weeks">Within 2 weeks</option>
                <option value="1month">Within 1 month</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Any additional details?
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Integrations needed, specific requirements, etc."
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg"
            >
              Submit Request
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              We'll respond within 24 hours with a detailed quote.
            </p>
          </form>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Automate Your Business?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join hundreds of businesses saving time and money with custom workflows.
          </p>
          <a
            href="#contact"
            className="inline-block px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
          >
            Get Your Custom Quote
          </a>
        </div>
      </section>
    </div>
  );
}
