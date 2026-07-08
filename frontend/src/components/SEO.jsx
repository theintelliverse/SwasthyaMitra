import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, url, keywords, image, schemaMarkup, noindex }) => {
    const currentHost = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
    const isSwasthyaMitra = currentHost.includes('swasthyamitra') || import.meta.env.VITE_BRAND_NAME === 'SwasthyaMitra';
    
    const brandName = import.meta.env.VITE_BRAND_NAME || (isSwasthyaMitra ? "SwasthyaMitra" : "Appointory");
    const siteUrl = import.meta.env.VITE_SITE_URL || (isSwasthyaMitra ? "https://swasthyamitra.in" : "https://appointory.in");

    const defaultTitle = `${brandName} | Real-time Clinical Management & Digital Health Locker`;
    const defaultDescription = `${brandName} is a real-time clinical management and digital health locker platform with live queue tracking, lab referrals, OTP-secured patient access, and role-based clinic dashboards.`;
    const defaultKeywords = `${brandName}, clinic management system, patient queue management, digital health locker, medical records, healthcare app, EMR system`;

    const imageUrl = image
        ? (image.startsWith('http') ? image : `${siteUrl}${image}`)
        : `${siteUrl}/og-image-banner.jpg`;

    const pageUrl = `${siteUrl}${url || '/'}`;
    const displayTitle = title ? `${title} | ${brandName}` : defaultTitle;

    // Dynamically set image attributes based on the resolved image URL
    const isPng = imageUrl.toLowerCase().endsWith('.png');
    const imageType = isPng ? 'image/png' : 'image/jpeg';
    const isBanner = imageUrl.includes('og-image-banner');
    const imageWidth = isBanner ? '1200' : '800';
    const imageHeight = isBanner ? '630' : '800';

    return (
        <Helmet>
            <html lang="en" />
            <title>{displayTitle}</title>
            <meta name="description" content={description || defaultDescription} />
            <meta name="keywords" content={keywords || defaultKeywords} />
            <link rel="canonical" href={pageUrl} />

            {/* Robots Directives */}
            {noindex ? (
                <>
                    <meta name="robots" content="noindex, nofollow" />
                    <meta name="googlebot" content="noindex, nofollow" />
                    <meta name="bingbot" content="noindex, nofollow" />
                    <meta name="yandex" content="noindex, nofollow" />
                    <meta name="baiduspider" content="noindex, nofollow" />
                    <meta name="duckduckbot" content="noindex, nofollow" />
                </>
            ) : (
                <>
                    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
                    <meta name="googlebot" content="index, follow, max-snippet:-1" />
                    <meta name="bingbot" content="index, follow, max-snippet:-1" />
                    <meta name="yandex" content="index, follow, max-snippet:-1" />
                    <meta name="baiduspider" content="index, follow" />
                    <meta name="duckduckbot" content="index, follow" />
                </>
            )}

            {/* Region / Language */}
            <meta name="language" content="English" />
            <meta name="geo.region" content="IN" />
            <meta name="geo.placename" content="India" />
            <meta name="ICBM" content="20.5937,78.9629" />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={pageUrl} />
            <meta property="og:site_name" content={brandName} />
            <meta property="og:title" content={displayTitle} />
            <meta property="og:description" content={description || defaultDescription} />
            <meta property="og:image" content={imageUrl} />
            <meta property="og:image:secure_url" content={imageUrl} />
            <meta property="og:image:type" content={imageType} />
            <meta property="og:image:width" content={imageWidth} />
            <meta property="og:image:height" content={imageHeight} />
            <meta property="og:image:alt" content={`${brandName} - Real-time Clinic Management & Digital Health Locker`} />
            <meta property="og:locale" content="en_IN" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={pageUrl} />
            <meta name="twitter:site" content={brandName === 'SwasthyaMitra' ? '@swasthyamitra' : '@appointory'} />
            <meta name="twitter:creator" content={brandName === 'SwasthyaMitra' ? '@swasthyamitra' : '@appointory'} />
            <meta name="twitter:title" content={displayTitle} />
            <meta name="twitter:description" content={description || defaultDescription} />
            <meta name="twitter:image" content={imageUrl} />
            <meta name="twitter:image:alt" content={`${brandName} - Real-time Clinic Management & Digital Health Locker`} />

            {/* Schema.org Structured Data */}
            {schemaMarkup && (
                Array.isArray(schemaMarkup) ? (
                    schemaMarkup.map((schema, index) => (
                        <script key={index} type="application/ld+json">
                            {JSON.stringify(schema)}
                        </script>
                    ))
                ) : (
                    <script type="application/ld+json">
                        {JSON.stringify(schemaMarkup)}
                    </script>
                )
            )}
        </Helmet>
    );
};

export default SEO;
