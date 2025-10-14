import React from 'react';

const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          About Omegoo
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Connecting people worldwide through safe, anonymous conversations
        </p>
      </div>

      {/* Mission Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg">
              <img 
                src="/logo512.png" 
                alt="Omegoo" 
                className="w-8 h-8 rounded-lg shadow-md object-cover"
              />
            </div>
          </div>
          <div className="ml-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Mission</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              Omegoo bridges cultures and connects hearts across the globe. We believe that meaningful conversations 
              can happen between strangers, breaking down barriers and building understanding. Our platform provides 
              a safe, anonymous space where people can meet, chat, and learn from each other without judgment.
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">AI-Powered Safety</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Our advanced AI monitors conversations in real-time to ensure a safe, respectful environment for everyone. 
            Inappropriate behavior is detected and prevented automatically.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Complete Anonymity</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your privacy is our priority. No personal information is required or stored. 
            All conversations are anonymous and secure, giving you the freedom to be yourself.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg mb-4">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Global Community</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Connect with people from every corner of the world. Practice languages, learn about different cultures, 
            and expand your worldview through authentic conversations.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg mb-4">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Instant Connections</h3>
          <p className="text-gray-600 dark:text-gray-400">
            No sign-ups, no waiting. Get matched with someone new in seconds and start meaningful conversations 
            through text, voice, or video chat.
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
          Connecting People Worldwide
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">50K+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Daily Conversations</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">195</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Countries Connected</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">99.8%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Safe Interactions</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">24/7</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Always Available</div>
          </div>
        </div>
      </div>

      {/* Team Vision */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Our Vision for the Future
        </h2>
        <div className="prose prose-lg max-w-none text-gray-600 dark:text-gray-400">
          <p className="text-center leading-relaxed">
            We envision a world where distance and differences don't divide us, but curiosity and kindness unite us. 
            Omegoo is more than just a chat platform—it's a bridge between cultures, a space for learning, 
            and a community where everyone is welcome to share their story.
          </p>
          <div className="text-center mt-8">
            <div className="inline-flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                Made with love
              </span>
              <span>•</span>
              <span>Built for humanity</span>
              <span>•</span>
              <span>Connecting hearts globally</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;