import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { getMetaForPath } from './meta';

const FALLBACK_BASE_URL = process.env.REACT_APP_CANONICAL_BASE_URL || 'https://www.omegoo.chat';

const buildCanonicalUrl = (pathname: string) => {
  const base = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : FALLBACK_BASE_URL;

  if (!pathname) {
    return base;
  }

  return `${base.replace(/\/$/, '')}/${pathname.replace(/^\//, '')}`.replace(/\/$/, pathname === '/' ? '/' : '');
};

const SeoHead: React.FC = () => {
  const { pathname } = useLocation();
  const meta = getMetaForPath(pathname);
  const canonicalUrl = buildCanonicalUrl(pathname || '/');
  const keywords = meta.keywords ? meta.keywords.join(', ') : undefined;
  const image = meta.image || 'https://www.omegoo.chat/logo512.png';

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {meta.robots && <meta name="robots" content={meta.robots} />}
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Omegoo" />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@omegoo" />
    </Helmet>
  );
};

export default SeoHead;
