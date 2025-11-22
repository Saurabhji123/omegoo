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

      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-24 pb-16 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-400 to-purple-400">
            Stranger Cam Chat
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Experience the thrill of stranger cam chat with random people worldwide. Free webcam chat with strangers—no registration, no downloads, just instant cam-to-cam connections.
          </p>
          <Link
            to="/"
            className="inline-block bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Start Cam Chat Now
          </Link>
        </section>

        {/* Why Choose Stranger Cam Chat */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400">
            Why Choose Stranger Cam Chat?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-green-500/50 transition-all duration-300">
              <div className="text-5xl mb-4">📹</div>
              <h3 className="text-2xl font-bold mb-4 text-green-400">HD Webcam Quality</h3>
              <p className="text-gray-300 leading-relaxed">
                Crystal-clear cam chat with strangers in HD quality. Our advanced WebRTC technology ensures smooth, lag-free webcam stranger chat experience.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold mb-4 text-blue-400">Instant Matching</h3>
              <p className="text-gray-300 leading-relaxed">
                Get connected to random cam chat partners in under 2 seconds. Thousands of strangers online 24/7 for instant webcam chat connections.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
              <div className="text-5xl mb-4">🌍</div>
              <h3 className="text-2xl font-bold mb-4 text-purple-400">Global Community</h3>
              <p className="text-gray-300 leading-relaxed">
                Connect with strangers from 150+ countries. Experience diverse cultures through cam to cam chat with people worldwide.
              </p>
            </div>
          </div>
        </section>

        {/* How Stranger Cam Chat Works */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400">
            How Stranger Cam Chat Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 border-2 border-green-500/50">
                <span className="text-4xl font-bold text-green-400">1</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Enable Your Webcam</h3>
              <p className="text-gray-300">Click "Allow" when your browser asks for camera access. No account or app download needed.</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 border-2 border-blue-500/50">
                <span className="text-4xl font-bold text-blue-400">2</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Start Cam Chat</h3>
              <p className="text-gray-300">Hit the "Start" button and get instantly matched with a random stranger for webcam chat.</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500/20 to-green-500/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 border-2 border-purple-500/50">
                <span className="text-4xl font-bold text-purple-400">3</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Chat & Skip</h3>
              <p className="text-gray-300">Enjoy cam to cam chat. Not interested? Hit "Next" for a new random stranger instantly.</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400">
            Advanced Cam Chat Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="text-4xl mb-4">🎭</div>
              <h3 className="text-xl font-bold mb-3 text-green-400">Gender Filter</h3>
              <p className="text-gray-300 text-sm">
                Choose who to cam chat with. Filter strangers by gender preference for more relevant webcam chat matches.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-bold mb-3 text-blue-400">Mobile Cam Chat</h3>
              <p className="text-gray-300 text-sm">
                Works perfectly on phones and tablets. Enjoy stranger cam chat anywhere with mobile-optimized webcam support.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold mb-3 text-purple-400">AI Safety Moderation</h3>
              <p className="text-gray-300 text-sm">
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
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400">
            Safe Stranger Cam Chat Tips
          </h2>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
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
                  <h3 className="text-lg font-bold mb-2 text-blue-400">Skip Freely</h3>
                  <p className="text-gray-300 text-sm">Uncomfortable? Hit "Next" instantly. No explanations needed in random cam chat—your safety comes first.</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">✅</div>
                <div>
                  <h3 className="text-lg font-bold mb-2 text-blue-400">Trust Your Instincts</h3>
                  <p className="text-gray-300 text-sm">If something feels wrong in stranger cam chat, leave immediately. Plenty of genuine people online.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400">
            Stranger Cam Chat FAQ
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-bold mb-3 text-green-400">Is stranger cam chat free?</h3>
              <p className="text-gray-300">
                Yes! 100% free webcam chat with strangers forever. No hidden fees, no premium tiers. Unlimited cam to cam chat included.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-bold mb-3 text-blue-400">Do I need to register for cam chat?</h3>
              <p className="text-gray-300">
                No registration required! Just visit Omegoo, enable your webcam, and start stranger cam chat instantly. Zero signup, zero hassle.
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-bold mb-3 text-purple-400">Can I use stranger cam chat on mobile?</h3>
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
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400">
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
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 text-center group"
            >
              <h3 className="text-xl font-bold mb-2 text-blue-400 group-hover:text-blue-300">Anonymous Video Chat</h3>
              <p className="text-gray-400 text-sm">100% private connections</p>
            </Link>
            <Link
              to="/country/usa"
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 text-center group"
            >
              <h3 className="text-xl font-bold mb-2 text-purple-400 group-hover:text-purple-300">Chat with USA</h3>
              <p className="text-gray-400 text-sm">Connect with Americans</p>
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="bg-gradient-to-r from-green-600/20 via-blue-600/20 to-purple-600/20 rounded-3xl p-12 max-w-4xl mx-auto border border-gray-700/50">
            <h2 className="text-4xl font-bold mb-6">Start Stranger Cam Chat Now</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands enjoying free webcam chat with strangers worldwide. HD quality, instant matching, 100% free. No registration required.
            </p>
            <Link
              to="/"
              className="inline-block bg-gradient-to-r from-green-500 to-blue-600 text-white px-10 py-5 rounded-full text-xl font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-300 shadow-2xl hover:shadow-green-500/50 transform hover:scale-105"
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
