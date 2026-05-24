import React from 'react';
import { Helmet } from 'react-helmet-async';
import defaultLogo from '../assets/Appointory_logo.jpg';

const SEO = ({ title, description, url, keywords, image, schemaMarkup }) => {
    const defaultTitle = "Appointory | Real-time Clinical Management & Digital Health Locker";
    const defaultDescription = "Appointory is a real-time clinical management and digital health locker platform with live queue tracking, lab referrals, OTP-secured patient access, and role-based clinic dashboards.";
    const defaultKeywords = "Appointory, clinic management system, patient queue management, digital health locker, medical records, healthcare app";

    const siteUrl = "https://appointory.in";
    const imageUrl = image
        ? (image.startsWith('http') ? image : `${siteUrl}${image}`)
        : `${siteUrl}${defaultLogo}`;

    const pageUrl = `${siteUrl}${url || '/'}`;

    return (
        <Helmet>
            <title>{title ? `${title} | Appointory` : defaultTitle}</title>
            <meta name="description" content={description || defaultDescription} />
            <meta name="keywords" content={keywords || defaultKeywords} />
            <link rel="canonical" href={pageUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={pageUrl} />
            <meta property="og:title" content={title ? `${title} | Appointory` : defaultTitle} />
            <meta property="og:description" content={description || defaultDescription} />
            <meta property="og:image" content={imageUrl} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={pageUrl} />
            <meta name="twitter:title" content={title ? `${title} | Appointory` : defaultTitle} />
            <meta name="twitter:description" content={description || defaultDescription} />
            <meta name="twitter:image" content={imageUrl} />

            {/* Schema.org Structured Data */}
            {schemaMarkup && (
                <script type="application/ld+json">
                    {JSON.stringify(schemaMarkup)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
