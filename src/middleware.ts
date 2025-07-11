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

  // Let static files and API routes pass through
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Handle root path redirection to landing page
  if (pathname === '/') {
    const locale = getLocale(request) || i18n.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/landing`, request.url));
  }
  
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    
    return NextResponse.redirect(
      new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, request.url)
    );
  }
  
  return NextResponse.next();
}

export const config = {
  // Matcher ignoring `/api/`, `/_next/`, static files, and admin routes.
  matcher: ['/((?!api|admin|_next/static|_next/image|assets|favicon.ico|sw.js).*)'],
};
