
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { i18n, type Locale, localeNames } from '@/i18n.config';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const pathName = usePathname();

  const redirectedPathName = (locale: Locale) => {
    if (!pathName) return '/';
    const segments = pathName.split('/');
    segments[1] = locale;
    return segments.join('/');
  };

  const getCurrentLocale = () => {
    const locale = pathName.split('/')[1];
    if (i18n.locales.includes(locale as any)) {
      return locale as Locale;
    }
    return i18n.defaultLocale;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center justify-center sm:justify-start gap-2 w-full">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{localeNames[getCurrentLocale()]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {i18n.locales.map(locale => {
          return (
            <DropdownMenuItem key={locale} asChild>
              <Link href={redirectedPathName(locale)}>{localeNames[locale]}</Link>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
