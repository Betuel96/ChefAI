import { redirect } from 'next/navigation';
import { i18n } from '@/i18n.config';

// This component is now a fallback for the root path.
// The middleware will handle redirection to the correct locale path.
export default function RootPage() {
  redirect(`/${i18n.defaultLocale}`); 
}
