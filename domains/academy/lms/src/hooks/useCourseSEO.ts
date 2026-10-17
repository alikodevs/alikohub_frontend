import { useEffect } from "react";

interface CourseSEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  price?: number | string;
  currency?: string;
  instructorName?: string;
  category?: string;
}

export const useCourseSEO = ({
  title = "AlikoHub Academy - Online Courses & Cohort Bootcamps",
  description = "Learn in-demand tech, business, and health skills with self-paced and instructor-led cohort programs on AlikoHub Academy.",
  image = "https://lms.alikohub.com/og-image.jpg",
  url = typeof window !== "undefined" ? window.location.href : "",
  price,
  currency = "ETB",
  instructorName = "AlikoHub Certified Instructor",
  category = "Education",
}: CourseSEOProps = {}) => {
  useEffect(() => {
    // 1. Update Document Title
    const formattedTitle = title.includes("AlikoHub") ? title : `${title} | AlikoHub Academy`;
    document.title = formattedTitle;

    // 2. Helper to set or create meta tags
    const setMetaTag = (selector: string, attribute: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        const match = selector.match(/meta\[(property|name)="([^"]+)"\]/);
        if (match) {
          element.setAttribute(match[1], match[2]);
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, content);
    };

    // Standard Open Graph Meta Tags
    setMetaTag('meta[property="og:title"]', "content", formattedTitle);
    setMetaTag('meta[property="og:description"]', "content", description);
    if (image) {
      setMetaTag('meta[property="og:image"]', "content", image);
    }
    setMetaTag('meta[property="og:url"]', "content", url);
    setMetaTag('meta[property="og:type"]', "content", "website");

    // Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', "content", "summary_large_image");
    setMetaTag('meta[name="twitter:title"]', "content", formattedTitle);
    setMetaTag('meta[name="twitter:description"]', "content", description);
    if (image) {
      setMetaTag('meta[name="twitter:image"]', "content", image);
    }

    // 3. Schema.org Course JSON-LD Injection
    const schemaId = "schema-org-course-jsonld";
    let scriptElement = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!scriptElement) {
      scriptElement = document.createElement("script");
      scriptElement.id = schemaId;
      scriptElement.type = "application/ld+json";
      document.head.appendChild(scriptElement);
    }

    const jsonLdData = {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": title,
      "description": description,
      "provider": {
        "@type": "Organization",
        "name": "AlikoHub Academy",
        "sameAs": "https://consultancy.alikohub.com",
      },
      ...(price !== undefined && {
        "offers": {
          "@type": "Offer",
          "price": price.toString(),
          "priceCurrency": currency,
          "category": category,
        },
      }),
      "hasCourseInstance": {
        "@type": "CourseInstance",
        "courseMode": "Online",
        "instructor": {
          "@type": "Person",
          "name": instructorName,
        },
      },
    };

    scriptElement.textContent = JSON.stringify(jsonLdData);

    return () => {
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
    };
  }, [title, description, image, url, price, currency, instructorName, category]);
};
