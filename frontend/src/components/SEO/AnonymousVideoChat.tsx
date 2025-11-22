import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const AnonymousVideoChat: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Anonymous Video Chat | Free Private Video Chat with Strangers</title>
        <meta name="description" content="100% anonymous video chat with strangers. No registration, no personal data required. Private, secure, and completely free random video chat." />
        <meta name="keywords" content="anonymous video chat, private video chat, secret video chat, incognito video chat, anonymous chat with strangers, private random chat, no personal data video chat" />
        <link rel="canonical" href="https://www.omegoo.chat/anonymous-video-chat" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Anonymous Video Chat | Free Private Video Chat with Strangers" />
        <meta property="og:description" content="100% anonymous video chat with strangers. No registration, no personal data required. Private, secure, and completely free random video chat." />
        <meta property="og:url" content="https://www.omegoo.chat/anonymous-video-chat" />
        <meta property="og:site_name" content="Omegoo" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@omegoo_chat" />
        <meta name="twitter:title" content="Anonymous Video Chat | Free Private Video Chat with Strangers" />
        <meta name="twitter:description" content="100% anonymous video chat with strangers. No registration, no personal data required. Private, secure, and completely free random video chat." />
      </Helmet>

      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-8 pb-16 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            Anonymous Video Chat
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Experience 100% anonymous video chat with strangers worldwide. No registration, no personal data, no tracking—just pure, private connections with complete stranger anonymity.
          </p>
          <Link
            to="/"
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Start Anonymous Chat Now
          </Link>
        </section>

        {/* Why Choose Anonymous Video Chat */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Why Choose Anonymous Video Chat?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold mb-4 text-blue-400">Complete Anonymity</h3>
              <p className="text-gray-300 leading-relaxed">
                Zero personal data required. No email, no phone number, no social media connection. Your identity remains completely private and secure. True anonymous video chat experience.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
              <div className="text-5xl mb-4">🚫</div>
              <h3 className="text-2xl font-bold mb-4 text-purple-400">No Tracking</h3>
              <p className="text-gray-300 leading-relaxed">
                We don't track your activity, store your conversations, or sell your data. Enjoy private video chat with strangers without leaving any digital footprint.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-pink-500/50 transition-all duration-300">
              <div className="text-5xl mb-4">💯</div>
              <h3 className="text-2xl font-bold mb-4 text-pink-400">100% Free Forever</h3>
              <p className="text-gray-300 leading-relaxed">
                Anonymous video chat should be accessible to everyone. No hidden fees, no premium tiers—completely free random video chat for life.
              </p>
            </div>
          </div>
        </section>

        {/* How Anonymous Chat Works */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            How Anonymous Video Chat Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 border-2 border-blue-500/50">
                <span className="text-4xl font-bold text-blue-400">1</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Open Omegoo</h3>
              <p className="text-gray-300">Visit our site—no app download, no registration required. Instant anonymous access.</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 border-2 border-purple-500/50">
                <span className="text-4xl font-bold text-purple-400">2</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Click Start</h3>
              <p className="text-gray-300">Choose Video Chat mode and get matched instantly with an anonymous stranger worldwide.</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-pink-500/20 to-blue-500/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 border-2 border-pink-500/50">
                <span className="text-4xl font-bold text-pink-400">3</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Chat Anonymously</h3>
              <p className="text-gray-300">Enjoy private video chat. Skip anytime. Your identity stays completely hidden.</p>
            </div>
          </div>
        </section>

        {/* Privacy Features */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Advanced Privacy Protection
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="text-4xl mb-4">🕶️</div>
              <h3 className="text-xl font-bold mb-3 text-blue-400">Incognito Mode</h3>
              <p className="text-gray-300 text-sm">
                Built-in incognito video chat ensures no browsing history, cookies, or cached data. True secret video chat experience.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-xl font-bold mb-3 text-purple-400">End-to-End Security</h3>
              <p className="text-gray-300 text-sm">
                WebRTC encryption protects your anonymous video chat from eavesdropping. Your private conversations remain private.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="text-4xl mb-4">👤</div>
              <h3 className="text-xl font-bold mb-3 text-pink-400">No Profile Required</h3>
              <p className="text-gray-300 text-sm">
                Skip profile creation entirely. No username, no avatar, no bio—pure anonymous chat with strangers from the first second.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-bold mb-3 text-blue-400">Global Anonymous Network</h3>
              <p className="text-gray-300 text-sm">
                Connect with anonymous strangers from 150+ countries. Worldwide private video chat network available 24/7.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Anonymous Video Chat FAQ
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-bold mb-3 text-blue-400">Is Omegoo really 100% anonymous?</h3>
              <p className="text-gray-300">
                Yes! We don't collect personal data, store chat logs, or require any registration. Your anonymous video chat sessions are completely private with no tracking or data collection.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-bold mb-3 text-purple-400">Do you log IP addresses?</h3>
              <p className="text-gray-300">
                We use minimal technical data for matchmaking and security (preventing bots/abuse), but we don't store identifiable information or link it to your chats. Your anonymous video chat remains private.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-bold mb-3 text-pink-400">Can others find out who I am?</h3>
              <p className="text-gray-300">
                No. Unless you choose to share personal information during your chat, your identity remains hidden. Practice safe anonymous video chat by never revealing personal details.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-bold mb-3 text-blue-400">Is anonymous video chat safe?</h3>
              <p className="text-gray-300">
                Yes! We use AI moderation, instant reporting tools, and WebRTC encryption. However, always practice caution: don't share personal info, report inappropriate behavior, and skip suspicious users immediately.
              </p>
            </div>
          </div>
        </section>

        {/* Related Pages */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Explore More
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link
              to="/no-login-video-chat"
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 text-center group"
            >
              <h3 className="text-xl font-bold mb-2 text-blue-400 group-hover:text-blue-300">No Login Video Chat</h3>
              <p className="text-gray-400 text-sm">Skip registration entirely</p>
            </Link>
            <Link
              to="/stranger-cam-chat"
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 text-center group"
            >
              <h3 className="text-xl font-bold mb-2 text-purple-400 group-hover:text-purple-300">Stranger Cam Chat</h3>
              <p className="text-gray-400 text-sm">Webcam chat with strangers</p>
            </Link>
            <Link
              to="/country/india"
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-pink-500/50 transition-all duration-300 text-center group"
            >
              <h3 className="text-xl font-bold mb-2 text-pink-400 group-hover:text-pink-300">Chat with India</h3>
              <p className="text-gray-400 text-sm">Connect with Indian users</p>
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl p-12 max-w-4xl mx-auto border border-gray-700/50">
            <h2 className="text-4xl font-bold mb-6">Start Anonymous Video Chat Now</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join millions enjoying private, secure, and completely anonymous video chat with strangers worldwide. Zero registration. 100% free forever.
            </p>
            <Link
              to="/"
              className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-10 py-5 rounded-full text-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105"
            >
              Launch Anonymous Chat
            </Link>
          </div>
        </section>

        {/* Schema.org Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Anonymous Video Chat | Free Private Video Chat with Strangers",
            "description": "100% anonymous video chat with strangers. No registration, no personal data required. Private, secure, and completely free random video chat.",
            "url": "https://www.omegoo.chat/anonymous-video-chat",
            "publisher": {
              "@type": "Organization",
              "name": "Omegoo",
              "url": "https://www.omegoo.chat"
            },
            "mainEntity": {
              "@type": "SoftwareApplication",
              "name": "Omegoo Anonymous Video Chat",
              "applicationCategory": "Communication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            }
          })}
        </script>
      </div>
    </>
  );
};

export default AnonymousVideoChat;
