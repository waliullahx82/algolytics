'use client';

import { Search, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useSync } from '@/lib/SyncContext';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
}

export default function Header({ title, showSearch = true }: HeaderProps) {
  const { user } = useAuth();
  const { syncing, syncAll, stats, lastSync } = useSync();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const getLevel = (solved: number): string => {
    if (solved >= 1000) return 'Master';
    if (solved >= 500) return 'Expert';
    if (solved >= 300) return 'Advanced';
    if (solved >= 100) return 'Intermediate';
    if (solved >= 50) return 'Beginner';
    return 'Newcomer';
  };

  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Never';
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  useEffect(() => {
    if (!isMobileSearchOpen) {
      document.body.style.overflow = '';
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileSearchOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onEscape);
    };
  }, [isMobileSearchOpen]);

  return (
    <>
      <header className="w-full sticky top-0 z-40 bg-[#0a0f14] px-4 sm:px-6 lg:px-8 py-3 border-b border-[#43484e]/15">
        <div className="flex items-center justify-between gap-2 sm:gap-4 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {showSearch && (
              <>
                <button
                  onClick={() => setIsMobileSearchOpen(true)}
                  className="sm:hidden h-10 w-10 shrink-0 rounded-lg border border-[#43484e]/30 bg-[#141a20] text-[#81ecff] flex items-center justify-center"
                  aria-label="Open search"
                  aria-controls="mobile-search-sheet"
                  aria-expanded={isMobileSearchOpen}
                >
                  <Search className="w-4 h-4" />
                </button>

                <div className="hidden sm:block relative w-full max-w-md min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a7abb2]" />
                  <input
                    type="text"
                    placeholder="Search problems, users, or algorithms..."
                    className="w-full bg-[#000000] border border-transparent rounded-lg pl-10 pr-4 py-2 text-sm text-[#eaeef5] placeholder-[#a7abb2]/40 focus:outline-none focus:border-[#81ecff]/40 focus:ring-1 focus:ring-[#81ecff]/40 transition-all"
                  />
                </div>
              </>
            )}

            {title && !showSearch && (
              <h2 className="text-xl font-bold tracking-tighter text-[#81ecff] truncate">{title}</h2>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {lastSync && (
              <span className="text-[10px] text-[#a7abb2] font-mono hidden md:inline">
                Synced {formatLastSync(lastSync)}
              </span>
            )}

            <button
              onClick={syncAll}
              disabled={syncing}
              className="h-10 w-10 sm:h-auto sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-0 sm:px-4 py-0 sm:py-2 rounded-lg bg-[#1f262e] text-[#81ecff] font-bold text-sm hover:bg-[#252d35] transition-colors active:scale-95 duration-150 disabled:opacity-50"
              aria-label={syncing ? 'Syncing data' : 'Sync data'}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Sync'}</span>
            </button>

            {user && (
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-[#eaeef5] truncate max-w-40">{user.displayName}</p>
                <p className="text-[10px] text-[#81ecff]/80 font-mono">
                  Lvl. {stats.totalSolved} {getLevel(stats.totalSolved)}
                </p>
              </div>
            )}

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1f262e] border border-[#81ecff]/20 p-0.5 overflow-hidden">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="User Avatar"
                  className="w-full h-full rounded-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-[#141a20] flex items-center justify-center">
                  <span className="text-[#81ecff] font-bold text-sm">
                    {user?.displayName?.[0] || 'U'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showSearch && (
        <div className={`sm:hidden fixed inset-0 z-50 ${isMobileSearchOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isMobileSearchOpen}>
          <button
            onClick={() => setIsMobileSearchOpen(false)}
            className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${isMobileSearchOpen ? 'opacity-100' : 'opacity-0'}`}
            aria-label="Close search"
          />

          <section
            id="mobile-search-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className={`absolute left-0 right-0 top-0 border-b border-[#43484e]/25 bg-[#0f151b] p-4 shadow-2xl transition-transform duration-200 ${
              isMobileSearchOpen ? 'translate-y-0' : '-translate-y-full'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a7abb2]" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-[#000000] border border-transparent rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#eaeef5] placeholder-[#a7abb2]/40 focus:outline-none focus:border-[#81ecff]/40 focus:ring-1 focus:ring-[#81ecff]/40 transition-all"
                />
              </div>
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="h-10 w-10 rounded-lg border border-[#43484e]/30 bg-[#141a20] text-[#a7abb2] flex items-center justify-center"
                aria-label="Close search panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
