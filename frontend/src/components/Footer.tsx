import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';

const quickLinks = [
  { label: 'About Us', to: '/about' },
  { label: 'Products', to: '/products' },
  { label: 'Contact', to: '/contact' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms & Conditions', to: '/terms' },
];

const socialLinks = [
  {
    label: 'Instagram',
    href: '#',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: '#',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: 'X / Twitter',
    href: '#',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

export default function Footer() {

  return (
    <footer className="bg-black text-white">
      {/* Top decorative strip */}
      <div className="h-px bg-linear-to-r from-transparent via-[#C9A84C] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer grid */}
        <div className="py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <span className="text-[#C9A84C] font-semibold tracking-[0.3em] text-lg uppercase">
                Golden Knot
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              A marketplace empowering Afghan women weavers to share their centuries-old
              craft with the world. Every purchase supports a skilled artisan and preserves
              a living heritage.
            </p>
            <div className="mt-6 flex items-center gap-2 text-gray-500 text-sm">
              <MapPin size={14} className="text-[#C9A84C] shrink-0" />
              <span>Serving buyers worldwide</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-gray-500 text-sm">
              <Mail size={14} className="text-[#C9A84C] shrink-0" />
              <span>hello@goldenknot.com</span>
            </div>

            {/* Social icons */}
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map(({ label, href, svg }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-gray-400 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors duration-200"
                >
                  {svg}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A84C] mb-5">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-gray-400 text-sm hover:text-white transition-colors duration-200 hover:pl-1 inline-block"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sell on Golden Knot */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A84C] mb-5">
              Sell With Us
            </h4>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Are you an Afghan weaver? Join our community of artisans and reach customers worldwide.
            </p>
            <Link
              to="/register"
              className="inline-block text-sm font-medium border border-[#C9A84C] text-[#C9A84C] px-5 py-2.5 rounded hover:bg-[#C9A84C] hover:text-black transition-colors duration-200"
            >
              Become a Seller
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} Golden Knot. All rights reserved.
          </p>
          <p className="text-gray-600 text-sm">
            Developed by{' '}
            <a
              href="https://github.com/ihabiba"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-[#C9A84C] transition-colors duration-200 font-medium"
            >
              Habiba Hassan
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
