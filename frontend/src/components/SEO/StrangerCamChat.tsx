import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const StrangerCamChat: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Stranger Cam Chat | Free Webcam Chat with Strangers Online</title>
        <meta name="description" content="Free stranger cam chat with random people worldwide. Instant webcam chat with strangers, no registration required. Safe, fast, and fun random cam chat." />
        <meta name="keywords" content="stranger cam chat, cam chat with strangers, webcam stranger chat, random cam chat, stranger webcam, cam to cam chat, free webcam chat strangers" />
        <link rel="canonical" href="https://www.omegoo.chat/stranger-cam-chat" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Stranger Cam Chat | Free Webcam Chat with Strangers Online" />
        <meta property="og:description" content="Free stranger cam chat with random people worldwide. Instant webcam chat with strangers, no registration required. Safe, fast, and fun random cam chat." />
        <meta property="og:url" content="https://www.omegoo.chat/stranger-cam-chat" />
        <meta property="og:site_name" content="Omegoo" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@omegoo_chat" />
        <meta name="twitter:title" content="Stranger Cam Chat | Free Webcam Chat with Strangers Online" />
        <meta name="twitter:description" content="Free stranger cam chat with random people worldwide. Instant webcam chat with strangers, no registration required. Safe, fast, and fun random cam chat." />
      </Helmet>

      <div className="text-white min-h-screen" style={{ backgroundColor: 'var(--bg-body)' }}>
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-8 pb-16 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-gradient">
            Stranger Cam Chat
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Experience the thrill of stranger cam chat with random people worldwide. Free webcam chat with strangers—no registration, no downloads, just instant cam-to-cam connections.
          </p>
          <Link
            to="/"
            className="inline-block btn-primary text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Start Cam Chat Now
          </Link>
        </section>

        {/* Why Choose Stranger Cam Chat */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
            Why Choose Stranger Cam Chat?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-green-400/50 transition-all duration-300">
              <div className="flex-shrink-0 w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-green-300">HD Webcam Quality</h3>
              <p className="text-gray-200 leading-relaxed">
                Crystal-clear cam chat with strangers in HD quality. Our advanced WebRTC technology ensures smooth, lag-free webcam stranger chat experience.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-red-400/50 transition-all duration-300">
              <div className="flex-shrink-0 w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-red-300">Instant Matching</h3>
              <p className="text-gray-200 leading-relaxed">
                Get connected to random cam chat partners in under 2 seconds. Thousands of strangers online 24/7 for instant webcam chat connections.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-red-400/50 transition-all duration-300">
              <div className="flex-shrink-0 w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-red-300">Global Community</h3>
              <p className="text-gray-200 leading-relaxed">
                Connect with strangers from 150+ countries. Experience diverse cultures through cam to cam chat with people worldwide.
              </p>
            </div>
          </div>
        </section>

        {/* How Stranger Cam Chat Works */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
            How Stranger Cam Chat Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 border-2 border-green-500/50" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <span className="text-4xl font-bold text-green-400">1</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Enable Your Webcam</h3>
              <p className="text-gray-300">Click "Allow" when your browser asks for camera access. No account or app download needed.</p>
            </div>
            <div className="text-center">
              <div className="rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 border-2 border-red-500/50" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <span className="text-4xl font-bold text-red-400">2</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Start Cam Chat</h3>
              <p className="text-gray-300">Hit the "Start" button and get instantly matched with a random stranger for webcam chat.</p>
            </div>
            <div className="text-center">
              <div className="rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 border-2 border-red-500/50" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <span className="text-4xl font-bold text-red-400">3</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Chat & Skip</h3>
              <p className="text-gray-300">Enjoy cam to cam chat. Not interested? Hit "Next" for a new random stranger instantly.</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
            Advanced Cam Chat Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-green-300">Gender Filter</h3>
              <p className="text-gray-200 text-sm">
                Choose who to cam chat with. Filter strangers by gender preference for more relevant webcam chat matches.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex-shrink-0 w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-red-300">Mobile Cam Chat</h3>
              <p className="text-gray-200 text-sm">
                Works perfectly on phones and tablets. Enjoy stranger cam chat anywhere with mobile-optimized webcam support.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex-shrink-0 w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-red-300">AI Safety Moderation</h3>
              <p className="text-gray-200 text-sm">
                Advanced AI monitors all cam chat sessions. Report button blocks inappropriate users instantly for safer webcam stranger chat.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-bold mb-3 text-green-400">Text + Cam Chat</h3>
              <p className="text-gray-300 text-sm">
                Combine webcam chat with text messaging. Send messages while cam chatting with strangers for better communication.
              </p>
            </div>
          </div>
        </section>

        {/* Safety Tips */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
            Safe Stranger Cam Chat Tips
          </h2>
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">✅</div>
                <div>
                  <h3 className="text-lg font-bold mb-2 text-green-400">Keep Personal Info Private</h3>
                  <p className="text-gray-300 text-sm">Never share your real name, address, phone number, or social media during webcam stranger chat.</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">✅</div>
                <div>
                  <h3 className="text-lg font-bold mb-2 text-green-400">Use the Report Button</h3>
                  <p className="text-gray-300 text-sm">See inappropriate behavior? Report immediately. We ban violators from cam chat with strangers permanently.</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">✅</div>
                <div>
                  <h3 className="text-lg font-bold mb-2 text-red-400">Skip Freely</h3>
                  <p className="text-gray-300 text-sm">Uncomfortable? Hit "Next" instantly. No explanations needed in random cam chat—your safety comes first.</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">✅</div>
                <div>
                  <h3 className="text-lg font-bold mb-2 text-red-400">Trust Your Instincts</h3>
                  <p className="text-gray-300 text-sm">If something feels wrong in stranger cam chat, leave immediately. Plenty of genuine people online.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
            Stranger Cam Chat FAQ
          </h2>
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-bold mb-3 text-green-400">Is stranger cam chat free?</h3>
              <p className="text-gray-300">
                Yes! 100% free webcam chat with strangers forever. No hidden fees, no premium tiers. Unlimited cam to cam chat included.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-bold mb-3 text-red-400">Do I need to register for cam chat?</h3>
              <p className="text-gray-300">
                No registration required! Just visit Omegoo, enable your webcam, and start stranger cam chat instantly. Zero signup, zero hassle.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-bold mb-3 text-red-400">Can I use stranger cam chat on mobile?</h3>
              <p className="text-gray-300">
                Absolutely! Works on iPhone, Android, tablets. Enjoy webcam stranger chat anywhere with mobile-optimized cam to cam technology.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-bold mb-3 text-green-400">Is stranger webcam chat safe?</h3>
              <p className="text-gray-300">
                We use AI moderation, instant reporting, and encryption for safer cam chat with strangers. Always follow safety guidelines and report inappropriate users.
              </p>
            </div>
          </div>
        </section>

        {/* Related Pages */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
            More Chat Options
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link
              to="/no-login-video-chat"
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-green-500/50 transition-all duration-300 text-center group"
            >
              <h3 className="text-xl font-bold mb-2 text-green-400 group-hover:text-green-300">No Login Video Chat</h3>
              <p className="text-gray-400 text-sm">Chat without registration</p>
            </Link>
            <Link
              to="/anonymous-video-chat"
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-red-500/50 transition-all duration-300 text-center group"
            >
              <h3 className="text-xl font-bold mb-2 text-red-400 group-hover:text-red-300">Anonymous Video Chat</h3>
              <p className="text-gray-400 text-sm">100% private connections</p>
            </Link>
            <Link
              to="/country/usa"
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-red-500/50 transition-all duration-300 text-center group"
            >
              <h3 className="text-xl font-bold mb-2 text-red-400 group-hover:text-red-300">Chat with USA</h3>
              <p className="text-gray-400 text-sm">Connect with Americans</p>
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="rounded-3xl p-12 max-w-4xl mx-auto border border-gray-700/50" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <h2 className="text-4xl font-bold mb-6">Start Stranger Cam Chat Now</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands enjoying free webcam chat with strangers worldwide. HD quality, instant matching, 100% free. No registration required.
            </p>
            <Link
              to="/"
              className="inline-block btn-primary text-white px-10 py-5 rounded-full text-xl font-semibold transition-all duration-300 shadow-2xl transform hover:scale-105"
            >
              Launch Cam Chat
            </Link>
          </div>
        </section>

        {/* Schema.org Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Stranger Cam Chat | Free Webcam Chat with Strangers Online",
            "description": "Free stranger cam chat with random people worldwide. Instant webcam chat with strangers, no registration required. Safe, fast, and fun random cam chat.",
            "url": "https://www.omegoo.chat/stranger-cam-chat",
            "publisher": {
              "@type": "Organization",
              "name": "Omegoo",
              "url": "https://www.omegoo.chat"
            },
            "mainEntity": {
              "@type": "SoftwareApplication",
              "name": "Omegoo Stranger Cam Chat",
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

export default StrangerCamChat;
