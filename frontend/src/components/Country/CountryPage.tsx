import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCountryBySlug, getPopularCountries } from '../../data/countries';
import { Helmet } from 'react-helmet-async';
import { generateCountrySEO } from '../../config/seo.config';

const CountryPage: React.FC = () => {
  const { countrySlug } = useParams<{ countrySlug: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(true);
  const country = countrySlug ? getCountryBySlug(countrySlug) : null;

  useEffect(() => {
    setIsLoading(false);
    if (!country) {
      console.error(`Country not found: ${countrySlug}`);
      setTimeout(() => navigate('/'), 3000);
    }
  }, [country, navigate, countrySlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Country not found</h1>
          <p className="text-gray-400 mb-8">Redirecting to homepage...</p>
        </div>
      </div>
    );
  }

  const relatedCountries = getPopularCountries().filter(c => c.slug !== country.slug).slice(0, 5);
  const seoConfig = generateCountrySEO(country);

  return (
    <>
      <Helmet>
        <title>{seoConfig.title}</title>
        <meta name="description" content={seoConfig.description} />
        <link rel="canonical" href={seoConfig.canonical} />
        
        {/* Open Graph */}
        {seoConfig.openGraph && (
          <>
            <meta property="og:title" content={seoConfig.openGraph.title} />
            <meta property="og:description" content={seoConfig.openGraph.description} />
            <meta property="og:url" content={seoConfig.openGraph.url} />
            <meta property="og:type" content={seoConfig.openGraph.type} />
          </>
        )}
        
        {/* Twitter Card */}
        {seoConfig.twitter && (
          <>
            <meta name="twitter:card" content={seoConfig.twitter.cardType} />
            <meta name="twitter:site" content={seoConfig.twitter.site} />
            <meta name="twitter:title" content={seoConfig.title} />
            <meta name="twitter:description" content={seoConfig.description} />
          </>
        )}
        
        {/* Additional Meta Tags */}
        {seoConfig.additionalMetaTags?.map((tag, index) => (
          <meta key={index} {...tag} />
        ))}
        
        {/* Schema.org Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": `Random Video Chat in ${country.name}`,
            "description": `Meet new people in ${country.name} with Omegoo's free random video chat. No login, anonymous, fast matching, and safe chatting.`,
            "url": `https://www.omegoo.chat/country/${country.slug}`,
            "inLanguage": "en",
            "publisher": {
              "@type": "Organization",
              "name": "Omegoo",
              "url": "https://www.omegoo.chat"
            }
          })}
        </script>
        
        {/* FAQ Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": `Is Omegoo safe in ${country.name}?`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. We offer anonymous chatting with no data storage. Our AI moderation and instant reporting keeps you safe."
                }
              },
              {
                "@type": "Question",
                "name": "Do I need to create an account?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No login, no registration. Fully free. Just open and start chatting instantly."
                }
              },
              {
                "@type": "Question",
                "name": `Can I chat with only ${country.name} users?`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `Yes. Our algorithm prioritizes local matching for ${country.name} users when available.`
                }
              },
              {
                "@type": "Question",
                "name": "Is it better than Omegle?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes — faster connections, cleaner UI, bot-free experience, and better safety features."
                }
              },
              {
                "@type": "Question",
                "name": "Can I use it on mobile?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, fully optimized for Android, iPhone, tablets, and all devices."
                }
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 text-white min-h-screen">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-8 pb-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300">
              Random Video Chat in {country.name} — Talk to Strangers Instantly
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              Welcome to Omegoo, the fastest and safest platform to connect with strangers in {country.name} through live random video chat. No login, no registration, and zero complexity — just tap and start talking instantly.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8 text-sm text-gray-400">
              <div className="flex items-center">
                <span className="mr-2">🌍</span>
                <span><strong>Continent:</strong> {country.continent}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">👥</span>
                <span><strong>Population:</strong> {country.population}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🗣️</span>
                <span><strong>Languages:</strong> {country.languages.join(', ')}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🕒</span>
                <span><strong>Timezone:</strong> {country.timezone}</span>
              </div>
            </div>
            
            <Link
              to="/"
              className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Chatting with {country.name} Now
            </Link>
          </div>
        </section>

        {/* Why Chat With Strangers Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Why Chat With Strangers in {country.name}?
          </h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              People love meeting new friends online, and Omegoo allows you to:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 shadow-lg">
                <div className="flex items-start">
                  <span className="text-3xl mr-4">🇨🇳</span>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-blue-400">Meet Locals from {country.name}</h3>
                    <p className="text-gray-300">Connect with real people from cities across {country.name} and discover local culture.</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 shadow-lg">
                <div className="flex items-start">
                  <span className="text-3xl mr-4">😊</span>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-purple-400">Have Fun & Casual Conversations</h3>
                    <p className="text-gray-300">Break the ice with random strangers. No pressure, just genuine human connections.</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 shadow-lg">
                <div className="flex items-start">
                  <span className="text-3xl mr-4">📚</span>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-pink-400">Improve Language Skills</h3>
                    <p className="text-gray-300">Practice {country.languages[0]} or English with native speakers in real conversations.</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 shadow-lg">
                <div className="flex items-start">
                  <span className="text-3xl mr-4">🌏</span>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-green-400">Explore Different Cultures</h3>
                    <p className="text-gray-300">Learn about {country.name}'s traditions, food, lifestyle directly from locals.</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 shadow-lg">
                <div className="flex items-start">
                  <span className="text-3xl mr-4">🤝</span>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-yellow-400">Make Friends from Around the World</h3>
                    <p className="text-gray-300">Whether you're bored or curious, Omegoo gives you real people, real-time.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400">
            Features of Omegoo for {country.name} Users
          </h2>
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-blue-400/50 transition-all duration-300 shadow-lg transition-all duration-300">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold mb-4 text-blue-400">No Login Required</h3>
              <p className="text-gray-300 leading-relaxed">
                Just open and start chatting instantly. 0% friction. No email, no phone number, no social media connection. Pure anonymous access.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-purple-400/50 transition-all duration-300 shadow-lg">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold mb-4 text-purple-400">Completely Anonymous</h3>
              <p className="text-gray-300 leading-relaxed">
                We never store personal data. Your identity stays private. No chat logs, no browsing history, zero tracking.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-green-400/50 transition-all duration-300 shadow-lg">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold mb-4 text-green-400">Fast Matching System</h3>
              <p className="text-gray-300 leading-relaxed">
                Our smart routing connects you only to active users in under 2 seconds. No waiting, just instant connections.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-pink-400/50 transition-all duration-300 shadow-lg">
              <div className="text-5xl mb-4">🛡️</div>
              <h3 className="text-2xl font-bold mb-4 text-pink-400">Anti-Bot Protection</h3>
              <p className="text-gray-300 leading-relaxed">
                Better than Omegle. Better than OmeTV. Real humans — not bots. Advanced AI filters out fake users instantly.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-yellow-400/50 transition-all duration-300 shadow-lg">
              <div className="text-5xl mb-4">📱</div>
              <h3 className="text-2xl font-bold mb-4 text-yellow-400">Mobile-Friendly Interface</h3>
              <p className="text-gray-300 leading-relaxed">
                Works seamlessly on Android, iPhone, laptops, tablets. Optimized for touch screens and responsive design.
              </p>
            </div>
          </div>
        </section>

        {/* Why Better than Omegle */}
        <section className="container mx-auto px-4 py-16 bg-white/5">
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-yellow-400">
            Why Omegoo is a Better Omegle Alternative in {country.name}
          </h2>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30 text-center">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="text-lg font-bold mb-2">Faster Connections</h3>
                <p className="text-sm text-gray-300">&lt;2s matching vs Omegle's 5-10s</p>
              </div>
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-6 border border-purple-500/30 text-center">
                <div className="text-4xl mb-3">✨</div>
                <h3 className="text-lg font-bold mb-2">Cleaner UI</h3>
                <p className="text-sm text-gray-300">Modern design, no clutter</p>
              </div>
              <div className="bg-gradient-to-br from-pink-600/20 to-red-600/20 rounded-xl p-6 border border-pink-500/30 text-center">
                <div className="text-4xl mb-3">🚫</div>
                <h3 className="text-lg font-bold mb-2">No Creepy Bots</h3>
                <p className="text-sm text-gray-300">Real humans only</p>
              </div>
              <div className="bg-gradient-to-br from-green-600/20 to-blue-600/20 rounded-xl p-6 border border-green-500/30 text-center">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="text-lg font-bold mb-2">No Popups</h3>
                <p className="text-sm text-gray-300">Clean browsing experience</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-xl p-6 border border-yellow-500/30 text-center">
                <div className="text-4xl mb-3">💯</div>
                <h3 className="text-lg font-bold mb-2">100% Free</h3>
                <p className="text-sm text-gray-300">Forever, no hidden costs</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl p-6 border border-indigo-500/30 text-center">
                <div className="text-4xl mb-3">🌍</div>
                <h3 className="text-lg font-bold mb-2">Global Filters</h3>
                <p className="text-sm text-gray-300">Country-specific matching</p>
              </div>
            </div>
            <p className="text-center text-xl text-gray-300 font-semibold">
              Omegle is gone. OmeTV is slow. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Omegoo is the new standard.</span>
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Random Video Chat for {country.name} — How It Works
          </h2>
          <div className="max-w-6xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-start bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 shadow-lg">
                <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl mr-6 flex-shrink-0">1</div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-blue-400">Open the Website</h3>
                  <p className="text-gray-300">Visit Omegoo.chat on any device. No app download, no installation required.</p>
                </div>
              </div>
              <div className="flex items-start bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 shadow-lg">
                <div className="bg-purple-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl mr-6 flex-shrink-0">2</div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-purple-400">Allow Camera (Optional Mic)</h3>
                  <p className="text-gray-300">Click "Allow" when your browser asks for camera/mic permission. Required for video chat mode.</p>
                </div>
              </div>
              <div className="flex items-start bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 shadow-lg">
                <div className="bg-pink-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl mr-6 flex-shrink-0">3</div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-pink-400">Connect Instantly</h3>
                  <p className="text-gray-300">Hit "Start" and get matched with a random stranger in under 2 seconds. Magic happens!</p>
                </div>
              </div>
              <div className="flex items-start bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 shadow-lg">
                <div className="bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl mr-6 flex-shrink-0">4</div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-green-400">Swipe Next Anytime</h3>
                  <p className="text-gray-300">Not feeling the vibe? Click "Next" to skip to another stranger instantly. No awkward goodbyes.</p>
                </div>
              </div>
              <div className="flex items-start bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 shadow-lg">
                <div className="bg-yellow-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl mr-6 flex-shrink-0">5</div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-yellow-400">Meet Someone New Every 2–3 Seconds</h3>
                  <p className="text-gray-300">Keep swiping until you find interesting people. Unlimited connections, zero limits.</p>
                </div>
              </div>
            </div>
            <p className="text-center text-lg text-gray-300 mt-8">
              <strong>No account. No email. No signup.</strong> Just pure random video chat freedom.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16 bg-white/5">
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Frequently Asked Questions (FAQs)
          </h2>
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 shadow-lg">
              <h3 className="text-xl font-bold mb-3 text-blue-400">Is Omegoo safe in {country.name}?</h3>
              <p className="text-gray-300">
                Yes. We offer anonymous chatting with no data storage. Our AI moderation monitors all video streams for inappropriate content, and you can report users instantly with one click.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 shadow-lg">
              <h3 className="text-xl font-bold mb-3 text-purple-400">Do I need to create an account?</h3>
              <p className="text-gray-300">
                No login, no registration. Fully free. Just open Omegoo.chat and start chatting. We don't ask for email, phone number, or any personal details.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 shadow-lg">
              <h3 className="text-xl font-bold mb-3 text-pink-400">Can I chat with only {country.name} users?</h3>
              <p className="text-gray-300">
                Yes. Our algorithm prioritizes local matching for {country.name} users when available. You can also chat with people worldwide if you prefer global connections.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 shadow-lg">
              <h3 className="text-xl font-bold mb-3 text-green-400">Is it better than Omegle?</h3>
              <p className="text-gray-300">
                Yes — faster connections (&lt;2s vs 5-10s), cleaner UI, bot-free experience, better safety features with AI moderation, and no annoying popups. Plus, Omegle shut down in 2023, so Omegoo is the modern alternative.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 shadow-lg">
              <h3 className="text-xl font-bold mb-3 text-yellow-400">Can I use it on mobile?</h3>
              <p className="text-gray-300">
                Yes, fully optimized for Android, iPhone, tablets, and all devices. Works in mobile browsers (Chrome, Safari, Firefox) without app downloads.
              </p>
            </div>
          </div>
        </section>

        {/* Related Countries Section */}
        <section className="container mx-auto px-4 py-16 bg-gray-800/30">
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Random Chat in Other Countries
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {relatedCountries.map((relatedCountry) => (
              <Link
                key={relatedCountry.slug}
                to={`/country/${relatedCountry.slug}`}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 shadow-lg hover:border-blue-500/50 transition-all duration-300 group"
              >
                <h3 className="text-xl font-bold mb-2 text-blue-400 group-hover:text-blue-300">
                  Random Chat in {relatedCountry.name}
                </h3>
                <p className="text-gray-400 text-sm mb-3">{relatedCountry.description.substring(0, 80)}...</p>
                <div className="text-sm text-gray-500">
                  <span>🌍 {relatedCountry.continent}</span>
                  <span className="mx-2">•</span>
                  <span>👥 {relatedCountry.population}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Money Keyword Internal Links */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-300">
            Explore More Ways to Chat
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Link
              to="/no-login-video-chat"
              className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 group"
            >
              <h3 className="text-xl font-bold mb-2 text-blue-400 group-hover:text-blue-300">No Login Video Chat</h3>
              <p className="text-gray-400 text-sm">Skip registration entirely. Instant anonymous access.</p>
            </Link>
            <Link
              to="/anonymous-video-chat"
              className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 group"
            >
              <h3 className="text-xl font-bold mb-2 text-purple-400 group-hover:text-purple-300">Anonymous Video Chat</h3>
              <p className="text-gray-400 text-sm">100% private connections. Zero tracking.</p>
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl p-12 max-w-4xl mx-auto border border-gray-700/50">
            <h2 className="text-4xl font-bold mb-6">Ready to Meet Strangers in {country.name}?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of {country.name} users enjoying free random video chat. No login required. 100% anonymous. Start in 2 seconds.
            </p>
            <Link
              to="/"
              className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-12 py-5 rounded-full text-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105"
            >
              Start Chatting Now
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default CountryPage;
