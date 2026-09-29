import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/auth-form';
import { getSessionUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Sign in' };
export const dynamic = 'force-dynamic';

export default async function LoginPage(): Promise<React.JSX.Element> {
  const session = await getSessionUser();
  if (session) redirect('/app');
  return <AuthForm mode="login" />;
}
