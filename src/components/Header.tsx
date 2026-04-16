'use client';

import { Search, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useSync } from '@/lib/SyncContext';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
}

export default function Header({ title, showSearch = true }: HeaderProps) {
  const { user } = useAuth();
  const { syncing, syncAll, stats, lastSync } = useSync();

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

  return (
    <header className="w-full sticky top-0 z-40 bg-[#0a0f14] flex justify-between items-center px-8 py-4 border-b border-[#43484e]/15">
      <div className="flex items-center gap-8 flex-1">
        {showSearch && (
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a7abb2]" />
            <input
              type="text"
              placeholder="Search problems, users, or algorithms..."
              className="w-full bg-[#000000] border-none rounded-lg pl-10 pr-4 py-2 text-sm text-[#eaeef5] placeholder-[#a7abb2]/40 focus:ring-1 focus:ring-[#81ecff]/50 transition-all"
            />
          </div>
        )}
        {title && !showSearch && (
          <h2 className="text-xl font-bold tracking-tighter text-[#81ecff]">{title}</h2>
        )}
      </div>

      <div className="flex items-center gap-6">
        {lastSync && (
          <span className="text-[10px] text-[#a7abb2] font-mono hidden lg:inline">
            Synced {formatLastSync(lastSync)}
          </span>
        )}
        <button
          onClick={syncAll}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#1f262e] text-[#81ecff] font-bold text-sm hover:bg-[#252d35] transition-colors active:scale-95 duration-150 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing...' : 'Sync'}</span>
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-[#43484e]/20">
          {user && (
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-[#eaeef5]">{user.displayName}</p>
              <p className="text-[10px] text-[#81ecff]/80 font-mono">
                Lvl. {stats.totalSolved} {getLevel(stats.totalSolved)}
              </p>
            </div>
          )}
          <div className="w-10 h-10 rounded-full bg-[#1f262e] border border-[#81ecff]/20 p-0.5 overflow-hidden">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="User Avatar"
                className="w-full h-full rounded-full"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#141a20] flex items-center justify-center">
                <span className="text-[#81ecff] font-bold">
                  {user?.displayName?.[0] || 'U'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
