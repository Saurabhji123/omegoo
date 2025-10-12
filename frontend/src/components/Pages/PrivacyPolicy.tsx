import React from 'react';
import { ShieldCheckIcon, EyeIcon, LockClosedIcon, ServerIcon } from '@heroicons/react/24/outline';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <ShieldCheckIcon className="w-16 h-16 mx-auto mb-4 text-primary-100" />
          <h1 className="text-4xl lg:text-6xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl lg:text-2xl text-primary-100 max-w-3xl mx-auto">
            Your privacy is our top priority. Learn how we protect your data.
          </p>
          <p className="text-sm text-primary-200 mt-4">Last updated: October 12, 2025</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Key Principles */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <EyeIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Tracking</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                We don't track your activity or build profiles about you
              </p>
            </div>
            <div className="text-center">
              <LockClosedIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Anonymous</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                All conversations are completely anonymous
              </p>
            </div>
            <div className="text-center">
              <ServerIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Storage</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Chat messages are not stored on our servers
              </p>
            </div>
          </div>

          {/* Policy Content */}
          <div className="prose prose-lg max-w-none">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">1. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Information We DON'T Collect</h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-2 mb-6">
                <li>• Personal names, email addresses, or phone numbers</li>
                <li>• Chat conversation content or history</li>
                <li>• Location data or GPS coordinates</li>
                <li>• Social media profiles or contacts</li>
                <li>• Payment information (service is completely free)</li>
                <li>• Browsing history or website analytics</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Technical Information We May Collect</h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-2">
                <li>• Anonymous session identifiers (deleted after each session)</li>
                <li>• Basic device type (mobile/desktop) for optimal experience</li>
                <li>• Approximate country/region for matching preferences</li>
                <li>• Connection quality metrics to improve service</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">2. How We Use Information</h2>
              
              <div className="text-gray-600 dark:text-gray-400 space-y-4">
                <p>
                  <strong className="text-gray-900 dark:text-white">Service Operation:</strong> We use minimal technical data to match you with other users and ensure the platform works smoothly.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Safety & Moderation:</strong> Our AI system monitors conversations in real-time for inappropriate content, but does not store or analyze personal information.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Service Improvement:</strong> We analyze anonymous usage patterns to improve matching algorithms and platform performance.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">3. Data Storage & Security</h2>
              
              <div className="text-gray-600 dark:text-gray-400 space-y-4">
                <p>
                  <strong className="text-gray-900 dark:text-white">No Permanent Storage:</strong> Chat messages, video calls, and voice conversations are not recorded or stored on our servers. Once your conversation ends, it's gone forever.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Temporary Session Data:</strong> Session identifiers are created temporarily to facilitate connections and are immediately deleted when you disconnect.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Security Measures:</strong> All connections use industry-standard encryption. Our servers are secured with multiple layers of protection.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Data Location:</strong> Our servers are located in secure data centers with strict access controls and regular security audits.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">4. Cookies & Tracking</h2>
              
              <div className="text-gray-600 dark:text-gray-400 space-y-4">
                <p>
                  <strong className="text-gray-900 dark:text-white">No Tracking Cookies:</strong> We do not use cookies to track your behavior or build advertising profiles.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Essential Cookies Only:</strong> We only use essential technical cookies required for the website to function properly (e.g., session management).
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">No Third-Party Analytics:</strong> We don't use Google Analytics, Facebook Pixel, or any other third-party tracking services.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">5. Third-Party Services</h2>
              
              <div className="text-gray-600 dark:text-gray-400 space-y-4">
                <p>
                  <strong className="text-gray-900 dark:text-white">No Third-Party Integrations:</strong> We don't integrate with social media platforms, advertising networks, or data brokers.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Infrastructure Providers:</strong> We use reputable cloud hosting services, but they cannot access your conversation data as it's encrypted end-to-end.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Safety Tools:</strong> Our AI moderation system operates locally on our servers and doesn't share data with external AI services.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">6. Your Rights & Control</h2>
              
              <div className="text-gray-600 dark:text-gray-400 space-y-4">
                <p>
                  <strong className="text-gray-900 dark:text-white">Complete Anonymity:</strong> You have the right to remain completely anonymous. No account creation or personal information is required.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">End Conversations Anytime:</strong> You can disconnect from any conversation immediately, and all session data is instantly deleted.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Report & Block:</strong> You can report inappropriate behavior and block users instantly during conversations.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Data Requests:</strong> Since we don't store personal data, there's no personal data to request, modify, or delete.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">7. Children's Privacy</h2>
              
              <div className="text-gray-600 dark:text-gray-400 space-y-4">
                <p>
                  Omegoo is intended for users aged 18 and older. We do not knowingly collect any information from users under 18. If you are under 18, please do not use our service.
                </p>
                <p>
                  Parents and guardians should monitor their children's internet usage and ensure they don't access platforms intended for adults.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">8. Contact Us</h2>
              
              <div className="text-gray-600 dark:text-gray-400 space-y-4">
                <p>
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us:
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p><strong>Email:</strong> privacy@omegoo.com</p>
                  <p><strong>Response Time:</strong> Within 48 hours</p>
                </div>
                <p className="text-sm">
                  This Privacy Policy may be updated from time to time. We will notify users of any significant changes by displaying a notice on our website.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;