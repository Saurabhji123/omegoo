import React from 'react';
import { ShieldCheckIcon, ExclamationTriangleIcon, UserGroupIcon, HeartIcon } from '@heroicons/react/24/outline';

const SafetyGuidelines: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-2xl mx-4 mt-8 text-white py-12 sm:py-16 lg:py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-green-400/30 to-emerald-400/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-8 -left-8 w-96 h-96 bg-gradient-to-tr from-teal-400/20 to-green-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative container mx-auto px-4 text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
            <ShieldCheckIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>
          
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-white via-green-100 to-emerald-100 bg-clip-text text-transparent leading-tight">
            Safety Guidelines
          </h1>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-white/90 max-w-4xl mx-auto font-medium leading-relaxed mb-6">
            Creating a safe, respectful, and welcoming environment for meaningful connections
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-white/80">
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Community-driven safety
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              24/7 protection
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Core Safety Principles */}
          <div className="mb-12 lg:mb-16 -mt-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-800 dark:to-emerald-800 p-6 sm:p-8 border-b border-green-200 dark:border-green-700">
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Core Safety Principles</h2>
                  <p className="text-gray-300 max-w-2xl mx-auto">
                    Four pillars that ensure everyone can connect safely and respectfully on Omegoo
                  </p>
                </div>
              </div>
              
              <div className="p-6 sm:p-8">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="group text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <HeartIcon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-green-800 dark:text-green-200 mb-2">Respect First</h3>
                    <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
                      Every interaction should be based on mutual respect and human dignity
                    </p>
                  </div>
                  
                  <div className="group text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <ShieldCheckIcon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200 mb-2">Privacy Protected</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                      Your anonymity and personal information are completely safeguarded
                    </p>
                  </div>
                  
                  <div className="group text-center p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <UserGroupIcon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-purple-800 dark:text-purple-200 mb-2">Community Care</h3>
                    <p className="text-sm text-purple-700 dark:text-purple-300 leading-relaxed">
                      We all share responsibility for maintaining a welcoming environment
                    </p>
                  </div>
                  
                  <div className="group text-center p-6 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl border border-red-200 dark:border-red-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <ExclamationTriangleIcon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-red-800 dark:text-red-200 mb-2">Swift Action</h3>
                    <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                      Quick reporting and immediate response to any safety concerns
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Safety Content */}
          <div className="space-y-8 lg:space-y-12">
            {/* Personal Safety */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-1">
                <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl p-6 sm:p-8">
                  <div className="flex items-center mb-8">
                    <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full mr-4"></div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">1. Personal Safety First</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-l-4 border-blue-500 p-6 rounded-r-2xl">
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-2">Protect Your Privacy</h3>
                          <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed mb-4">
                            Your personal information is your most valuable asset. Here's how to keep it safe:
                          </p>
                          <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-2">
                            <li className="flex items-start">
                              <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              <strong>Never share</strong> your real name, address, phone number, or email
                            </li>
                            <li className="flex items-start">
                              <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              <strong>Avoid revealing</strong> social media profiles, workplace, or school information
                            </li>
                            <li className="flex items-start">
                              <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              <strong>Keep locations private</strong> - don't mention specific places you frequent
                            </li>
                            <li className="flex items-start">
                              <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              <strong>Trust your instincts</strong> - if something feels wrong, disconnect immediately
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-green-800 dark:text-green-200">Safe Conversations</h3>
                        </div>
                        <ul className="text-green-700 dark:text-green-300 text-sm space-y-2">
                          <li>• Keep conversations general and friendly</li>
                          <li>• Respect boundaries when topics make you uncomfortable</li>
                          <li>• Feel free to change subjects or end conversations</li>
                          <li>• Remember: you control your experience</li>
                        </ul>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-orange-800 dark:text-orange-200">Red Flags</h3>
                        </div>
                        <ul className="text-orange-700 dark:text-orange-300 text-sm space-y-2">
                          <li>• Requests for personal information</li>
                          <li>• Pressure to move to other platforms</li>
                          <li>• Inappropriate sexual content</li>
                          <li>• Aggressive or threatening language</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Community Standards */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-1">
                <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl p-6 sm:p-8">
                  <div className="flex items-center mb-8">
                    <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full mr-4"></div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">2. Community Standards</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-l-4 border-purple-500 p-6 rounded-r-2xl">
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-purple-800 dark:text-purple-200 mb-2">Respectful Communication</h3>
                          <p className="text-purple-700 dark:text-purple-300 text-sm leading-relaxed mb-4">
                            Omegoo thrives when every user feels respected and valued. Here's how to contribute positively:
                          </p>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-purple-800 dark:text-purple-200 text-sm mb-2">✅ Do This</h4>
                              <ul className="text-purple-700 dark:text-purple-300 text-sm space-y-1">
                                <li>• Be kind and considerate</li>
                                <li>• Listen actively and respond thoughtfully</li>
                                <li>• Respect different opinions and backgrounds</li>
                                <li>• Use inclusive language</li>
                                <li>• Give people space to express themselves</li>
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold text-red-800 dark:text-red-200 text-sm mb-2">❌ Avoid This</h4>
                              <ul className="text-red-700 dark:text-red-300 text-sm space-y-1">
                                <li>• Hate speech or discrimination</li>
                                <li>• Bullying or harassment</li>
                                <li>• Inappropriate sexual content</li>
                                <li>• Spam or commercial advertising</li>
                                <li>• Sharing disturbing content</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-green-800 dark:text-green-200 mb-3">Positive Interactions</h3>
                        <p className="text-green-700 dark:text-green-300 text-sm leading-relaxed">
                          Focus on meaningful conversations that brighten someone's day. Ask open-ended questions, share interesting thoughts, and be genuinely curious about others.
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-3">Cultural Sensitivity</h3>
                        <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
                          Omegoo connects people from all over the world. Embrace diversity, learn about different cultures, and avoid assumptions based on stereotypes.
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-6">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-4">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-orange-800 dark:text-orange-200 mb-3">Boundary Respect</h3>
                        <p className="text-orange-700 dark:text-orange-300 text-sm leading-relaxed">
                          If someone seems uncomfortable with a topic, respect their boundaries immediately. Everyone has different comfort levels and triggers.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reporting & Response */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 p-1">
                <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl p-6 sm:p-8">
                  <div className="flex items-center mb-8">
                    <div className="w-2 h-8 bg-gradient-to-b from-red-500 to-pink-500 rounded-full mr-4"></div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">3. Reporting & Safety Tools</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-l-4 border-red-500 p-6 rounded-r-2xl">
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">When to Report</h3>
                          <p className="text-red-700 dark:text-red-300 text-sm leading-relaxed mb-4">
                            Don't hesitate to report any behavior that makes you feel unsafe or uncomfortable. You're helping protect the entire community.
                          </p>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-red-800 dark:text-red-200 text-sm mb-2">🚨 Immediate Threats</h4>
                              <ul className="text-red-700 dark:text-red-300 text-sm space-y-1">
                                <li>• Threats of violence or harm</li>
                                <li>• Sexual harassment or explicit content</li>
                                <li>• Requests for personal information</li>
                                <li>• Hate speech or discrimination</li>
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold text-orange-800 dark:text-orange-200 text-sm mb-2">⚠️ Inappropriate Behavior</h4>
                              <ul className="text-orange-700 dark:text-orange-300 text-sm space-y-1">
                                <li>• Persistent unwanted contact</li>
                                <li>• Spam or commercial content</li>
                                <li>• Inappropriate questions about age/location</li>
                                <li>• Attempts to identify or track you</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200">How to Report</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="bg-blue-100 dark:bg-blue-800/30 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200 text-sm mb-2">💬 During Chat</h4>
                            <p className="text-blue-700 dark:text-blue-300 text-sm">
                              Click the report button in the chat interface. This immediately flags the conversation and disconnects you safely.
                            </p>
                          </div>
                          <div className="bg-indigo-100 dark:bg-indigo-800/30 rounded-lg p-4">
                            <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 text-sm mb-2">📧 After Chat</h4>
                            <p className="text-indigo-700 dark:text-indigo-300 text-sm">
                              Email <strong>omegoochat@gmail.com</strong> with details about the incident for follow-up investigation.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-green-800 dark:text-green-200">Our Response</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                              <span className="text-white text-xs font-bold">1</span>
                            </div>
                            <p className="text-green-700 dark:text-green-300 text-sm">
                              <strong>Immediate:</strong> Reported users are instantly disconnected and flagged
                            </p>
                          </div>
                          <div className="flex items-start">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                              <span className="text-white text-xs font-bold">2</span>
                            </div>
                            <p className="text-green-700 dark:text-green-300 text-sm">
                              <strong>Investigation:</strong> Our team reviews all reports within 24 hours
                            </p>
                          </div>
                          <div className="flex items-start">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                              <span className="text-white text-xs font-bold">3</span>
                            </div>
                            <p className="text-green-700 dark:text-green-300 text-sm">
                              <strong>Action:</strong> Violators face warnings, suspensions, or permanent bans
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Support & Resources */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-1">
                <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-3xl p-6 sm:p-8">
                  <div className="flex items-center mb-8">
                    <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full mr-4"></div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">4. Support & Resources</h2>
                  </div>
                  
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200">Get Help</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="bg-emerald-100 dark:bg-emerald-800/30 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 text-emerald-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="font-semibold text-emerald-800 dark:text-emerald-200">Safety Support</span>
                            </div>
                            <p className="text-emerald-700 dark:text-emerald-300 text-sm">
                              <strong>omegoochat@gmail.com</strong><br />
                              24/7 response for urgent safety concerns and incident reports
                            </p>
                          </div>

                          <div className="bg-teal-100 dark:bg-teal-800/30 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 text-teal-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              <span className="font-semibold text-teal-800 dark:text-teal-200">General Support</span>
                            </div>
                            <p className="text-teal-700 dark:text-teal-300 text-sm">
                              <strong>omegoochat@gmail.com</strong><br />
                              Questions, feedback, and general assistance
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200">Response Times</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-blue-700 dark:text-blue-300 text-sm">Safety emergencies</span>
                            <span className="font-bold text-blue-800 dark:text-blue-200 text-sm">Immediate</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-700 dark:text-blue-300 text-sm">Incident reports</span>
                            <span className="font-bold text-blue-800 dark:text-blue-200 text-sm">&lt; 24 hours</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-700 dark:text-blue-300 text-sm">General inquiries</span>
                            <span className="font-bold text-blue-800 dark:text-blue-200 text-sm">&lt; 48 hours</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-purple-800 dark:text-purple-200">External Resources</h3>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-purple-800 dark:text-purple-200 text-sm mb-2">🆘 Crisis Support</h4>
                            <ul className="text-purple-700 dark:text-purple-300 text-sm space-y-1">
                              <li>• National Suicide Prevention Lifeline: 988</li>
                              <li>• Crisis Text Line: Text HOME to 741741</li>
                              <li>• SAMHSA Helpline: 1-800-662-4357</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-purple-800 dark:text-purple-200 text-sm mb-2">👥 Support Organizations</h4>
                            <ul className="text-purple-700 dark:text-purple-300 text-sm space-y-1">
                              <li>• RAINN (Sexual Assault): 1-800-656-4673</li>
                              <li>• National Domestic Violence Hotline: 1-800-799-7233</li>
                              <li>• LGBT National Hotline: 1-888-843-4564</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-green-800 dark:text-green-200">Self-Care Tips</h3>
                        </div>
                        <ul className="text-green-700 dark:text-green-300 text-sm space-y-2">
                          <li className="flex items-start">
                            <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Take breaks if you feel overwhelmed
                          </li>
                          <li className="flex items-start">
                            <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Trust your instincts about uncomfortable situations
                          </li>
                          <li className="flex items-start">
                            <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Remember that you can disconnect at any time
                          </li>
                          <li className="flex items-start">
                            <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Seek support if you experience harassment
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Final Message */}
            <div className="text-center bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-3xl p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Together We Make Omegoo Safe</h3>
              <p className="text-gray-300 text-lg leading-relaxed max-w-3xl mx-auto mb-6">
                Safety is a shared responsibility. Every positive interaction you have and every time you report inappropriate behavior, 
                you're helping create a better experience for everyone in our global community.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex items-center text-green-700 dark:text-green-300">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Stay safe, stay respectful</span>
                </div>
                <div className="flex items-center text-green-700 dark:text-green-300">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Report when needed</span>
                </div>
                <div className="flex items-center text-green-700 dark:text-green-300">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Connect meaningfully</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyGuidelines;
