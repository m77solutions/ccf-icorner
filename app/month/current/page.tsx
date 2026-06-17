// app/month/current/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentMonthSlug } from '@/lib/events-data';

export default function CurrentMonthRedirect() {
  const slug = getCurrentMonthSlug();
  redirect(`/month/${slug}`);
}
