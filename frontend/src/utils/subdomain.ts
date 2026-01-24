/**
 * Subdomain Detection Utility
 * Detects whether the user is accessing the admin or public site
 */

export type Subdomain = 'www' | 'admin';

/**
 * Get the current subdomain from the URL
 * - In production: checks actual subdomain (admin.kitchen48.com vs www.kitchen48.com)
 * - In development: uses ?subdomain=admin query param for testing
 */
export function getSubdomain(): Subdomain {
  // Development: Check for query param override
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const subdomainParam = urlParams.get('subdomain');

    if (subdomainParam === 'admin') {
      return 'admin';
    }
  }

  // Production: Check actual subdomain
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  // Handle localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'www';
  }

  // Extract subdomain from hostname (e.g., admin.kitchen48.com -> admin)
  const parts = hostname.split('.');

  if (parts.length >= 3) {
    const subdomain = parts[0].toLowerCase();

    if (subdomain === 'admin') {
      return 'admin';
    }
  }

  // Default to public site
  return 'www';
}

/**
 * Check if current site is admin portal
 */
export function isAdminSite(): boolean {
  return getSubdomain() === 'admin';
}

/**
 * Check if current site is public site
 */
export function isPublicSite(): boolean {
  return getSubdomain() === 'www';
}
