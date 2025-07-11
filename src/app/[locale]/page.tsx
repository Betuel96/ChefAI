
import { redirect } from 'next/navigation';

// This is a fallback route. The middleware should redirect to /<locale>/dashboard
export default function LocaleRootPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/dashboard`);
}
