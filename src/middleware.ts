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
    pathname.includes('.') ||
    pathname.startsWith('/admin') // Exclude all admin routes
  ) {
    return NextResponse.next();
  }

  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    
    // If root path, redirect to landing page
    if (pathname === '/') {
        return NextResponse.redirect(new URL(`/${locale}/landing`, request.url));
    }
    
    return NextResponse.redirect(
      new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, request.url)
    );
  }
  
  // If the user visits /es, /en, etc., redirect them to the main dashboard for that locale.
  // This also correctly handles the post-login redirect from Firebase.
  if (i18n.locales.some(locale => pathname === `/${locale}`)) {
    return NextResponse.redirect(new URL(`/${pathname}/dashboard`, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  // Matcher ignoring `/api/`, `/_next/`, static files, and admin routes.
  matcher: ['/((?!api|admin|_next/static|_next/image|assets|favicon.ico|sw.js).*)'],
};
