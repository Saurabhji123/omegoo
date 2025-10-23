import React from 'react';
import { ShieldCheckIcon, EyeIcon, LockClosedIcon, ServerIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
// UserGroupIcon reserved for future social features section

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-2xl mx-4 mt-8 text-white py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <ShieldCheckIcon className="w-12 h-12 sm:w-16 sm:h-16 text-primary-100" />
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-primary-100 max-w-4xl mx-auto leading-relaxed">
            Your privacy is our foundation. We believe in complete transparency about how we protect your data and ensure your anonymity.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 mt-6">
            <p className="text-sm text-primary-200">Last updated: October 23, 2025</p>
            <div className="hidden sm:block w-1 h-1 bg-primary-200 rounded-full"></div>
            <p className="text-sm text-primary-200">Effective immediately</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto">
          {/* Key Principles */}
          <div className="mb-16 lg:mb-20">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Our Privacy Principles
              </h2>
              <p className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto">
                We built Omegoo with privacy-first design. Here's how we protect you:
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-center group">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-full opacity-20 group-hover:opacity-30 transition-opacity blur-lg"></div>
                  <EyeIcon className="w-12 h-12 text-red-500 mx-auto relative z-10" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white">Zero Tracking</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  No cookies, analytics, or behavioral tracking of any kind
                </p>
              </div>
              
              <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-center group">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-20 group-hover:opacity-30 transition-opacity blur-lg"></div>
                  <LockClosedIcon className="w-12 h-12 text-blue-500 mx-auto relative z-10" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white">Complete Anonymity</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  No accounts, names, or personal data required ever
                </p>
              </div>
              
              <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-center group">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-20 group-hover:opacity-30 transition-opacity blur-lg"></div>
                  <ServerIcon className="w-12 h-12 text-green-500 mx-auto relative z-10" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white">Zero Storage</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Conversations vanish instantly when you disconnect
                </p>
              </div>
              
              <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-center group">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-violet-400 rounded-full opacity-20 group-hover:opacity-30 transition-opacity blur-lg"></div>
                  <GlobeAltIcon className="w-12 h-12 text-purple-500 mx-auto relative z-10" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white">Global Privacy</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  GDPR, CCPA, and worldwide privacy standards compliant
                </p>
              </div>
            </div>
          </div>

          {/* Policy Content */}
          <div className="space-y-8 lg:space-y-12">
            <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 p-1">
                <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl p-6 sm:p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-2 h-8 bg-gradient-to-b from-red-500 to-pink-500 rounded-full mr-4"></div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">1. Data We NEVER Collect</h2>
                  </div>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 mb-8">
                    <div className="flex items-start">
                      <svg className="w-6 h-6 text-red-600 mt-1 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Absolutely No Personal Data</h3>
                        <p className="text-red-700 dark:text-red-300 text-sm">
                          We are committed to true anonymity. Here's what we will NEVER collect or store:
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                        </svg>
                        Personal Information
                      </h3>
                      <ul className="text-gray-300 space-y-3 text-sm">
                        <li className="flex items-start">
                          <svg className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Names, usernames, or nicknames
                        </li>
                        <li className="flex items-start">
                          <svg className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Email addresses or phone numbers
                        </li>
                        <li className="flex items-start">
                          <svg className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Social media profiles or accounts
                        </li>
                        <li className="flex items-start">
                          <svg className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Photos, videos, or media files
                        </li>
                      </ul>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                        </svg>
                        Content & Behavior
                      </h3>
                      <ul className="text-gray-300 space-y-3 text-sm">
                        <li className="flex items-start">
                          <svg className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Chat messages or conversation content
                        </li>
                        <li className="flex items-start">
                          <svg className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Voice recordings or video streams
                        </li>
                        <li className="flex items-start">
                          <svg className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Location data or GPS coordinates
                        </li>
                        <li className="flex items-start">
                          <svg className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Browsing history or website analytics
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
                    <div className="flex items-start">
                      <svg className="w-6 h-6 text-green-600 mt-1 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">Technical Data (Minimal & Anonymous)</h3>
                        <p className="text-green-700 dark:text-green-300 text-sm mb-4">
                          To provide a functional service, we collect only essential, anonymous technical information:
                        </p>
                        <ul className="text-green-700 dark:text-green-300 text-sm space-y-2">
                          <li>• Anonymous session tokens (deleted immediately after disconnect)</li>
                          <li>• Basic device type (mobile/desktop) for UI optimization</li>
                          <li>• General region (country-level) for server routing</li>
                          <li>• Connection quality metrics for service improvement</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1">
                <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl p-6 sm:p-8">
                  <div className="flex items-center mb-8">
                    <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-4"></div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">2. How We Use Minimal Data</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 p-6 rounded-r-2xl">
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-2">Instant Service Operation</h3>
                          <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed mb-3">
                            We use minimal anonymous technical data only to facilitate real-time connections between users. This includes:
                          </p>
                          <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                            <li>• Creating temporary anonymous session pairs</li>
                            <li>• Optimizing connection quality for your device</li>
                            <li>• Ensuring regional server routing for speed</li>
                            <li>• Maintaining service availability during peak usage</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500 p-6 rounded-r-2xl">
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-green-800 dark:text-green-200 mb-2">Anonymous Safety Monitoring</h3>
                          <p className="text-green-700 dark:text-green-300 text-sm leading-relaxed mb-3">
                            Our AI-powered safety system protects users without compromising privacy:
                          </p>
                          <ul className="text-green-700 dark:text-green-300 text-sm space-y-1">
                            <li>• Real-time content filtering (no storage or logging)</li>
                            <li>• Automated detection of harmful behavior patterns</li>
                            <li>• Instant disconnection for policy violations</li>
                            <li>• No message content analysis or storage</li>
                          </ul>
                          <div className="mt-3 p-3 bg-green-100 dark:bg-green-800/30 rounded-lg">
                            <p className="text-green-800 dark:text-green-200 text-xs font-medium">
                              🛡️ Safety First: Our system can detect harmful content without reading or storing your messages
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-l-4 border-purple-500 p-6 rounded-r-2xl">
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-purple-800 dark:text-purple-200 mb-2">Anonymous Service Improvement</h3>
                          <p className="text-purple-700 dark:text-purple-300 text-sm leading-relaxed mb-3">
                            We analyze completely anonymous usage patterns to enhance your experience:
                          </p>
                          <ul className="text-purple-700 dark:text-purple-300 text-sm space-y-1">
                            <li>• Connection success rates (no user identification)</li>
                            <li>• General geographic load balancing</li>
                            <li>• Platform performance optimization</li>
                            <li>• Anonymous user preference trends</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/20 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                    <div className="flex items-center mb-4">
                      <svg className="w-8 h-8 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-xl font-bold text-white">Important: What We Never Do</h3>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        <p className="font-medium text-red-600 dark:text-red-400 mb-2">❌ We Never:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Sell your data to third parties</li>
                          <li>• Create advertising profiles</li>
                          <li>• Track you across other websites</li>
                          <li>• Store conversation transcripts</li>
                        </ul>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        <p className="font-medium text-green-600 dark:text-green-400 mb-2">✅ We Always:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Keep data processing to absolute minimum</li>
                          <li>• Delete session data immediately after use</li>
                          <li>• Prioritize your privacy over profits</li>
                          <li>• Maintain complete transparency</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-1">
                <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl p-6 sm:p-8">
                  <div className="flex items-center mb-8">
                    <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full mr-4"></div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">3. Ultra-Secure Architecture</h2>
                  </div>
                  
                  <div className="grid lg:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-red-800 dark:text-red-200">Zero Permanent Storage</h3>
                        </div>
                        <div className="space-y-3">
                          <p className="text-red-700 dark:text-red-300 text-sm leading-relaxed">
                            <strong>Absolute Privacy Guarantee:</strong> No conversation data ever touches our permanent storage systems.
                          </p>
                          <ul className="text-red-700 dark:text-red-300 text-sm space-y-2">
                            <li className="flex items-start">
                              <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Text messages: Pass-through only, never logged
                            </li>
                            <li className="flex items-start">
                              <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Video calls: Direct peer-to-peer streams
                            </li>
                            <li className="flex items-start">
                              <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Voice chats: No recording or caching
                            </li>
                            <li className="flex items-start">
                              <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Session history: Wiped on disconnect
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-orange-800 dark:text-orange-200">Instant Data Deletion</h3>
                        </div>
                        <div className="space-y-3">
                          <p className="text-orange-700 dark:text-orange-300 text-sm leading-relaxed">
                            Temporary data is automatically purged within seconds of your session ending.
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center text-orange-700 dark:text-orange-300 text-sm">
                              <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                              Session tokens: Deleted on disconnect
                            </div>
                            <div className="flex items-center text-orange-700 dark:text-orange-300 text-sm">
                              <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                              Connection metadata: Auto-expire in 30 seconds
                            </div>
                            <div className="flex items-center text-orange-700 dark:text-orange-300 text-sm">
                              <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                              Server cache: Cleared every 60 seconds
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">Military-Grade Security</h3>
                        </div>
                        <div className="space-y-4">
                          <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
                            Multi-layered security infrastructure protects every connection.
                          </p>
                          <div className="space-y-3">
                            <div className="bg-blue-100 dark:bg-blue-800/30 rounded-lg p-3">
                              <h4 className="font-semibold text-blue-800 dark:text-blue-200 text-sm mb-1">🔐 Encryption Standards</h4>
                              <ul className="text-blue-700 dark:text-blue-300 text-xs space-y-1">
                                <li>• TLS 1.3 for all connections</li>
                                <li>• WebSocket Secure (WSS) protocol</li>
                                <li>• AES-256 data encryption</li>
                                <li>• Perfect Forward Secrecy</li>
                              </ul>
                            </div>
                            <div className="bg-cyan-100 dark:bg-cyan-800/30 rounded-lg p-3">
                              <h4 className="font-semibold text-cyan-800 dark:text-cyan-200 text-sm mb-1">🛡️ Server Protection</h4>
                              <ul className="text-cyan-700 dark:text-cyan-300 text-xs space-y-1">
                                <li>• DDoS mitigation systems</li>
                                <li>• Intrusion detection & prevention</li>
                                <li>• Regular security audits</li>
                                <li>• Zero-knowledge architecture</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-green-800 dark:text-green-200">Infrastructure Details</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="text-green-700 dark:text-green-300 text-sm space-y-2">
                            <p><strong>Data Centers:</strong> Tier-4 facilities with 24/7 monitoring</p>
                            <p><strong>Compliance:</strong> GDPR, CCPA, and SOC 2 compliant</p>
                            <p><strong>Access Control:</strong> Multi-factor authentication required</p>
                            <p><strong>Monitoring:</strong> Real-time threat detection systems</p>
                          </div>
                          <div className="mt-4 p-3 bg-green-100 dark:bg-green-800/30 rounded-lg">
                            <p className="text-green-800 dark:text-green-200 text-xs font-medium">
                              🌍 Global Infrastructure: Distributed servers ensure low latency and high availability worldwide
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">Security Promise</h3>
                      <p className="text-gray-300 text-sm leading-relaxed max-w-2xl mx-auto">
                        Our security infrastructure is designed with one principle: <strong className="text-indigo-600 dark:text-indigo-400">your privacy comes first</strong>. 
                        We've built a system where even we cannot access your conversations, ensuring true end-to-end privacy.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-1">
                <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl p-6 sm:p-8">
                  <div className="flex items-center mb-8">
                    <div className="w-2 h-8 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full mr-4"></div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">4. Zero Tracking Policy</h2>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="group bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-3">Zero Tracking Cookies</h3>
                      <p className="text-red-700 dark:text-red-300 text-sm leading-relaxed mb-4">
                        We completely refuse to track your behavior or build advertising profiles.
                      </p>
                      <ul className="text-red-600 dark:text-red-400 text-xs space-y-2">
                        <li className="flex items-start">
                          <svg className="w-3 h-3 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          No behavioral tracking
                        </li>
                        <li className="flex items-start">
                          <svg className="w-3 h-3 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          No advertising profiles
                        </li>
                        <li className="flex items-start">
                          <svg className="w-3 h-3 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          No cross-site tracking
                        </li>
                      </ul>
                    </div>
                    
                    <div className="group bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-green-800 dark:text-green-200 mb-3">Essential Only</h3>
                      <p className="text-green-700 dark:text-green-300 text-sm leading-relaxed mb-4">
                        Only absolutely necessary technical cookies for basic functionality.
                      </p>
                      <ul className="text-green-600 dark:text-green-400 text-xs space-y-2">
                        <li className="flex items-start">
                          <svg className="w-3 h-3 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Session management
                        </li>
                        <li className="flex items-start">
                          <svg className="w-3 h-3 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Security preferences
                        </li>
                        <li className="flex items-start">
                          <svg className="w-3 h-3 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Auto-expire after session
                        </li>
                      </ul>
                    </div>
                    
                    <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-3">No Analytics</h3>
                      <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed mb-4">
                        We refuse to use any third-party analytics or tracking services.
                      </p>
                      <ul className="text-blue-600 dark:text-blue-400 text-xs space-y-2">
                        <li className="flex items-start">
                          <svg className="w-3 h-3 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          No Google Analytics
                        </li>
                        <li className="flex items-start">
                          <svg className="w-3 h-3 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          No Facebook Pixel
                        </li>
                        <li className="flex items-start">
                          <svg className="w-3 h-3 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          No third-party scripts
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mr-4">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-200">Cookie Transparency</h3>
                    </div>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm leading-relaxed">
                      <strong>Full Transparency:</strong> The few technical cookies we use are essential for the basic functionality of the website. 
                      They are automatically deleted when you close your browser or after your session ends. We believe in being completely 
                      transparent about our minimal data practices.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-1">
                <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl p-6 sm:p-8">
                  <div className="flex items-center mb-8">
                    <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full mr-4"></div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">5. Zero Third-Party Sharing</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-l-4 border-red-500 p-6 rounded-r-2xl">
                      <div className="flex items-start">
                        <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-3">Complete Independence</h3>
                          <p className="text-red-700 dark:text-red-300 text-sm leading-relaxed mb-4">
                            We maintain complete independence from all data-hungry platforms and services:
                          </p>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <ul className="text-red-700 dark:text-red-300 text-sm space-y-2">
                              <li className="flex items-start">
                                <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                No social media integration
                              </li>
                              <li className="flex items-start">
                                <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                No advertising networks
                              </li>
                              <li className="flex items-start">
                                <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                No data brokers or aggregators
                              </li>
                            </ul>
                            <ul className="text-red-700 dark:text-red-300 text-sm space-y-2">
                              <li className="flex items-start">
                                <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                No external marketing services
                              </li>
                              <li className="flex items-start">
                                <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                No CDN user tracking
                              </li>
                              <li className="flex items-start">
                                <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                No payment processors (free service)
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-l-4 border-blue-500 p-6 rounded-r-2xl">
                      <div className="flex items-start">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-3">Secure Infrastructure Partners</h3>
                          <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed mb-4">
                            While we use trusted infrastructure providers, they operate under strict privacy controls:
                          </p>
                          <div className="space-y-3">
                            <div className="bg-blue-100 dark:bg-blue-800/30 rounded-lg p-4">
                              <div className="flex items-center mb-2">
                                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                                <span className="font-semibold text-blue-800 dark:text-blue-200 text-sm">Cloud Hosting</span>
                              </div>
                              <p className="text-blue-700 dark:text-blue-300 text-xs">
                                Enterprise-grade servers with end-to-end encryption. Even our hosting partners cannot decrypt your conversations.
                              </p>
                            </div>
                            <div className="bg-cyan-100 dark:bg-cyan-800/30 rounded-lg p-4">
                              <div className="flex items-center mb-2">
                                <svg className="w-5 h-5 text-cyan-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                </svg>
                                <span className="font-semibold text-cyan-800 dark:text-cyan-200 text-sm">CDN & Security</span>
                              </div>
                              <p className="text-cyan-700 dark:text-cyan-300 text-xs">
                                Content delivery optimized for speed without compromising privacy. No user data shared with CDN providers.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500 p-6 rounded-r-2xl">
                      <div className="flex items-start">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-3">Local AI Safety</h3>
                          <p className="text-green-700 dark:text-green-300 text-sm leading-relaxed mb-4">
                            Our content moderation system operates entirely on our own servers:
                          </p>
                          <ul className="text-green-700 dark:text-green-300 text-sm space-y-2">
                            <li className="flex items-start">
                              <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              No external AI services or APIs used
                            </li>
                            <li className="flex items-start">
                              <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Real-time processing without data storage
                            </li>
                            <li className="flex items-start">
                              <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Complete data isolation from third parties
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-1">
                <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl p-6 sm:p-8">
                  <div className="flex items-center mb-8">
                    <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full mr-4"></div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">6. Your Complete Control</h2>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200">Ultimate Anonymity</h3>
                        </div>
                        <p className="text-emerald-700 dark:text-emerald-300 text-sm leading-relaxed mb-4">
                          Your right to complete anonymity is guaranteed and protected by our technical architecture.
                        </p>
                        <ul className="text-emerald-700 dark:text-emerald-300 text-sm space-y-2">
                          <li className="flex items-start">
                            <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Zero registration required - ever
                          </li>
                          <li className="flex items-start">
                            <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            No personal information collected
                          </li>
                          <li className="flex items-start">
                            <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Impossible to track or identify you
                          </li>
                        </ul>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">Instant Control</h3>
                        </div>
                        <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed mb-4">
                          You have immediate, absolute control over every interaction.
                        </p>
                        <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-2">
                          <li className="flex items-start">
                            <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            End conversations with one click
                          </li>
                          <li className="flex items-start">
                            <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Data deleted instantly on disconnect
                          </li>
                          <li className="flex items-start">
                            <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            No traces left behind
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-red-800 dark:text-red-200">Safety Controls</h3>
                        </div>
                        <p className="text-red-700 dark:text-red-300 text-sm leading-relaxed mb-4">
                          Built-in tools to protect yourself from inappropriate behavior.
                        </p>
                        <ul className="text-red-700 dark:text-red-300 text-sm space-y-2">
                          <li className="flex items-start">
                            <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Report inappropriate users instantly
                          </li>
                          <li className="flex items-start">
                            <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Block users with immediate effect
                          </li>
                          <li className="flex items-start">
                            <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            AI safety monitoring active 24/7
                          </li>
                        </ul>
                      </div>

                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-slate-600 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Data Rights Reality</h3>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
                          <strong>No Data = No Data Requests:</strong> Since we don't collect or store personal data, there's literally nothing to:
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                            <svg className="w-6 h-6 text-gray-500 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                            </svg>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Access</p>
                            <p className="text-xs text-gray-500">No data to access</p>
                          </div>
                          <div className="text-center p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                            <svg className="w-6 h-6 text-gray-500 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                            </svg>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Modify</p>
                            <p className="text-xs text-gray-500">No data to modify</p>
                          </div>
                          <div className="text-center p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                            <svg className="w-6 h-6 text-gray-500 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                            </svg>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Delete</p>
                            <p className="text-xs text-gray-500">No data to delete</p>
                          </div>
                          <div className="text-center p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                            <svg className="w-6 h-6 text-gray-500 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                            </svg>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Port</p>
                            <p className="text-xs text-gray-500">No data to export</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-1">
                <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl p-6 sm:p-8">
                  <div className="flex items-center mb-8">
                    <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full mr-4"></div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">7. Age Restrictions & Child Safety</h2>
                  </div>
                  
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-red-800 dark:text-red-200">18+ Only Platform</h3>
                        </div>
                        <div className="space-y-4">
                          <p className="text-red-700 dark:text-red-300 text-sm leading-relaxed">
                            <strong>Strict Age Requirement:</strong> Omegoo is exclusively designed for adults aged 18 and older. We do not permit minors on our platform.
                          </p>
                          <div className="bg-red-100 dark:bg-red-800/30 rounded-lg p-4">
                            <ul className="text-red-800 dark:text-red-200 text-sm space-y-2">
                              <li className="flex items-start">
                                <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span>Minimum age: 18 years old</span>
                              </li>
                              <li className="flex items-start">
                                <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span>Adult content may be present</span>
                              </li>
                              <li className="flex items-start">
                                <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span>Mature conversations expected</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">Zero Data Collection</h3>
                        </div>
                        <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
                          <strong>Child Protection by Design:</strong> Since we collect zero personal information from anyone, we cannot accidentally collect data from minors. Our no-data architecture inherently protects children's privacy.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-purple-800 dark:text-purple-200">For Parents & Guardians</h3>
                        </div>
                        <div className="space-y-4">
                          <p className="text-purple-700 dark:text-purple-300 text-sm leading-relaxed">
                            <strong>Important Responsibility:</strong> Parents and guardians play a crucial role in protecting children online.
                          </p>
                          <ul className="text-purple-700 dark:text-purple-300 text-sm space-y-3">
                            <li className="flex items-start">
                              <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Monitor your children's internet activity
                            </li>
                            <li className="flex items-start">
                              <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Use parental control software
                            </li>
                            <li className="flex items-start">
                              <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Block access to adult-oriented platforms
                            </li>
                            <li className="flex items-start">
                              <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Educate about online safety
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-green-800 dark:text-green-200">Report Violations</h3>
                        </div>
                        <p className="text-green-700 dark:text-green-300 text-sm">
                          If you believe a minor is accessing our platform, please contact us immediately at 
                          <span className="font-semibold"> omegoochat@gmail.com</span> for investigation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-slate-600 to-gray-700 p-1">
                <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl p-6 sm:p-8">
                  <div className="flex items-center mb-8">
                    <div className="w-2 h-8 bg-gradient-to-b from-slate-600 to-gray-700 rounded-full mr-4"></div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">8. Contact & Support</h2>
                  </div>
                  
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">Get in Touch</h3>
                        </div>
                        <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed mb-4">
                          Have questions about our privacy practices or need support? We're here to help with complete transparency.
                        </p>
                        
                        <div className="space-y-4">
                          <div className="bg-blue-100 dark:bg-blue-800/30 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                              </svg>
                              <span className="font-semibold text-blue-800 dark:text-blue-200">Privacy Questions</span>
                            </div>
                            <p className="text-blue-700 dark:text-blue-300 text-sm">
                              <strong>omegoochat@gmail.com</strong><br />
                              For privacy policy questions and data inquiries
                            </p>
                          </div>

                          <div className="bg-red-100 dark:bg-red-800/30 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="font-semibold text-red-800 dark:text-red-200">Safety & Abuse</span>
                            </div>
                            <p className="text-red-700 dark:text-red-300 text-sm">
                              <strong>omegoochat@gmail.com</strong><br />
                              Report violations, abuse, or safety concerns
                            </p>
                          </div>

                          <div className="bg-green-100 dark:bg-green-800/30 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              <span className="font-semibold text-green-800 dark:text-green-200">General Support</span>
                            </div>
                            <p className="text-green-700 dark:text-green-300 text-sm">
                              <strong>omegoochat@gmail.com</strong><br />
                              Technical issues and general inquiries
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-purple-800 dark:text-purple-200">Response Times</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-purple-100 dark:bg-purple-800/30 rounded-lg">
                              <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">24h</div>
                              <div className="text-xs text-purple-600 dark:text-purple-400">Safety Issues</div>
                            </div>
                            <div className="text-center p-4 bg-pink-100 dark:bg-pink-800/30 rounded-lg">
                              <div className="text-2xl font-bold text-pink-800 dark:text-pink-200">48h</div>
                              <div className="text-xs text-pink-600 dark:text-pink-400">Privacy Questions</div>
                            </div>
                          </div>
                          <p className="text-purple-700 dark:text-purple-300 text-sm">
                            We prioritize safety-related reports and privacy concerns. All emails are personally reviewed by our team.
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-slate-600 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Policy Updates</h3>
                        </div>
                        <div className="space-y-3">
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            <strong>Transparency Promise:</strong> Any significant changes to this Privacy Policy will be clearly communicated.
                          </p>
                          <ul className="text-gray-300 text-sm space-y-2">
                            <li className="flex items-start">
                              <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Website banner notifications
                            </li>
                            <li className="flex items-start">
                              <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Version history maintained
                            </li>
                            <li className="flex items-start">
                              <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              30-day advance notice for major changes
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 text-center bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-gray-700 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Our Commitment to You</h3>
                    <p className="text-gray-300 text-sm leading-relaxed max-w-2xl mx-auto">
                      This Privacy Policy reflects our core values: <strong className="text-slate-600 dark:text-slate-400">absolute privacy, complete transparency, and user empowerment</strong>. 
                      We built Omegoo to prove that meaningful connections don't require sacrificing your privacy.
                    </p>
                    <div className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                      Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | Version 2.0
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COPYRIGHT & INTELLECTUAL PROPERTY PROTECTION */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 p-1">
                <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl p-6 sm:p-8">
                  <div className="flex items-center mb-8">
                    <div className="w-2 h-8 bg-gradient-to-b from-red-600 to-yellow-600 rounded-full mr-4"></div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">9. Copyright & Intellectual Property Protection</h2>
                  </div>

                  {/* Strict Copyright Notice */}
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 border-2 border-red-500 rounded-3xl p-8 mb-8">
                    <div className="text-center mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-3xl font-extrabold text-red-800 dark:text-red-200 mb-3">
                        © {new Date().getFullYear()} Omegoo - All Rights Reserved
                      </h3>
                      <p className="text-lg font-bold text-red-700 dark:text-red-300 mb-2">
                        Protected Under International Copyright Laws
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400 max-w-3xl mx-auto">
                        Omegoo.com and all associated intellectual property, including but not limited to source code, design, 
                        branding, logo, features, and functionality are exclusively owned and copyrighted by Omegoo.
                      </p>
                    </div>

                    {/* Critical Warning Box */}
                    <div className="bg-red-600 text-white rounded-2xl p-6 shadow-xl">
                      <div className="flex items-start mb-4">
                        <svg className="w-8 h-8 mr-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold mb-2">⚠️ STRICT COPYRIGHT ENFORCEMENT</h4>
                          <p className="text-sm leading-relaxed">
                            <strong>WARNING:</strong> Unauthorized copying, cloning, reverse engineering, redistribution, or any form of 
                            intellectual property theft of Omegoo's platform, code, design, or features is <strong className="underline">STRICTLY PROHIBITED</strong> 
                            and will result in immediate legal action without prior warning or negotiation.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* What is Protected */}
                  <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center mr-4">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-orange-800 dark:text-orange-200">Protected Intellectual Property</h3>
                      </div>
                      <ul className="text-orange-700 dark:text-orange-300 text-sm space-y-2">
                        <li className="flex items-start">
                          <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span><strong>Source Code:</strong> All backend and frontend code architecture</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span><strong>Visual Design:</strong> UI/UX design, layout, color schemes, animations</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span><strong>Brand Identity:</strong> Omegoo name, logo, trademarks, branding</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span><strong>Unique Features:</strong> Matching algorithm, chat system, WebRTC implementation</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span><strong>Technical Innovation:</strong> Privacy-first architecture, session management</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span><strong>Content:</strong> All website text, documentation, and marketing materials</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-red-800 dark:text-red-200">Prohibited Actions</h3>
                      </div>
                      <ul className="text-red-700 dark:text-red-300 text-sm space-y-2">
                        <li className="flex items-start">
                          <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          <span><strong>Cloning/Copying:</strong> Creating similar platforms or derivative works</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          <span><strong>Reverse Engineering:</strong> Decompiling, disassembling, or analyzing code</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          <span><strong>Redistribution:</strong> Sharing, selling, or licensing our code/design</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          <span><strong>Trademark Misuse:</strong> Using "Omegoo" name or logo without permission</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          <span><strong>Commercial Exploitation:</strong> Monetizing any Omegoo assets</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          <span><strong>Unauthorized Attribution:</strong> Removing credits or claiming ownership</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* DMCA Protection */}
                  <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 border-2 border-red-500 rounded-3xl p-8 mb-8">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl animate-pulse">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-3xl font-extrabold text-white mb-4">
                        ⚖️ DMCA TAKEDOWN ENFORCEMENT
                      </h3>
                      <p className="text-lg font-bold text-red-200 mb-4">
                        Zero Tolerance Policy for Copyright Infringement
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
                        <h4 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">🛑 Immediate Legal Action</h4>
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">
                          Omegoo actively monitors for copyright violations. Any unauthorized use of our intellectual property will result in:
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl">
                            <h5 className="font-bold text-red-800 dark:text-red-200 mb-2">📧 DMCA Takedown Notices</h5>
                            <p className="text-red-700 dark:text-red-300 text-xs">
                              Immediate filing of Digital Millennium Copyright Act (DMCA) takedown requests to hosting providers, 
                              domain registrars, and search engines. Your website/service will be taken offline within 24-48 hours.
                            </p>
                          </div>
                          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl">
                            <h5 className="font-bold text-red-800 dark:text-red-200 mb-2">⚖️ Civil Litigation</h5>
                            <p className="text-red-700 dark:text-red-300 text-xs">
                              Legal action seeking injunctive relief, statutory damages ($750-$150,000 per work infringed), 
                              actual damages, attorney fees, and court costs under applicable copyright laws.
                            </p>
                          </div>
                          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl">
                            <h5 className="font-bold text-red-800 dark:text-red-200 mb-2">🌐 Domain Seizure</h5>
                            <p className="text-red-700 dark:text-red-300 text-xs">
                              Pursuit of domain name suspension or transfer through ICANN procedures and legal channels. 
                              Infringing domains will be permanently blacklisted.
                            </p>
                          </div>
                          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl">
                            <h5 className="font-bold text-red-800 dark:text-red-200 mb-2">🔒 No Settlement Option</h5>
                            <p className="text-red-700 dark:text-red-300 text-xs">
                              <strong>CRITICAL:</strong> Once DMCA is filed, we will <strong className="underline">NOT</strong> withdraw 
                              the complaint or accept settlements. Legal proceedings will continue to maximum penalties.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-900/40 border-2 border-yellow-500 rounded-2xl p-6">
                        <div className="flex items-start">
                          <svg className="w-8 h-8 text-yellow-400 mr-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-yellow-300 mb-2">⚠️ FINAL WARNING</h4>
                            <p className="text-yellow-200 text-sm leading-relaxed mb-3">
                              <strong>READ THIS CAREFULLY:</strong> By accessing Omegoo, you acknowledge and agree that:
                            </p>
                            <ul className="text-yellow-200 text-xs space-y-2">
                              <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>You will <strong>NOT</strong> copy, clone, or recreate any aspect of Omegoo</span>
                              </li>
                              <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>You understand that copyright infringement carries <strong>severe financial and legal consequences</strong></span>
                              </li>
                              <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>DMCA takedown notices filed by Omegoo are <strong>IRREVERSIBLE and NON-NEGOTIABLE</strong></span>
                              </li>
                              <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>We will pursue <strong>maximum legal penalties</strong> without mercy or compromise</span>
                              </li>
                              <li className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>Your actions are monitored and <strong>violations will be prosecuted internationally</strong></span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legal Contact */}
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xl font-bold text-white mb-4">📧 Copyright Infringement Reports</h4>
                        <p className="text-gray-300 text-sm mb-3">
                          If you believe someone is infringing on Omegoo's copyright:
                        </p>
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4">
                          <p className="text-blue-800 dark:text-blue-200 text-sm">
                            <strong>Email:</strong> omegoochat@gmail.com<br />
                            <strong>Subject:</strong> "Copyright Infringement Report"<br />
                            <strong>Include:</strong> URL of infringing site, description of violation
                          </p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white mb-4">🤝 Licensing Inquiries</h4>
                        <p className="text-gray-300 text-sm mb-3">
                          For authorized licensing or partnership opportunities only:
                        </p>
                        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4">
                          <p className="text-green-800 dark:text-green-200 text-sm">
                            <strong>Email:</strong> omegoochat@gmail.com<br />
                            <strong>Subject:</strong> "Licensing Inquiry"<br />
                            <strong>Note:</strong> We rarely grant licenses. Expect thorough vetting.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Final Warning Badge */}
                  <div className="mt-8 text-center bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center justify-center mb-3">
                      <svg className="w-10 h-10 text-white mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-2xl font-extrabold text-white">Protected by International Copyright Law</h3>
                    </div>
                    <p className="text-white text-sm max-w-3xl mx-auto leading-relaxed">
                      <strong>© {new Date().getFullYear()} Omegoo.</strong> All intellectual property rights reserved worldwide. 
                      Unauthorized use will be prosecuted to the fullest extent of the law under the Berne Convention, 
                      WIPO Copyright Treaty, DMCA, and applicable international copyright statutes.
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

export default PrivacyPolicy;
