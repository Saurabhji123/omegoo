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

      <div className="text-white min-h-screen" style={{ backgroundColor: 'var(--bg-body)' }}>
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-8 pb-16 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-gradient">
            Anonymous Video Chat
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Experience 100% anonymous video chat with strangers worldwide. No registration, no personal data, no tracking—just pure, private connections with complete stranger anonymity.
          </p>
          <Link
            to="/"
            className="inline-block btn-primary px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Start Anonymous Chat Now
          </Link>
        </section>

        {/* Why Choose Anonymous Video Chat */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
            Why Choose Anonymous Video Chat?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-red-400/50 transition-all duration-300">
              <div className="flex-shrink-0 w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-red-300">Complete Anonymity</h3>
              <p className="text-gray-200 leading-relaxed">
                Zero personal data required. No email, no phone number, no social media connection. Your identity remains completely private and secure. True anonymous video chat experience.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-red-400/50 transition-all duration-300">
              <div className="flex-shrink-0 w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-red-300">No Tracking</h3>
              <p className="text-gray-200 leading-relaxed">
                We don't track your activity, store your conversations, or sell your data. Enjoy private video chat with strangers without leaving any digital footprint.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-red-400/50 transition-all duration-300">
              <div className="flex-shrink-0 w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-red-300">100% Free Forever</h3>
              <p className="text-gray-200 leading-relaxed">
                Anonymous video chat should be accessible to everyone. No hidden fees, no premium tiers—completely free random video chat for life.
              </p>
            </div>
          </div>
        </section>

        {/* How Anonymous Chat Works */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
            How Anonymous Video Chat Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 border-2 border-red-500/50" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <span className="text-4xl font-bold text-red-400">1</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Open Omegoo</h3>
              <p className="text-gray-300">Visit our site—no app download, no registration required. Instant anonymous access.</p>
            </div>
            <div className="text-center">
              <div className="rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 border-2 border-red-500/50" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <span className="text-4xl font-bold text-red-400">2</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Click Start</h3>
              <p className="text-gray-300">Choose Video Chat mode and get matched instantly with an anonymous stranger worldwide.</p>
            </div>
            <div className="text-center">
              <div className="rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 border-2 border-red-500/50" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <span className="text-4xl font-bold text-red-400">3</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Chat Anonymously</h3>
              <p className="text-gray-300">Enjoy private video chat. Skip anytime. Your identity stays completely hidden.</p>
            </div>
          </div>
        </section>

        {/* Privacy Features */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
            Advanced Privacy Protection
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex-shrink-0 w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-red-300">Incognito Mode</h3>
              <p className="text-gray-200 text-sm">
                Built-in incognito video chat ensures no browsing history, cookies, or cached data. True secret video chat experience.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex-shrink-0 w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-red-300">End-to-End Security</h3>
              <p className="text-gray-200 text-sm">
                WebRTC encryption protects your anonymous video chat from eavesdropping. Your private conversations remain private.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex-shrink-0 w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-red-300">No Profile Required</h3>
              <p className="text-gray-200 text-sm">
                Skip profile creation entirely. No username, no avatar, no bio—pure anonymous chat with strangers from the first second.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex-shrink-0 w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-red-300">Global Anonymous Network</h3>
              <p className="text-gray-200 text-sm">
                Connect with anonymous strangers from 150+ countries. Worldwide private video chat network available 24/7.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
            Anonymous Video Chat FAQ
          </h2>
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-bold mb-3 text-red-400">Is Omegoo really 100% anonymous?</h3>
              <p className="text-gray-300">
                Yes! We don't collect personal data, store chat logs, or require any registration. Your anonymous video chat sessions are completely private with no tracking or data collection.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-bold mb-3 text-red-400">Do you log IP addresses?</h3>
              <p className="text-gray-300">
                We use minimal technical data for matchmaking and security (preventing bots/abuse), but we don't store identifiable information or link it to your chats. Your anonymous video chat remains private.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-bold mb-3 text-red-400">Can others find out who I am?</h3>
              <p className="text-gray-300">
                No. Unless you choose to share personal information during your chat, your identity remains hidden. Practice safe anonymous video chat by never revealing personal details.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-bold mb-3 text-red-400">Is anonymous video chat safe?</h3>
              <p className="text-gray-300">
                Yes! We use AI moderation, instant reporting tools, and WebRTC encryption. However, always practice caution: don't share personal info, report inappropriate behavior, and skip suspicious users immediately.
              </p>
            </div>
          </div>
        </section>

        {/* Related Pages */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
            Explore More
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link
              to="/no-login-video-chat"
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-red-500/50 transition-all duration-300 text-center group"
            >
              <h3 className="text-xl font-bold mb-2 text-red-400 group-hover:text-red-300">No Login Video Chat</h3>
              <p className="text-gray-400 text-sm">Skip registration entirely</p>
            </Link>
            <Link
              to="/stranger-cam-chat"
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-red-500/50 transition-all duration-300 text-center group"
            >
              <h3 className="text-xl font-bold mb-2 text-red-400 group-hover:text-red-300">Stranger Cam Chat</h3>
              <p className="text-gray-400 text-sm">Webcam chat with strangers</p>
            </Link>
            <Link
              to="/country/india"
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-red-500/50 transition-all duration-300 text-center group"
            >
              <h3 className="text-xl font-bold mb-2 text-red-400 group-hover:text-red-300">Chat with India</h3>
              <p className="text-gray-400 text-sm">Connect with Indian users</p>
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="rounded-3xl p-12 max-w-4xl mx-auto border border-gray-700/50" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <h2 className="text-4xl font-bold mb-6">Start Anonymous Video Chat Now</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join millions enjoying private, secure, and completely anonymous video chat with strangers worldwide. Zero registration. 100% free forever.
            </p>
            <Link
              to="/"
              className="inline-block btn-primary text-white px-10 py-5 rounded-full text-xl font-semibold transition-all duration-300 shadow-2xl transform hover:scale-105"
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
