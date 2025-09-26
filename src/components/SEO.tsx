import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  price?: number;
  currency?: string;
  availability?: 'in stock' | 'out of stock' | 'preorder';
  brand?: string;
  category?: string;
  sku?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = 'Premium Footwear Collection | Solewaale',
  description = 'Discover our premium collection of shoes for men and women. Quality footwear with style, comfort, and durability.',
  keywords = 'shoes, footwear, sneakers, boots, sandals, men shoes, women shoes, premium shoes',
  image = '/images/og-image.jpg',
  url = window.location.href,
  type = 'website',
  price,
  currency = 'USD',
  availability,
  brand,
  category,
  sku
}) => {
  const siteName = 'Solewaale';
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={siteName} />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="canonical" href={url} />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@solewaale" />

      {/* Product-specific Schema.org structured data */}
      {type === 'product' && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org/',
            '@type': 'Product',
            name: title.replace(` | ${siteName}`, ''),
            description: description,
            image: image,
            brand: brand ? {
              '@type': 'Brand',
              name: brand
            } : undefined,
            category: category,
            sku: sku,
            offers: price ? {
              '@type': 'Offer',
              price: price,
              priceCurrency: currency,
              availability: availability === 'in stock' 
                ? 'https://schema.org/InStock'
                : availability === 'out of stock'
                ? 'https://schema.org/OutOfStock'
                : 'https://schema.org/PreOrder',
              url: url
            } : undefined
          })}
        </script>
      )}

      {/* Website Schema.org structured data */}
      {type === 'website' && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: siteName,
            url: url,
            description: description,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${window.location.origin}/products?search={search_term_string}`,
              'query-input': 'required name=search_term_string'
            }
          })}
        </script>
      )}

      {/* Breadcrumb Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: window.location.origin
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Products',
              item: `${window.location.origin}/products`
            }
          ]
        })}
      </script>
    </Helmet>
  );
};

export default SEO;