import React, { useEffect } from 'react';

const SeoHead = ({ title, description, keywords, canonicalUrl, ogImage, ogType = 'website', jsonLd }) => {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Helper to update or create meta tag
    const updateMetaTag = (nameAttr, nameVal, content) => {
      if (!content) return;
      let tag = document.querySelector(`meta[${nameAttr}="${nameVal}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(nameAttr, nameVal);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // Standard SEO tags
    updateMetaTag('name', 'description', description);
    updateMetaTag('name', 'keywords', Array.isArray(keywords) ? keywords.join(', ') : keywords);

    // OpenGraph tags
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:type', ogType);
    updateMetaTag('property', 'og:url', canonicalUrl || window.location.href);
    if (ogImage) {
      updateMetaTag('property', 'og:image', ogImage);
    }

    // Twitter Card tags
    updateMetaTag('name', 'twitter:card', ogImage ? 'summary_large_image' : 'summary');
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', description);
    if (ogImage) {
      updateMetaTag('name', 'twitter:image', ogImage);
    }

    // Canonical link tag
    if (canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonicalUrl);
    }

    // Inject JSON-LD Schema Script
    let scriptTag = document.querySelector('#seo-jsonld-schema');
    if (jsonLd) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('id', 'seo-jsonld-schema');
        scriptTag.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(jsonLd);
    } else if (scriptTag) {
      scriptTag.remove();
    }

    return () => {
      // Cleanup custom JSON-LD script on unmount
      const tag = document.querySelector('#seo-jsonld-schema');
      if (tag) tag.remove();
    };
  }, [title, description, keywords, canonicalUrl, ogImage, ogType, jsonLd]);

  return null;
};

export default SeoHead;
