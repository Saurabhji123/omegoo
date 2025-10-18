import React from 'react';
import { DocumentTextIcon, ExclamationTriangleIcon, ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-2xl mx-4 mt-8 text-white py-12 sm:py-16 lg:py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-primary-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-8 -left-8 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-primary-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative container mx-auto px-4 text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
            <DocumentTextIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <div className="max-w-2xl mx-auto">
            <p className="text-lg sm:text-xl text-blue-100 mb-6 leading-relaxed">
              Building safe connections through clear guidelines and mutual respect
            </p>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-sm text-blue-100">
                <strong className="text-white">Effective Date:</strong> {' '}
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        {/* Core Principles */}
        <div className="py-8 sm:py-12 lg:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
                <div className="bg-white bg-opacity-10 backdrop-blur-md p-4 sm:p-6 rounded-xl border border-white border-opacity-20">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-primary-500 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <ShieldCheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-white mb-2 text-sm sm:text-base">Safety First</h3>
                  <p className="text-gray-200 text-xs sm:text-sm">Zero tolerance for harassment, abuse, or harmful content</p>
                </div>
                <div className="bg-white bg-opacity-10 backdrop-blur-md p-4 sm:p-6 rounded-xl border border-white border-opacity-20">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-white mb-2 text-sm sm:text-base">Respectful Community</h3>
                  <p className="text-gray-200 text-xs sm:text-sm">Treating all users with dignity and kindness</p>
                </div>
                <div className="bg-white bg-opacity-10 backdrop-blur-md p-4 sm:p-6 rounded-xl border border-white border-opacity-20">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <DocumentTextIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-white mb-2 text-sm sm:text-base">Clear Guidelines</h3>
                  <p className="text-gray-200 text-xs sm:text-sm">Transparent rules that protect everyone's experience</p>
                </div>
                <div className="bg-white bg-opacity-10 backdrop-blur-md p-4 sm:p-6 rounded-xl border border-white border-opacity-20">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <ExclamationTriangleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-white mb-2 text-sm sm:text-base">Fair Enforcement</h3>
                  <p className="text-gray-200 text-xs sm:text-sm">Consistent application of rules with appeals process</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms Content */}
        <div className="py-8 sm:py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl shadow-xl border border-white border-opacity-20 overflow-hidden">
                <div className="p-6 sm:p-8 lg:p-12">
                  <div className="flex items-center mb-6 sm:mb-8">
                    <div className="w-2 h-6 sm:h-8 bg-gradient-to-b from-primary-400 to-blue-400 rounded-full mr-3 sm:mr-4"></div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Comprehensive Terms of Service</h2>
                  </div>
                  
                  <div className="prose prose-sm sm:prose-lg max-w-none">
                    {/* 1. Acceptance of Terms */}
                    <div className="mb-6 sm:mb-8">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center">
                        <span className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-primary-400 to-blue-400 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold mr-2 sm:mr-3">1</span>
                        Acceptance of Terms
                      </h3>
                      <div className="space-y-3 sm:space-y-4 text-gray-200 text-sm sm:text-base">
                        <p>
                          By accessing or using Omegoo ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
                        </p>
                      </div>
                    </div>

                    {/* 2. Description of Service */}
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <span className="w-8 h-8 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">2</span>
                        Description of Service
                      </h3>
                      <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        <p>
                          Omegoo is a random video chat platform that connects users with strangers for conversations through video, audio, and text. The Service is designed to facilitate connections between people worldwide in a safe and respectful environment.
                        </p>
                        <p>
                          <strong className="text-white">Key Features:</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Random video and audio chat matching</li>
                          <li>Text-based messaging capabilities</li>
                          <li>User reporting and moderation tools</li>
                          <li>Interest-based matching options</li>
                          <li>Privacy controls and safety features</li>
                        </ul>
                      </div>
                    </div>

                    {/* 3. Eligibility */}
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <span className="w-8 h-8 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">3</span>
                        Eligibility
                      </h3>
                      <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        <p>
                          <strong className="text-white">Age Requirements:</strong> You must be at least 18 years old to use Omegoo. Users between 13-17 years old may only use the Service with explicit parental consent and supervision.
                        </p>
                        <p>
                          <strong className="text-white">Legal Capacity:</strong> You must have the legal capacity to enter into this agreement in your jurisdiction.
                        </p>
                        <p>
                          <strong className="text-white">Geographic Restrictions:</strong> The Service may not be available in all countries or regions due to local laws and regulations.
                        </p>
                      </div>
                    </div>

                    {/* 4. User Conduct and Community Guidelines */}
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <span className="w-8 h-8 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">4</span>
                        User Conduct and Community Guidelines
                      </h3>
                      <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        <p>
                          <strong className="text-white">Acceptable Use:</strong> Users are expected to maintain respectful, appropriate behavior during all interactions.
                        </p>
                        
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <h4 className="font-bold text-red-800 dark:text-red-200 mb-2">🚫 Prohibited Conduct</h4>
                          <p className="text-red-700 dark:text-red-300 text-sm mb-3">The following behaviors are strictly prohibited and will result in immediate account suspension or termination:</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-semibold text-red-800 dark:text-red-200 text-sm mb-2">Content Violations</h5>
                              <ul className="text-red-700 dark:text-red-300 text-xs space-y-1">
                                <li>• Nudity or sexually explicit content</li>
                                <li>• Harassment, bullying, or intimidation</li>
                                <li>• Hate speech or discriminatory language</li>
                                <li>• Violence or threats of violence</li>
                                <li>• Sharing of illegal content</li>
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-semibold text-red-800 dark:text-red-200 text-sm mb-2">Platform Abuse</h5>
                              <ul className="text-red-700 dark:text-red-300 text-xs space-y-1">
                                <li>• Spamming or excessive messaging</li>
                                <li>• Impersonation of others</li>
                                <li>• Commercial solicitation without permission</li>
                                <li>• Sharing personal information of others</li>
                                <li>• Circumventing safety measures</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 5. Privacy and Data Protection */}
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <span className="w-8 h-8 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">5</span>
                        Privacy and Data Protection  
                      </h3>
                      <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        <p>
                          Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.
                        </p>
                        <p>
                          <strong className="text-white">Data Collection:</strong> We collect only the minimum data necessary to provide the Service, including basic usage analytics and safety-related information.
                        </p>
                        <p>
                          <strong className="text-white">Data Retention:</strong> Personal data is retained only as long as necessary for service provision and legal compliance.
                        </p>
                      </div>
                    </div>

                    {/* 6. Safety and Moderation */}
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <span className="w-8 h-8 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">6</span>
                        Safety and Moderation
                      </h3>
                      <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        <p>
                          <strong className="text-white">Automated Moderation:</strong> We employ AI-powered content moderation to detect and prevent inappropriate content in real-time.
                        </p>
                        <p>
                          <strong className="text-white">Human Review:</strong> Reported content is reviewed by trained moderators within 24 hours.
                        </p>
                        <p>
                          <strong className="text-white">User Reporting:</strong> Users can report inappropriate behavior through in-app reporting tools available during and after conversations.
                        </p>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2">🛡️ Safety Features</h4>
                          <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                            <li>• One-click disconnect and report functionality</li>
                            <li>• Automatic inappropriate content detection</li>
                            <li>• Interest-based matching to improve compatibility</li>
                            <li>• Community guidelines prominently displayed</li>
                            <li>• 24/7 safety team availability</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* 7. Account Termination */}
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <span className="w-8 h-8 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">7</span>
                        Account Termination
                      </h3>
                      <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        <p>
                          <strong className="text-white">Voluntary Termination:</strong> You may discontinue using the Service at any time.
                        </p>
                        <p>
                          <strong className="text-white">Involuntary Termination:</strong> We reserve the right to suspend or terminate accounts that violate these Terms or pose a risk to user safety.
                        </p>
                        <p>
                          <strong className="text-white">Appeals Process:</strong> Users may appeal termination decisions through our support system within 30 days.
                        </p>
                      </div>
                    </div>

                    {/* 8. Limitation of Liability */}
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <span className="w-8 h-8 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">8</span>
                        Limitation of Liability
                      </h3>
                      <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        <p>
                          The Service is provided "as is" without warranties of any kind. We are not liable for user-generated content or interactions between users.
                        </p>
                        <p>
                          <strong className="text-white">Disclaimer:</strong> While we implement safety measures, users interact at their own risk and should exercise caution when sharing personal information.
                        </p>
                      </div>
                    </div>

                    {/* 9. Changes to Terms */}
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <span className="w-8 h-8 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">9</span>
                        Changes to Terms
                      </h3>
                      <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        <p>
                          We may update these Terms periodically. Users will be notified of significant changes through the platform or email.
                        </p>
                        <p>
                          <strong className="text-white">Effective Date:</strong> Changes become effective 30 days after notification unless otherwise specified.
                        </p>
                      </div>
                    </div>

                    {/* 10. Contact Information */}
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <span className="w-8 h-8 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">10</span>
                        Contact Information
                      </h3>
                      <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        <p>
                          For questions about these Terms or to report violations, please contact us:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <p>
                              <strong className="text-white">General Inquiries:</strong> support@omegoo.com
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <p>
                              <strong className="text-white">Safety Reports:</strong> safety@omegoo.com
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-primary-50 via-blue-50 to-purple-50 dark:from-primary-900/20 dark:via-blue-900/20 dark:to-purple-900/20 p-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong className="text-white">Legal Disclaimer:</strong> These terms are governed by applicable law and jurisdiction requirements.
                  </p>
                  <p>
                    <strong className="text-white">Safety Concerns:</strong> Contact us at safety@omegoo.com
                  </p>
                  <p>
                    <strong className="text-white">Terms Updates:</strong> We may update these terms from time to time. Continued use of the service constitutes acceptance of updated terms.
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
    </div>
  );
};

export default TermsOfService;
