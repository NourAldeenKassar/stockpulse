import AuthGuard from '@/components/auth-guard';
import Navbar from '@/components/navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </AuthGuard>
  );
}
