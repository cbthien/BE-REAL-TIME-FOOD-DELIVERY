'use client';

import Link from 'next/link';
import { MapPin, Phone } from 'lucide-react';
import {
  FOOTER_MENU_LINKS,
  FOOTER_HELP_LINKS,
  CONTACT_INFO,
} from '@/lib/constants';

/**
 * LandingFooter Component
 * Footer with menu links, help section, and contact information
 */
export function LandingFooter() {
  const menuLinks = FOOTER_MENU_LINKS;
  const helpLinks = FOOTER_HELP_LINKS;
  const contact = CONTACT_INFO;

  return (
    <footer className="bg-gray-900 text-gray-300 py-12 lg:py-16">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">{contact.brandName.charAt(0)}</span>
              </div>
              <span className="text-xl font-bold text-white">{contact.brandName}</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              {contact.tagline}
            </p>
          </div>

          {/* Menu Section */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Menu</h3>
            <ul className="space-y-3">
              {menuLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-red-500 transition-colors inline-block hover:translate-x-1 transform duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Section (Left on desktop, shows on mobile) */}
          <div className="md:hidden">
            <h3 className="text-white font-semibold text-lg mb-4">Help</h3>
            <ul className="space-y-3">
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-red-500 transition-colors inline-block hover:translate-x-1 transform duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm">{contact.address.street}</p>
                  <p className="text-sm">{contact.address.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm">{contact.phone}</p>
              </div>
            </div>
          </div>

          {/* Help Section (Hidden on mobile, shows on desktop) */}
          <div className="hidden md:block">
            <h3 className="text-white font-semibold text-lg mb-4">Help</h3>
            <ul className="space-y-3">
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-red-500 transition-colors inline-block hover:translate-x-1 transform duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} FoodGo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
