
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

  // Step 1: Ignore specific technical paths
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname.startsWith('/admin')
  ) {
    return NextResponse.next();
  }
  
  // CRITICAL: Ignore the Firebase auth handler path completely to let it do its work.
  // This prevents the "accounts.google.com rejected connection" error.
  if (pathname.startsWith('/__/auth/')) {
    return NextResponse.next();
  }

  // Step 2: Check if the pathname is missing a locale
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    
    // If a user is returning from a successful Google sign-in, redirect them to the dashboard.
    // The presence of auth-related query params is a strong indicator.
    if (searchParams.includes('code=') && searchParams.includes('scope=')) {
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }
    
    // For all other cases (e.g., a new visitor), redirect to the landing page with the detected locale.
    return NextResponse.redirect(new URL(`/${locale}/landing${pathname === '/' ? '' : pathname}`, request.url));
  }
  
  // Step 3: Handle root locale paths (e.g., /es or /en)
  // If the user visits a root locale path, send them to the landing page for that locale.
  if (i18n.locales.some(locale => pathname === `/${locale}`)) {
    return NextResponse.redirect(new URL(`${pathname}/landing`, request.url));
  }

  // Step 4: If all checks pass, continue to the requested page
  return NextResponse.next();
}

export const config = {
  // Matcher ignoring `/api/`, `/_next/`, static files, and admin routes.
  // It MUST NOT ignore /__/auth/handler, so we let the middleware logic handle it.
  matcher: ['/((?!api|admin|_next/static|_next/image|assets|favicon.ico|sw.js).*)'],
};
