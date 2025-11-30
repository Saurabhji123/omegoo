import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  // Top 12 Countries
  const topCountries = [
    { name: 'India', slug: 'india' },
    { name: 'USA', slug: 'usa' },
    { name: 'UK', slug: 'uk' },
    { name: 'Philippines', slug: 'philippines' },
    { name: 'Indonesia', slug: 'indonesia' },
    { name: 'Pakistan', slug: 'pakistan' },
    { name: 'Canada', slug: 'canada' },
    { name: 'Australia', slug: 'australia' },
    { name: 'Germany', slug: 'germany' },
    { name: 'Brazil', slug: 'brazil' },
    { name: 'Mexico', slug: 'mexico' },
    { name: 'Russia', slug: 'russia' },
  ];

  // Money Keyword Pages
  const moneyKeywords = [
    { name: 'No Login Video Chat', path: '/no-login-video-chat' },
    { name: 'Anonymous Video Chat', path: '/anonymous-video-chat' },
    { name: 'Stranger Cam Chat', path: '/stranger-cam-chat' },
    { name: 'Omegle Alternative', path: '/omegle-like-app' },
    { name: 'Random Chat', path: '/random-chat-no-registration' },
  ];

  // Static Pages
  const staticPages = [
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Safety', path: '/safety' },
    { name: 'Privacy', path: '/privacy' },
    { name: 'Terms', path: '/terms' },
  ];

  return (
    <footer className="text-white py-8 px-4 mt-16" style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Popular Quick Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Top Countries */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-red-400">Popular Countries</h3>
            <ul className="space-y-2 text-sm">
              {topCountries.map((country) => (
                <li key={country.slug}>
                  <Link
                    to={`/country/${country.slug}`}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    Video Chat {country.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Money Keyword Pages */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-red-400">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {moneyKeywords.map((keyword) => (
                <li key={keyword.path}>
                  <Link
                    to={keyword.path}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    {keyword.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Static Pages */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-red-400">Information</h3>
            <ul className="space-y-2 text-sm">
              {staticPages.map((page) => (
                <li key={page.path}>
                  <Link
                    to={page.path}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    {page.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* SEO-Rich Description */}
        <div className="border-t border-gray-700 pt-6 mb-6">
          <p className="text-sm text-gray-400 text-center max-w-4xl mx-auto leading-relaxed">
            <strong className="text-white">Omegoo</strong> is the best free <strong className="text-white">Omegle alternative</strong> for <strong className="text-white">random video chat with strangers</strong>. 
            Connect with people worldwide through our <strong className="text-white">anonymous video chat</strong> platform. 
            No login required, 100% free, and safe for everyone. Start <strong className="text-white">cam to cam chat</strong> instantly on any device.
          </p>
        </div>

        {/* Copyright & Social */}
        <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()} <span className="text-white font-semibold">Omegoo.chat</span> - All rights reserved.
          </div>
          
          {/* Social Links */}
          <div className="flex gap-4">
            <a
              href="https://github.com/Saurabhji123/omegoo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a
              href="https://x.com/omegoochat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Twitter / X"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a
              href="https://www.instagram.com/omegoo.chat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Keywords for SEO (hidden but crawlable) */}
        <div className="sr-only">
          Keywords: omegle alternative, random video chat, talk to strangers, video chat with girls, cam to cam chat, 
          anonymous chat, ometv alternative, free video chat with strangers, no login video chat, anonymous video chat, 
          stranger cam chat, omegle-like app, random chat without registration, chat india, chat usa, chat uk
        </div>
      </div>
    </footer>
  );
};

export default Footer;
