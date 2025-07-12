
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { i18n } from './i18n.config';

import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

function getLocale(request: NextRequest): string | undefined {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  // @ts-ignore locales are readonly
  const locales: string[] = i18n.locales;
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();

  try {
    const locale = matchLocale(languages, locales, i18n.defaultLocale);
    return locale;
  } catch (error) {
    // If matchLocale throws an error (e.g., invalid language), fallback to default
    return i18n.defaultLocale;
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const searchParams = request.nextUrl.search;

  // Let static files, API routes, and admin panel pass through
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname.startsWith('/admin')
  ) {
    return NextResponse.next();
  }
  
  // Ignore the Firebase auth handler path completely to let it do its work.
  if (pathname.startsWith('/__/auth/')) {
    return NextResponse.next();
  }
  
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // If the path is missing a locale, we need to add it.
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    
    // Redirect to the dashboard if a user is returning after a successful login.
    // The presence of auth-related query params is a strong indicator.
    if (searchParams.includes('code=') && searchParams.includes('scope=')) {
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }
    
    // For regular new visitors, send them to the landing page.
    return NextResponse.redirect(new URL(`/${locale}/landing${pathname}`, request.url));
  }
  
  // If the user visits a root locale path like /es or /en, send them to the landing page.
  if (i18n.locales.some(locale => pathname === `/${locale}`)) {
    return NextResponse.redirect(new URL(`${pathname}/landing`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Matcher ignoring `/api/`, `/_next/`, static files, and admin routes.
  matcher: ['/((?!api|admin|_next/static|_next/image|assets|favicon.ico|sw.js).*)'],
};
