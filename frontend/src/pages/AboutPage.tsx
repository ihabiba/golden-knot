import { Link } from 'react-router-dom';
import { Heart, Globe, Shield, Sparkles } from 'lucide-react';

const STATS = [
  { value: '200+', label: 'Artisan Weavers' },
  { value: '50+',  label: 'Weaving Patterns' },
  { value: '100%', label: 'Handcrafted' },
  { value: '✓',   label: 'Fair Trade Verified' },
];

const VALUES = [
  {
    icon: <Heart size={24} className="text-[#C9A84C]" />,
    title: 'Empowerment',
    body: 'We place Afghan women weavers at the centre of everything — giving them direct access to a global marketplace and fair compensation for their extraordinary craft.',
  },
  {
    icon: <Globe size={24} className="text-[#C9A84C]" />,
    title: 'Global Reach',
    body: 'From Kabul to Copenhagen, every purchase connects a buyer with the hands and story behind a piece. We bridge cultures through textiles.',
  },
  {
    icon: <Shield size={24} className="text-[#C9A84C]" />,
    title: 'Authenticity',
    body: 'Every seller on Golden Knot is verified. Every product is genuinely handcrafted. You are never buying mass-produced imitations.',
  },
  {
    icon: <Sparkles size={24} className="text-[#C9A84C]" />,
    title: 'Heritage Preservation',
    body: 'Afghan carpet-weaving spans centuries. We exist to ensure these traditions are not lost — they are celebrated, sold, and sustained.',
  },
];

const TEAM = [
  { name: 'Mohammad Zahid Mahmood',       role: 'Founder & Finance Lead',                       initial: 'MM' },
  { name: 'Fathima Safna Mohamed Manas',  role: 'Project Manager',                              initial: 'FM' },
  { name: 'Shukri Adam Olad',            role: 'Marketing Lead',                               initial: 'SO' },
  { name: 'Ahmad Ali Wasimi',             role: 'Community Liaison & Content Coordinator',      initial: 'AW' },
  { name: 'Alva Riansyah',               role: 'Administrative Lead',                          initial: 'AR' },
  { name: 'Saleh Ahmed Bawazeer',        role: 'Operations Coordinator',                       initial: 'SB' },
];

export default function AboutPage() {
  return (
    <div className="bg-[#FAFAF8] min-h-screen">

      {/* Hero */}
      <div className="bg-[#0A0A0A] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="hero-weave" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="20" height="20" fill="rgba(201,168,76,0.4)" />
                <rect x="20" y="20" width="20" height="20" fill="rgba(201,168,76,0.4)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-weave)" />
          </svg>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center relative">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/images/logo.jpeg"
              alt="Golden Knot"
              className="h-20 w-20 object-cover rounded-full overflow-hidden shadow-[0_0_40px_rgba(201,168,76,0.25)]"
            />
          </div>
          <span className="inline-block text-[#C9A84C] text-xs font-semibold uppercase tracking-[0.3em] mb-4">Our Story</span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Where Ancient Craft Meets<br />
            <span className="text-[#C9A84C]">Global Commerce</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Golden Knot was created to help Afghan women weavers overcome market barriers,
            earn fair income, and preserve centuries-old carpet weaving traditions through
            a dedicated digital marketplace.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="font-display text-3xl font-bold text-[#C9A84C]">{value}</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-[#C9A84C] text-xs font-semibold uppercase tracking-widest">Our Mission</span>
            <h2 className="font-display text-3xl font-bold text-[#1C1C1C] mt-3 mb-5">
              Preserving a Living Heritage
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              For generations, Afghan women weavers have preserved one of the country's most
              treasured cultural traditions through handcrafted carpets. Despite their skill
              and dedication, many artisans have faced limited market access, low incomes, and
              dependence on intermediaries.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Golden Knot was created to bridge this gap. Our platform connects Afghan artisans
              directly with buyers, allowing them to showcase their craftsmanship, share their
              stories, and earn fair compensation for their work.
            </p>
            <p className="text-gray-600 leading-relaxed">
              By combining traditional heritage with digital commerce, we aim to empower
              weavers, preserve cultural identity, and create sustainable economic opportunities
              for artisan communities.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/images/hero-bg.jpeg"
                alt="Afghan weaver at work"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#0A0A0A]/30 to-transparent" />
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#C9A84C]/10 rounded-2xl -z-10" />
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="bg-white border-t border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <span className="text-[#C9A84C] text-xs font-semibold uppercase tracking-widest">What We Stand For</span>
            <h2 className="font-display text-3xl font-bold text-[#1C1C1C] mt-3">Our Values</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-8">
            {VALUES.map(({ icon, title, body }) => (
              <div key={title} className="flex gap-5">
                <div className="w-12 h-12 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
                  {icon}
                </div>
                <div>
                  <h3 className="font-display font-bold text-[#1C1C1C] mb-2">{title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <span className="text-[#C9A84C] text-xs font-semibold uppercase tracking-widest">The People Behind It</span>
          <h2 className="font-display text-3xl font-bold text-[#1C1C1C] mt-3">Our Team</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
          {TEAM.map(({ name, role, initial }) => (
            <div key={name} className="text-center">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-[#C9A84C] to-[#8B2525] flex items-center justify-center text-white font-display text-lg font-bold mx-auto mb-3">
                {initial}
              </div>
              <p className="font-semibold text-[#1C1C1C] text-sm">{name}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#0A0A0A]">
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Ready to Own a Piece of History?
          </h2>
          <p className="text-gray-400 mb-8">
            Every rug, kilim, and cushion in our collection carries a story.
            Browse our collection and find yours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-8 py-3.5 rounded-xl text-sm transition-colors"
            >
              Shop the Collection
            </Link>
            <Link
              to="/register"
              className="border border-white/20 hover:border-[#C9A84C] text-white hover:text-[#C9A84C] font-medium px-8 py-3.5 rounded-xl text-sm transition-colors"
            >
              Sell With Us
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
