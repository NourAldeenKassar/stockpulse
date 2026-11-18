import AuthGuard from '@/components/auth-guard';
import Navbar from '@/components/navbar';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </AuthGuard>
  );
}
