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
      <div className="min-h-screen text-white flex items-center justify-center" style={{ backgroundColor: 'var(--bg-body)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center" style={{ backgroundColor: 'var(--bg-body)' }}>
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
        
        {/* Breadcrumb Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://www.omegoo.chat/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Countries",
                "item": "https://www.omegoo.chat/"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": country.name,
                "item": `https://www.omegoo.chat/country/${country.slug}`
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="text-white min-h-screen" style={{ backgroundColor: 'var(--bg-body)' }}>
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-8 pb-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 text-gradient">
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
              className="inline-block btn-primary text-white px-10 py-4 rounded-full text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Chatting with {country.name} Now
            </Link>
          </div>
        </section>

        {/* Why Chat With Strangers Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
            Why Chat With Strangers in {country.name}?
          </h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              People love meeting new friends online, and Omegoo allows you to:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-red-400/50 transition-all duration-300 shadow-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-red-300">Meet Locals from {country.name}</h3>
                    <p className="text-gray-200">Connect with real people from cities across {country.name} and discover local culture.</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-red-400/50 transition-all duration-300 shadow-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-red-300">Have Fun & Casual Conversations</h3>
                    <p className="text-gray-200">Break the ice with random strangers. No pressure, just genuine human connections.</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-red-400/50 transition-all duration-300 shadow-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-red-300">Improve Language Skills</h3>
                    <p className="text-gray-200">Practice {country.languages[0]} or English with native speakers in real conversations.</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-red-400/50 transition-all duration-300 shadow-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-green-300">Explore Different Cultures</h3>
                    <p className="text-gray-200">Learn about {country.name}'s traditions, food, lifestyle directly from locals.</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-red-400/50 transition-all duration-300 shadow-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-yellow-300">Make Friends from Around the World</h3>
                    <p className="text-gray-200">Whether you're bored or curious, Omegoo gives you real people, real-time.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
            Features of Omegoo for {country.name} Users
          </h2>
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-red-400/50 transition-all duration-300 shadow-lg">
              <div className="flex-shrink-0 w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-red-300">No Login Required</h3>
              <p className="text-gray-200 leading-relaxed">
                Just open and start chatting instantly. 0% friction. No email, no phone number, no social media connection. Pure anonymous access.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-red-400/50 transition-all duration-300 shadow-lg">
              <div className="flex-shrink-0 w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-red-300">Completely Anonymous</h3>
              <p className="text-gray-200 leading-relaxed">
                We never store personal data. Your identity stays private. No chat logs, no browsing history, zero tracking.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-green-400/50 transition-all duration-300 shadow-lg">
              <div className="flex-shrink-0 w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-green-300">Fast Matching System</h3>
              <p className="text-gray-200 leading-relaxed">
                Our smart routing connects you only to active users in under 2 seconds. No waiting, just instant connections.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-red-400/50 transition-all duration-300 shadow-lg">
              <div className="flex-shrink-0 w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-red-300">Anti-Bot Protection</h3>
              <p className="text-gray-200 leading-relaxed">
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
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
            Why Omegoo is a Better Omegle Alternative in {country.name}
          </h2>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="rounded-xl p-6 border border-red-500/30 text-center" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="text-lg font-bold mb-2">Faster Connections</h3>
                <p className="text-sm text-gray-300">&lt;2s matching vs Omegle's 5-10s</p>
              </div>
              <div className="rounded-xl p-6 border border-red-500/30 text-center" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <div className="text-4xl mb-3">✨</div>
                <h3 className="text-lg font-bold mb-2">Cleaner UI</h3>
                <p className="text-sm text-gray-300">Modern design, no clutter</p>
              </div>
              <div className="rounded-xl p-6 border border-red-500/30 text-center" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <div className="text-4xl mb-3">🚫</div>
                <h3 className="text-lg font-bold mb-2">No Creepy Bots</h3>
                <p className="text-sm text-gray-300">Real humans only</p>
              </div>
              <div className="rounded-xl p-6 border border-green-500/30 text-center" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="text-lg font-bold mb-2">No Popups</h3>
                <p className="text-sm text-gray-300">Clean browsing experience</p>
              </div>
              <div className="rounded-xl p-6 border border-yellow-500/30 text-center" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <div className="text-4xl mb-3">💯</div>
                <h3 className="text-lg font-bold mb-2">100% Free</h3>
                <p className="text-sm text-gray-300">Forever, no hidden costs</p>
              </div>
              <div className="rounded-xl p-6 border border-red-500/30 text-center" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <div className="text-4xl mb-3">🌍</div>
                <h3 className="text-lg font-bold mb-2">Global Filters</h3>
                <p className="text-sm text-gray-300">Country-specific matching</p>
              </div>
            </div>
            <p className="text-center text-xl text-gray-300 font-semibold">
              Omegle is gone. OmeTV is slow. <span className="text-gradient">Omegoo is the new standard.</span>
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
            Random Video Chat for {country.name} — How It Works
          </h2>
          <div className="max-w-6xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-start bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-red-400/50 transition-all duration-300 shadow-lg">
                <div className="bg-red-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl mr-6 flex-shrink-0">1</div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-red-400">Open the Website</h3>
                  <p className="text-gray-300">Visit Omegoo.chat on any device. No app download, no installation required.</p>
                </div>
              </div>
              <div className="flex items-start bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-red-400/50 transition-all duration-300 shadow-lg">
                <div className="bg-red-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl mr-6 flex-shrink-0">2</div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-red-400">Allow Camera (Optional Mic)</h3>
                  <p className="text-gray-300">Click "Allow" when your browser asks for camera/mic permission. Required for video chat mode.</p>
                </div>
              </div>
              <div className="flex items-start bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-red-400/50 transition-all duration-300 shadow-lg">
                <div className="bg-red-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl mr-6 flex-shrink-0">3</div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-red-400">Connect Instantly</h3>
                  <p className="text-gray-300">Hit "Start" and get matched with a random stranger in under 2 seconds. Magic happens!</p>
                </div>
              </div>
              <div className="flex items-start bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-red-400/50 transition-all duration-300 shadow-lg">
                <div className="bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl mr-6 flex-shrink-0">4</div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-green-400">Swipe Next Anytime</h3>
                  <p className="text-gray-300">Not feeling the vibe? Click "Next" to skip to another stranger instantly. No awkward goodbyes.</p>
                </div>
              </div>
              <div className="flex items-start bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-red-400/50 transition-all duration-300 shadow-lg">
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
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
            Frequently Asked Questions (FAQs)
          </h2>
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-red-400/50 transition-all duration-300 shadow-lg">
              <h3 className="text-xl font-bold mb-3 text-red-400">Is Omegoo safe in {country.name}?</h3>
              <p className="text-gray-300">
                Yes. We offer anonymous chatting with no data storage. Our AI moderation monitors all video streams for inappropriate content, and you can report users instantly with one click.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-red-400/50 transition-all duration-300 shadow-lg">
              <h3 className="text-xl font-bold mb-3 text-red-400">Do I need to create an account?</h3>
              <p className="text-gray-300">
                No login, no registration. Fully free. Just open Omegoo.chat and start chatting. We don't ask for email, phone number, or any personal details.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-red-400/50 transition-all duration-300 shadow-lg">
              <h3 className="text-xl font-bold mb-3 text-red-400">Can I chat with only {country.name} users?</h3>
              <p className="text-gray-300">
                Yes. Our algorithm prioritizes local matching for {country.name} users when available. You can also chat with people worldwide if you prefer global connections.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-red-400/50 transition-all duration-300 shadow-lg">
              <h3 className="text-xl font-bold mb-3 text-green-400">Is it better than Omegle?</h3>
              <p className="text-gray-300">
                Yes — faster connections (&lt;2s vs 5-10s), cleaner UI, bot-free experience, better safety features with AI moderation, and no annoying popups. Plus, Omegle shut down in 2023, so Omegoo is the modern alternative.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-red-400/50 transition-all duration-300 shadow-lg">
              <h3 className="text-xl font-bold mb-3 text-yellow-400">Can I use it on mobile?</h3>
              <p className="text-gray-300">
                Yes, fully optimized for Android, iPhone, tablets, and all devices. Works in mobile browsers (Chrome, Safari, Firefox) without app downloads.
              </p>
            </div>
          </div>
        </section>

        {/* Related Countries Section */}
        <section className="container mx-auto px-4 py-16 bg-gray-800/30">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
            Random Chat in Other Countries
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {relatedCountries.map((relatedCountry) => (
              <Link
                key={relatedCountry.slug}
                to={`/country/${relatedCountry.slug}`}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-red-400/50 transition-all duration-300 shadow-lg hover:border-red-500/50 transition-all duration-300 group"
              >
                <h3 className="text-xl font-bold mb-2 text-red-400 group-hover:text-red-300">
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
              className="rounded-xl p-6 border border-red-500/30 hover:border-red-400/50 transition-all duration-300 group"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <h3 className="text-xl font-bold mb-2 text-red-400 group-hover:text-red-300">No Login Video Chat</h3>
              <p className="text-gray-400 text-sm">Skip registration entirely. Instant anonymous access.</p>
            </Link>
            <Link
              to="/anonymous-video-chat"
              className="rounded-xl p-6 border border-red-500/30 hover:border-red-400/50 transition-all duration-300 group"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <h3 className="text-xl font-bold mb-2 text-red-400 group-hover:text-red-300">Anonymous Video Chat</h3>
              <p className="text-gray-400 text-sm">100% private connections. Zero tracking.</p>
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="rounded-3xl p-12 max-w-4xl mx-auto border border-gray-700/50" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <h2 className="text-4xl font-bold mb-6">Ready to Meet Strangers in {country.name}?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of {country.name} users enjoying free random video chat. No login required. 100% anonymous. Start in 2 seconds.
            </p>
            <Link
              to="/"
              className="inline-block btn-primary text-white px-12 py-5 rounded-full text-xl font-semibold transition-all duration-300 shadow-2xl transform hover:scale-105"
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
