import React from 'react';
import { DocumentTextIcon, ExclamationTriangleIcon, ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-primary-100" />
          <h1 className="text-4xl lg:text-6xl font-bold mb-4">Terms of Service</h1>
          <p className="text-xl lg:text-2xl text-primary-100 max-w-3xl mx-auto">
            Guidelines for using Omegoo responsibly and safely
          </p>
          <p className="text-sm text-primary-200 mt-4">Last updated: October 12, 2025</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Quick Guidelines */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <ShieldCheckIcon className="w-10 h-10 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-green-800 dark:text-green-400 mb-2">Be Respectful</h3>
              <p className="text-sm text-green-700 dark:text-green-300">Treat others with kindness and respect</p>
            </div>
            <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <UserGroupIcon className="w-10 h-10 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">Stay Safe</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">Don't share personal information</p>
            </div>
            <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <DocumentTextIcon className="w-10 h-10 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-purple-800 dark:text-purple-400 mb-2">Follow Rules</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">Abide by community guidelines</p>
            </div>
            <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <ExclamationTriangleIcon className="w-10 h-10 text-red-600 mx-auto mb-3" />
              <h3 className="font-semibold text-red-800 dark:text-red-400 mb-2">Report Issues</h3>
              <p className="text-sm text-red-700 dark:text-red-300">Report inappropriate behavior</p>
            </div>
          </div>

          {/* Terms Content */}
          <div className="prose prose-lg max-w-none">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">1. Acceptance of Terms</h2>
              
              <div className="text-gray-600 dark:text-gray-400 space-y-4">
                <p>
                  By accessing and using Omegoo, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service.
                </p>
                <p>
                  These terms apply to all visitors, users, and others who access or use the service.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">2. Service Description</h2>
              
              <div className="text-gray-600 dark:text-gray-400 space-y-4">
                <p>
                  Omegoo is a platform that connects users for anonymous conversations through text, audio, and video chat. Our service is designed to facilitate random, spontaneous interactions between strangers worldwide.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Key Features:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Anonymous text, audio, and video chat</li>
                  <li>Random user matching</li>
                  <li>No registration required</li>
                  <li>Real-time moderation and safety features</li>
                  <li>Cross-platform compatibility</li>
                </ul>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">3. User Eligibility & Requirements</h2>
              
              <div className="text-gray-600 dark:text-gray-400 space-y-4">
                <p>
                  <strong className="text-gray-900 dark:text-white">Age Requirement:</strong> You must be at least 18 years old to use Omegoo. By using our service, you represent and warrant that you are 18 or older.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Technical Requirements:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>A compatible device (computer, smartphone, or tablet)</li>
                  <li>Stable internet connection</li>
                  <li>Modern web browser with camera/microphone permissions (for video/audio chat)</li>
                  <li>Compliance with local laws and regulations</li>
                </ul>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">4. Prohibited Conduct</h2>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-800 dark:text-red-200 font-medium mb-2">
                  The following behaviors are strictly prohibited and will result in immediate termination:
                </p>
              </div>

              <div className="text-gray-600 dark:text-gray-400 space-y-4">
                <p><strong className="text-gray-900 dark:text-white">Sexual Content & Nudity:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Nudity or sexually explicit content</li>
                  <li>Sexual solicitation or prostitution</li>
                  <li>Sharing intimate images without consent</li>
                </ul>

                <p><strong className="text-gray-900 dark:text-white">Harassment & Abuse:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Harassment, bullying, or intimidation</li>
                  <li>Hate speech or discriminatory language</li>
                  <li>Threats of violence or harm</li>
                </ul>

                <p><strong className="text-gray-900 dark:text-white">Illegal Activities:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Sharing illegal content or promoting illegal activities</li>
                  <li>Drug sales or distribution</li>
                  <li>Fraud, scams, or financial crimes</li>
                </ul>

                <p><strong className="text-gray-900 dark:text-white">Privacy Violations:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Recording conversations without consent</li>
                  <li>Sharing personal information of others</li>
                  <li>Attempting to identify or track other users</li>
                </ul>

                <p><strong className="text-gray-900 dark:text-white">Platform Abuse:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Attempting to hack or disrupt the service</li>
                  <li>Creating automated bots or spam</li>
                  <li>Circumventing safety measures or bans</li>
                </ul>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">5. Safety & Moderation</h2>
              
              <div className="text-gray-600 dark:text-gray-400 space-y-4">
                <p>
                  <strong className="text-gray-900 dark:text-white">AI Moderation:</strong> Our platform uses advanced AI to monitor conversations in real-time and detect inappropriate content. This system works automatically to maintain a safe environment.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">User Reporting:</strong> All users can report inappropriate behavior instantly. Reports are reviewed promptly by our moderation team.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Enforcement Actions:</strong> Violations may result in warnings, temporary suspensions, or permanent bans depending on severity.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Emergency Situations:</strong> If you encounter illegal content or immediate safety threats, contact local authorities and report to us immediately.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">6. Privacy & Data</h2>
              
              <div className="text-gray-600 dark:text-gray-400 space-y-4">
                <p>
                  <strong className="text-gray-900 dark:text-white">No Data Storage:</strong> We do not store your conversations, personal information, or chat history. All interactions are temporary and deleted immediately after sessions end.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Anonymous Service:</strong> No registration, email, or personal information is required to use Omegoo.
                </p>
                <p>
                  For detailed information about our privacy practices, please review our <a href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</a>.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">7. Disclaimers & Limitations</h2>
              
              <div className="text-gray-600 dark:text-gray-400 space-y-4">
                <p>
                  <strong className="text-gray-900 dark:text-white">Service Availability:</strong> We strive to maintain 24/7 availability but cannot guarantee uninterrupted service. Maintenance, updates, or technical issues may cause temporary disruptions.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">"As Is" Service:</strong> Omegoo is provided "as is" without warranties of any kind. We make no guarantees about the quality, safety, or appropriateness of user interactions.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">User Responsibility:</strong> You are responsible for your own safety and the content of your communications. We encourage users to exercise caution and good judgment.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Third-Party Content:</strong> We are not responsible for content, actions, or behavior of other users on the platform.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">8. Intellectual Property</h2>
              
              <div className="text-gray-600 dark:text-gray-400 space-y-4">
                <p>
                  The Omegoo platform, including its design, code, logos, and content, is protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without permission.
                </p>
                <p>
                  Users retain ownership of their own content but grant Omegoo the right to use, moderate, and remove content as necessary for service operation and safety.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">9. Contact & Changes</h2>
              
              <div className="text-gray-600 dark:text-gray-400 space-y-4">
                <p>
                  <strong className="text-gray-900 dark:text-white">Questions about Terms:</strong> Contact us at legal@omegoo.com
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Safety Concerns:</strong> Contact us at safety@omegoo.com
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Terms Updates:</strong> We may update these terms from time to time. Continued use of the service constitutes acceptance of updated terms.
                </p>
                
                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mt-6">
                  <p className="text-primary-800 dark:text-primary-200 text-sm">
                    <strong>Remember:</strong> By using Omegoo, you agree to these terms and commit to maintaining a safe, respectful environment for all users. Thank you for being part of our community!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;