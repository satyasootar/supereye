import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from './config';

export function organizationJsonLd() {
  const url = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url,
    description: SITE_DESCRIPTION,
    logo: `${url}/icon`,
  };
}

export function webSiteJsonLd() {
  const url = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url,
    description: SITE_DESCRIPTION,
    inLanguage: 'en',
  };
}

export function softwareApplicationJsonLd() {
  const url = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url,
    description: SITE_DESCRIPTION,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier available; paid plans for higher AI token limits',
    },
    featureList: [
      'Unified Gmail inbox',
      'Google Calendar sync',
      'AI email triage',
      'Keyboard shortcuts',
      'GitHub integration',
    ],
  };
}

export function homePageJsonLd() {
  return [organizationJsonLd(), webSiteJsonLd(), softwareApplicationJsonLd()];
}
