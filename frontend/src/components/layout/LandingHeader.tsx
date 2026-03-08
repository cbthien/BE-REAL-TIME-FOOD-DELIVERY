'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, ShoppingCart, X, ChevronDown, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LandingHeader Component
 * Navigation bar for landing page with logo, menu, language switcher, and cart
 */
export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'EN' | 'VN'>('EN');

  // Navigation links
  const navLinks = [
    { href: '/promotions', label: 'Promotions' },
    { href: '/menu', label: 'Menu' },
    { href: '/about', label: 'About Us' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <span className="text-white font-bold text-xl">F</span>
            </motion.div>
            <span className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
              FoodGo
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-red-600 transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 transition-all group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Right Section: Language, User, Cart */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="relative group hidden sm:block">
              <button className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors">
                <span>{language}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute right-0 mt-2 w-24 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button
                  onClick={() => setLanguage('VN')}
                  className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-50 rounded-t-lg"
                >
                  VN
                </button>
                <button
                  onClick={() => setLanguage('EN')}
                  className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-50 rounded-b-lg"
                >
                  EN
                </button>
              </div>
            </div>

            {/* User Icon */}
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                <User className="w-5 h-5" />
              </Button>
            </Link>

            {/* Cart Button */}
            <Link href="/cart">
              <Button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-full flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden sm:inline">$45.00</span>
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-gray-200"
            >
              <div className="py-4 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="px-4 py-2">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'EN' | 'VN')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="EN">English</option>
                    <option value="VN">Tiếng Việt</option>
                  </select>
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
