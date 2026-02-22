// Strapi API types matching the schema

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiDocument {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  locale: string;
}

// Brand
export interface BrandData {
  name: string;
  slug: string;
  description: string | null;
  logo: Media | null;
  websiteUrl: string | null;
  canonicalUrl: string | null;
  seoMetaTitle: string | null;
  seoMetaDescription: string | null;
  localizations?: BrandData[];
}

export type Brand = StrapiDocument & BrandData;

// Category
export interface CategoryData {
  name: string;
  slug: string;
  description: string | null;
  logo: Media | null;
  seoMetaTitle: string | null;
  seoMetaDescription: string | null;
  localizations?: CategoryData[];
}

export type Category = StrapiDocument & CategoryData;

// PromoCode
export interface PromoCodeData {
  title: string;
  slug: string;
  code: string;
  description: string | null;
  expiryDate: string | null;
  affiliateLink: string | null;
  canonicalUrl: string | null;
  logo: Media | null;
  isActive: boolean;
  isFeatured: boolean;
  category: Category | null;
  brand: Brand | null;
  seoMetaTitle: string | null;
  seoMetaDescription: string | null;
  localizations?: PromoCodeData[];
}

export type PromoCode = StrapiDocument & PromoCodeData;

// FooterLink
export interface FooterLinkData {
  header: string;
  slug: string;
  content: string | null;
  metaTitle: string | null;
  seoMetaTitle: string | null;
  seoMetaDescription: string | null;
  localizations?: FooterLinkData[];
}

export type FooterLink = StrapiDocument & FooterLinkData;

// Media (Strapi upload)
export interface Media {
  id: number;
  documentId: string;
  url: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: {
    thumbnail?: MediaFormat;
    small?: MediaFormat;
    medium?: MediaFormat;
    large?: MediaFormat;
  } | null;
}

export interface MediaFormat {
  url: string;
  name: string;
  width: number;
  height: number;
}

// API Query Params
export interface StrapiQueryParams {
  locale?: string;
  populate?: string | string[];
  filters?: Record<string, unknown>;
  sort?: string;
  pagination?: {
    page: number;
    pageSize: number;
  };
}

// SEO Types
export interface LocaleSlugs {
  lv?: string;
  en?: string;
  ru?: string;
  [key: string]: string | undefined;
}

export interface SeoProps {
  title: string;
  description?: string;
  canonicalUrl?: string;
  hreflangAlternates?: Array<{ hreflang: string; href: string }>;
  ogImage?: string;
  ogType?: string;
}
