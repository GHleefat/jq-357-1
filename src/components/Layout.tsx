import { Link, useLocation } from 'react-router-dom';
import { Mic, BookOpen, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '录音', icon: Mic },
    { path: '/diaries', label: '日记', icon: BookOpen },
    { path: '/trends', label: '趋势', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50 to-orange-50">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-stone-200/60">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-rose-400 to-violet-500 flex items-center justify-center shadow-md">
              <span className="text-white text-lg">🎙️</span>
            </div>
            <h1 className="text-xl font-semibold text-stone-800 tracking-tight" style={{ fontFamily: '"Lora", Georgia, serif' }}>
              心语日记
            </h1>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-md'
                      : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
                  }`}
                >
                  <Icon size={16} strokeWidth={2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 pb-24">
        {children}
      </main>
    </div>
  );
}
