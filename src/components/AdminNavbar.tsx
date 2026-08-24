'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BrandMark } from '@/components/BrandMark';
import {
  ShieldCheck,
  LayoutDashboard,
  FileText,
  ClipboardList,
  BarChart3,
  LogOut,
  Settings,
  KeyRound,
  Menu,
  X,
} from 'lucide-react';

export function AdminNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const isSuperAdmin = session?.user?.role === 'super-admin';

  const navItems = isSuperAdmin
    ? [
        { label: 'Command Center', href: '/admin69', icon: KeyRound },
        { label: 'Overview', href: '/super-admin', icon: Settings },
        { label: 'Admins', href: '/super-admin/admins', icon: ShieldCheck },
        { label: 'Quizzes', href: '/admin/quizzes', icon: FileText },
        { label: 'Submissions', href: '/admin/submissions', icon: ClipboardList },
        { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      ]
    : [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { label: 'Quizzes', href: '/admin/quizzes', icon: FileText },
        { label: 'Submissions', href: '/admin/submissions', icon: ClipboardList },
        { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      ];

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/super-admin' || href === '/admin69') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="w-full bg-card border-b border-border text-foreground transition-colors duration-300 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20 lg:h-24 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <BrandMark size="sm" />
            <div className="hidden xl:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline text-xs font-semibold bg-secondary text-secondary-foreground border border-border px-3 py-1.5 rounded-full max-w-[200px] truncate">
              {isSuperAdmin ? 'Super Admin' : 'Admin'}: {session?.user?.name}
            </span>
            <ThemeToggle />
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-1.5 px-2.5 py-2 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-destructive-foreground text-sm font-semibold rounded-lg transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
            <button
              type="button"
              className="xl:hidden p-2 rounded-lg border border-border hover:bg-secondary cursor-pointer"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="xl:hidden pb-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                    active ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
