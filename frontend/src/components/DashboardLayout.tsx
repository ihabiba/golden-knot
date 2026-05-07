import { useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';

export interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  navItems: NavItem[];
  activeSection: string;
  onSectionChange: (key: string) => void;
  children: ReactNode;
}

export default function DashboardLayout({
  title,
  subtitle,
  navItems,
  activeSection,
  onSectionChange,
  children,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function SidebarContent() {
    return (
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              onSectionChange(item.key);
              setSidebarOpen(false);
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
              activeSection === item.key
                ? 'bg-[#C9A84C] text-black shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F3]">
      {/* Mobile top bar */}
      <div className="lg:hidden bg-[#0A0A0A] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div>
          <p className="font-display text-[#C9A84C] font-bold text-base leading-tight">{title}</p>
          {subtitle && <p className="text-gray-400 text-xs">{subtitle}</p>}
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-white p-1.5 hover:text-[#C9A84C] transition-colors"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-[#0A0A0A] p-6 overflow-y-auto">
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="font-display text-[#C9A84C] font-bold text-lg">{title}</p>
                {subtitle && <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>}
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white transition-colors mt-0.5"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-60 shrink-0 bg-[#0A0A0A] min-h-[calc(100vh-4rem)] flex-col p-5 sticky top-16 self-start">
          <div className="mb-7">
            <p className="font-display text-[#C9A84C] font-bold text-lg">{title}</p>
            {subtitle && <p className="text-gray-400 text-xs mt-1 leading-relaxed">{subtitle}</p>}
          </div>
          <SidebarContent />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
