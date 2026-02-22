// Strapi API utility functions
import type {
  StrapiResponse,
  PromoCode,
  Brand,
  Category,
  FooterLink,
  StrapiQueryParams,
} from '../types/strapi';

const STRAPI_URL = import.meta.env.PUBLIC_STRAPI_URL || 'http://localhost:1337';

/**
 * Build query string from params
 */
function buildQueryString(params: StrapiQueryParams = {}): string {
  const searchParams = new URLSearchParams();

  if (params.locale) {
    searchParams.set('locale', params.locale);
  }

  if (params.populate) {
    searchParams.set('populate', '*');
  }

  if (params.sort) {
    searchParams.set('sort', params.sort);
  }

  if (params.pagination) {
    searchParams.set('pagination[page]', params.pagination.page.toString());
    searchParams.set('pagination[pageSize]', params.pagination.pageSize.toString());
  }

  // Build filters using Strapi's nested syntax
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([op, val]) => {
          searchParams.set(`filters[${key}][${op}]`, String(val));
        });
      } else {
        searchParams.set(`filters[${key}]`, String(value));
      }
    });
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString.replace(/\+/g, '%20')}` : '';
}

/**
 * Fetch data from Strapi API with error handling
 */
async function fetchStrapi<T>(endpoint: string, params: StrapiQueryParams = {}): Promise<T | null> {
  const url = `${STRAPI_URL}/api/${endpoint}${buildQueryString(params)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Strapi endpoint not found: ${url}`);
        return null;
      }
      throw new Error(`Strapi API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to fetch from Strapi (${url}):`, message);
    return null;
  }
}

/**
 * Get image URL from Strapi media object
 */
export function getStrapiMediaUrl(media: { url: string } | null | undefined): string {
  if (!media?.url) {
    return '/placeholder.svg';
  }
  // Handle relative URLs from Strapi
  return media.url.startsWith('http') ? media.url : `${STRAPI_URL}${media.url}`;
}

/**
 * Get all promo codes with populated relations
 */
export async function getPromoCodes(
  locale: string,
  options?: {
    featured?: boolean;
    active?: boolean;
    categorySlug?: string;
    brandSlug?: string;
    limit?: number;
  }
): Promise<PromoCode[]> {
  const filters: Record<string, unknown> = {};

  if (options?.featured !== undefined) {
    filters.isFeatured = { $eq: options.featured };
  }

  if (options?.active !== undefined) {
    filters.isActive = { $eq: options.active };
  }

  const params: StrapiQueryParams = {
    locale,
    populate: '*',
    sort: 'createdAt:desc',
  };

  // Fetch all and filter by slug in code (Strapi v5 doesn't support nested slug filters)
  if (options?.categorySlug || options?.brandSlug) {
    const allPromoCodes = await fetchStrapi<StrapiResponse<PromoCode[]>>(
      'promo-codes',
      { locale, populate: '*', sort: 'createdAt:desc' }
    );
    
    let filtered = allPromoCodes?.data || [];
    
    if (options.categorySlug) {
      filtered = filtered.filter(pc => pc.category?.slug === options.categorySlug);
    }
    
    if (options.brandSlug) {
      filtered = filtered.filter(pc => pc.brand?.slug === options.brandSlug);
    }
    
    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }
    
    return filtered;
  }

  if (Object.keys(filters).length > 0) {
    params.filters = filters;
  }

  if (options?.limit) {
    params.pagination = {
      page: 1,
      pageSize: options.limit,
    };
  }

  const response = await fetchStrapi<StrapiResponse<PromoCode[]>>('promo-codes', params);
  return response?.data || [];
}

/**
 * Get a single promo code by slug
 */
export async function getPromoCodeBySlug(
  slug: string,
  locale: string
): Promise<PromoCode | null> {
  const params: StrapiQueryParams = {
    locale,
    populate: '*',
    filters: {
      slug: { $eq: slug },
    },
  };

  const response = await fetchStrapi<StrapiResponse<PromoCode[]>>('promo-codes', params);
  return response?.data?.[0] || null;
}

/**
 * Get all brands with populated logos
 */
export async function getBrands(locale: string): Promise<Brand[]> {
  const params: StrapiQueryParams = {
    locale,
    populate: '*',
    sort: 'name:asc',
  };

  const response = await fetchStrapi<StrapiResponse<Brand[]>>('brands', params);
  return response?.data || [];
}

/**
 * Get a single brand by slug
 */
export async function getBrandBySlug(slug: string, locale: string): Promise<Brand | null> {
  const params: StrapiQueryParams = {
    locale,
    populate: '*',
    filters: {
      slug: { $eq: slug },
    },
  };

  const response = await fetchStrapi<StrapiResponse<Brand[]>>('brands', params);
  return response?.data?.[0] || null;
}

/**
 * Get a brand by documentId and locale
 */
export async function getBrandByDocumentId(
  documentId: string,
  locale: string
): Promise<Brand | null> {
  const params: StrapiQueryParams = {
    locale,
    populate: '*',
    filters: {
      documentId: { $eq: documentId },
    },
  };

  const response = await fetchStrapi<StrapiResponse<Brand[]>>('brands', params);
  return response?.data?.[0] || null;
}

/**
 * Get all categories with populated logos
 */
export async function getCategories(locale: string): Promise<Category[]> {
  const params: StrapiQueryParams = {
    locale,
    populate: '*',
    sort: 'name:asc',
  };

  const response = await fetchStrapi<StrapiResponse<Category[]>>('categories', params);
  return response?.data || [];
}

/**
 * Get a single category by slug
 */
export async function getCategoryBySlug(
  slug: string,
  locale: string
): Promise<Category | null> {
  const params: StrapiQueryParams = {
    locale,
    populate: '*',
    filters: {
      slug: { $eq: slug },
    },
  };

  const response = await fetchStrapi<StrapiResponse<Category[]>>('categories', params);
  return response?.data?.[0] || null;
}

/**
 * Get a category by documentId and locale
 */
export async function getCategoryByDocumentId(
  documentId: string,
  locale: string
): Promise<Category | null> {
  const params: StrapiQueryParams = {
    locale,
    populate: '*',
    filters: {
      documentId: { $eq: documentId },
    },
  };

  const response = await fetchStrapi<StrapiResponse<Category[]>>('categories', params);
  return response?.data?.[0] || null;
}

/**
 * Get all footer links with populated content
 */
export async function getFooterLinks(locale: string): Promise<FooterLink[]> {
  const params: StrapiQueryParams = {
    locale,
    populate: '*',
    sort: 'createdAt:asc',
  };

  const response = await fetchStrapi<StrapiResponse<FooterLink[]>>('footer-links', params);
  return response?.data || [];
}

/**
 * Get a single footer link by slug
 */
export async function getFooterLinkBySlug(
  slug: string,
  locale: string
): Promise<FooterLink | null> {
  const params: StrapiQueryParams = {
    locale,
    populate: '*',
    filters: {
      slug: { $eq: slug },
    },
  };

  const response = await fetchStrapi<StrapiResponse<FooterLink[]>>('footer-links', params);
  return response?.data?.[0] || null;
}

/**
 * Get a footer link by documentId and locale
 */
export async function getFooterLinkByDocumentId(
  documentId: string,
  locale: string
): Promise<FooterLink | null> {
  const params: StrapiQueryParams = {
    locale,
    populate: '*',
    filters: {
      documentId: { $eq: documentId },
    },
  };

  const response = await fetchStrapi<StrapiResponse<FooterLink[]>>('footer-links', params);
  return response?.data?.[0] || null;
}
