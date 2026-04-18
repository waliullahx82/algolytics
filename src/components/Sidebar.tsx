'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BarChart3, 
  Code, 
  Users,
  Settings, 
  HelpCircle, 
  LogOut,
  Terminal,
  Target
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/problems', label: 'Problems', icon: Code },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/leaderboard', label: 'Leaderboard', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const bottomNavItems = [
  { href: '/support', label: 'Support', icon: HelpCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logOut } = useAuth();

  return (
    <aside className="hidden md:flex w-64 h-screen fixed left-0 top-0 bg-[#0a0f14] flex-col border-r border-[#43484e]/15 z-30">
      <div className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-linear-to-br from-[#81ecff] to-[#00e3fd] rounded-lg flex items-center justify-center">
            <Terminal className="w-5 h-5 text-[#003840]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#81ecff] tracking-tighter leading-none">
              Algolytics
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-[#a7abb2]/60 font-bold mt-1">
              Mission Control
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200
                ${isActive 
                  ? 'text-[#81ecff] border-r-2 border-[#81ecff] bg-linear-to-r from-[#81ecff]/10 to-transparent font-bold' 
                  : 'text-[#a7abb2] hover:text-[#eaeef5] hover:bg-[#141a20]'
                }
              `}
            >
              <Icon className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-6 mt-auto border-t border-[#43484e]/15 space-y-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 px-4 py-3 rounded-md text-[#a7abb2] hover:text-[#eaeef5] hover:bg-[#141a20] transition-all duration-200"
            >
              <Icon className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={logOut}
          className="group flex items-center gap-3 px-4 py-3 rounded-md text-[#ff716c]/80 hover:text-[#ff716c] hover:bg-[#141a20] transition-all duration-200 w-full"
        >
          <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          <span className="font-medium">Log Out</span>
        </button>
      </div>
    </aside>
  );
}
