
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

  // Ignore specific technical paths to prevent redirection loops.
  if (
    [
      '/manifest.json',
      '/favicon.ico',
      '/logo.png',
    ].includes(pathname) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/admin')
  ) {
    return NextResponse.next();
  }
  
  // CRITICAL: Ignore the Firebase auth handler path completely.
  if (pathname.startsWith('/__/auth/')) {
    return NextResponse.next();
  }

  // Check if there is any supported locale in the pathname
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    
    // Redirect to the landing page for the detected locale.
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/`.
  // The logic within the middleware handles other specific paths like /admin.
  matcher: ['/((?!api|_next/static|_next/image|images|assets|favicon.ico|sw.js).*)'],
};
