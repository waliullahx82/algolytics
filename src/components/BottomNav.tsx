'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Code,
  Target,
  Users,
  MoreHorizontal,
  Settings,
  HelpCircle,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const primaryNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/problems', label: 'Problems', icon: Code },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/leaderboard', label: 'Leaders', icon: Users },
];

const secondaryNavItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/support', label: 'Support', icon: HelpCircle },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { logOut } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  useEffect(() => {
    if (!isMoreOpen) {
      return;
    }
    setIsMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMoreOpen) {
      document.body.style.overflow = '';
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMoreOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onEscape);
    };
  }, [isMoreOpen]);

  return (
    <>
      <nav className="md:hidden fixed left-0 right-0 bottom-0 z-40 border-t border-[#43484e]/20 bg-[#0a0f14]/98 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-6 h-16 px-1">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-lg transition-colors ${
                  isActive ? 'text-[#81ecff] bg-[#81ecff]/10' : 'text-[#a7abb2]'
                }`}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setIsMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-1 rounded-lg text-[#a7abb2]"
            aria-label="More actions"
            aria-expanded={isMoreOpen}
            aria-controls="mobile-more-sheet"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-wide">More</span>
          </button>
        </div>
      </nav>

      <div className={`md:hidden fixed inset-0 z-50 ${isMoreOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isMoreOpen}>
        <button
          onClick={() => setIsMoreOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${isMoreOpen ? 'opacity-100' : 'opacity-0'}`}
          aria-label="Close more actions"
        />

        <section
          id="mobile-more-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="More actions"
          className={`absolute left-0 right-0 bottom-0 rounded-t-2xl border-t border-[#43484e]/25 bg-[#0f151b] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl transition-transform duration-200 ${
            isMoreOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#eaeef5] tracking-wide">More Actions</h3>
            <button
              onClick={() => setIsMoreOpen(false)}
              className="h-9 w-9 rounded-lg border border-[#43484e]/30 bg-[#141a20] text-[#a7abb2] flex items-center justify-center"
              aria-label="Close sheet"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 min-h-12 rounded-lg border transition-colors ${
                    isActive
                      ? 'text-[#81ecff] border-[#81ecff]/30 bg-[#81ecff]/10'
                      : 'text-[#d8dde6] border-transparent bg-[#141a20]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            <button
              onClick={logOut}
              className="flex items-center gap-3 px-3 min-h-12 rounded-lg bg-[#141a20] text-[#ff8b86] w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Log Out</span>
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
