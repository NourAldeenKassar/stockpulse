'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/settings', label: 'Settings' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-50 border-b border-border backdrop-blur-xl"
      style={{ background: 'rgba(10, 10, 26, 0.8)' }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan to-blue-500">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
              <polyline points="16,7 22,7 22,13" />
            </svg>
          </div>
          <span className="font-heading text-lg font-semibold tracking-tight">
            T212 <span className="text-cyan">Copilot</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-cyan/10 text-cyan'
                    : 'text-text-secondary hover:bg-bg-card-hover hover:text-text-primary'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-text-muted">{user?.email}</span>
          <button
            onClick={logout}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-rose-glow hover:text-rose"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
