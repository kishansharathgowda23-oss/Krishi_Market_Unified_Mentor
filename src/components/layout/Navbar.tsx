import { Menu, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import type { ActiveRoute } from '../../types';

interface NavbarProps {
  activeRoute: ActiveRoute;
  onNavigate: (route: ActiveRoute, options?: { category?: string }) => void;
}

export function Navbar({ activeRoute, onNavigate }: NavbarProps) {
  const { user } = useAuth();
  const { totalItems, setDrawerOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: Array<{ label: string; route: ActiveRoute }> = [
    { label: 'Home', route: 'home' },
    { label: 'Shop', route: 'shop' },
    { label: 'Categories', route: 'categories' },
    { label: 'Meet Our Farmers', route: 'farmers' },
    { label: 'About Us', route: 'about' },
  ];

  const handleLinkClick = (route: ActiveRoute) => {
    setMobileOpen(false);
    onNavigate(route);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FBFAF5]/95 backdrop-blur-sm border-b border-[#1F2B23]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleLinkClick('home')}
          className="font-display text-xl font-bold tracking-tight text-[#1F2B23] hover:text-[#1F6B45] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Krishi Market
        </button>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-7" aria-label="Primary Navigation">
          {navItems.map((item) => {
            const isActive = activeRoute === item.route;
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => handleLinkClick(item.route)}
                className={`text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b-2 ${
                  isActive
                    ? 'text-[#1F6B45] border-[#1F6B45]'
                    : 'text-[#1F2B23]/75 border-transparent hover:text-[#1F2B23] hover:border-[#1F2B23]/25'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action + Cart trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#1F2B23]/15 bg-white text-[#1F2B23] hover:border-[#1F6B45] hover:text-[#1F6B45] transition-colors cursor-pointer"
            aria-label={`Open shopping basket with ${totalItems} items`}
          >
            <ShoppingBag className="w-4 h-4" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-[#E58B42] text-white text-[11px] font-semibold flex items-center justify-center tabular-nums">
                {totalItems}
              </span>
            )}
          </button>

          {user ? (
            <button
              type="button"
              onClick={() => handleLinkClick('dashboard')}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#1F6B45] text-white hover:bg-[#185536] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {user.role === 'admin'
                ? 'Admin Console'
                : user.role === 'farmer'
                ? 'Farmer Hub'
                : 'My Account'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleLinkClick('auth')}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#1F6B45] text-white hover:bg-[#185536] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Login / Register
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#1F2B23]/15 text-[#1F2B23]"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#1F2B23]/10 bg-[#FBFAF5] px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.route}
              type="button"
              onClick={() => handleLinkClick(item.route)}
              className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                activeRoute === item.route
                  ? 'bg-[#DFF0C8]/70 text-[#1F6B45]'
                  : 'text-[#1F2B23]/80 hover:bg-[#1F2B23]/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
