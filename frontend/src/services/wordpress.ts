import type { WPPost, WPCategory } from '../types/wordpress';

const WP_API_BASE = 'http://localhost:8881/wp-json/wp/v2';

export const CATEGORY_IDS = {
  CREATORS: 3,
  CAMPAIGNS: 4,
  IMPACT: 5,
};

export async function fetchPostsByCategory(categoryId: number): Promise<WPPost[]> {
  try {
    const res = await fetch(`${WP_API_BASE}/posts?categories=${categoryId}&per_page=20`);
    if (!res.ok) {
      throw new Error(`WordPress API error: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`Could not reach WordPress at ${WP_API_BASE}.`, error);
    return [];
  }
}

export async function fetchCreators(): Promise<WPPost[]> {
  return fetchPostsByCategory(CATEGORY_IDS.CREATORS);
}

export async function fetchCampaigns(): Promise<WPPost[]> {
  return fetchPostsByCategory(CATEGORY_IDS.CAMPAIGNS);
}

export async function fetchImpactStories(): Promise<WPPost[]> {
  return fetchPostsByCategory(CATEGORY_IDS.IMPACT);
}

export async function fetchCategories(): Promise<WPCategory[]> {
  try {
    const res = await fetch(`${WP_API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return await res.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}
