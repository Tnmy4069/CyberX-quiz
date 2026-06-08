'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ShieldCheck, LayoutDashboard, FileText, ClipboardList, BarChart3, LogOut, Settings } from 'lucide-react';

export function AdminNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isSuperAdmin = session?.user?.role === 'super-admin';

  const navItems = isSuperAdmin
    ? [
        { label: 'Super Admin Overview', href: '/super-admin', icon: Settings },
        { label: 'Manage Admins', href: '/super-admin/admins', icon: ShieldCheck },
        { label: 'All Quizzes', href: '/admin/quizzes', icon: FileText },
        { label: 'All Submissions', href: '/admin/submissions', icon: ClipboardList },
        { label: 'Global Analytics', href: '/admin/analytics', icon: BarChart3 },
      ]
    : [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { label: 'Quizzes', href: '/admin/quizzes', icon: FileText },
        { label: 'Submissions', href: '/admin/submissions', icon: ClipboardList },
        { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      ];

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/super-admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="w-full bg-card border-b border-border text-foreground transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-28">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <img src="/logo.webp" alt="CyberX Logo" className="h-24 w-auto object-contain" />
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs font-semibold bg-secondary text-secondary-foreground border border-border px-3 py-1.5 rounded-full">
              {isSuperAdmin ? 'Super Admin' : 'Admin'}: {session?.user?.name}
            </span>
            <ThemeToggle />
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-1.5 px-3 py-2 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-destructive-foreground text-sm font-semibold rounded-lg transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
