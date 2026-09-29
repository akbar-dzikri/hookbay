import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/shell';
import { getSessionUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Console' };
export const dynamic = 'force-dynamic';

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const session = await getSessionUser();
  if (!session) redirect('/login');
  return <DashboardShell>{children}</DashboardShell>;
}
