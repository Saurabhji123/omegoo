import React from 'react';
import { Helmet } from 'react-helmet-async';

interface OpenGraphImage {
  url: string;
  width: number;
  height: number;
  alt: string;
  type?: string;
}

interface OpenGraphConfig {
  type: string;
  locale: string;
  url: string;
  siteName: string;
  title: string;
  description: string;
  images: OpenGraphImage[];
}

interface TwitterConfig {
  handle: string;
  site: string;
  cardType: string;
}

interface MetaTag {
  name?: string;
  content?: string;
  httpEquiv?: string;
}

interface LinkTag {
  rel: string;
  href: string;
  sizes?: string;
}

export interface SEOHeadProps {
  title: string;
  description: string;
  canonical: string;
  openGraph?: OpenGraphConfig;
  twitter?: TwitterConfig;
  additionalMetaTags?: MetaTag[];
  additionalLinkTags?: LinkTag[];
  children?: React.ReactNode;
}

/**
 * Enhanced SEO Head Component using react-helmet-async
 * Provides comprehensive SEO meta tags with TypeScript support
 */
const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  canonical,
  openGraph,
  twitter,
  additionalMetaTags = [],
  additionalLinkTags = [],
  children
}) => {
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      {openGraph && (
        <>
          <meta property="og:type" content={openGraph.type} />
          <meta property="og:locale" content={openGraph.locale} />
          <meta property="og:url" content={openGraph.url} />
          <meta property="og:site_name" content={openGraph.siteName} />
          <meta property="og:title" content={openGraph.title} />
          <meta property="og:description" content={openGraph.description} />
          {openGraph.images.map((image, index) => (
            <React.Fragment key={index}>
              <meta property="og:image" content={image.url} />
              <meta property="og:image:width" content={String(image.width)} />
              <meta property="og:image:height" content={String(image.height)} />
              <meta property="og:image:alt" content={image.alt} />
              {image.type && <meta property="og:image:type" content={image.type} />}
            </React.Fragment>
          ))}
        </>
      )}

      {/* Twitter Card */}
      {twitter && (
        <>
          <meta name="twitter:card" content={twitter.cardType} />
          <meta name="twitter:site" content={twitter.site} />
          <meta name="twitter:creator" content={twitter.handle} />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
        </>
      )}

      {/* Additional Meta Tags */}
      {additionalMetaTags.map((tag, index) => (
        <meta key={index} {...tag} />
      ))}

      {/* Additional Link Tags */}
      {additionalLinkTags.map((tag, index) => (
        <link key={index} {...tag} />
      ))}

      {/* Children (for Schema.org and other custom tags) */}
      {children}
    </Helmet>
  );
};

export default SEOHead;
