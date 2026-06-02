import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FAQItem { q: string; a: string }
interface FAQSection { section: string; items: FAQItem[] }

const FAQ_DATA: FAQSection[] = [
  {
    section: 'Buying & Orders',
    items: [
      {
        q: 'How do I place an order?',
        a: 'Browse our collection, add items to your cart, and proceed to checkout. Enter your shipping address, review your order, and confirm. Payment is collected on delivery.',
      },
      {
        q: 'Can I buy from multiple sellers in one order?',
        a: 'Yes. Your cart can contain products from different sellers. At checkout, everything is processed as a single order.',
      },
      {
        q: 'How long does shipping take?',
        a: 'Delivery times vary by seller location and your destination. Most orders from Afghanistan take 7–21 business days internationally. Sellers provide estimated dispatch times on their product pages.',
      },
      {
        q: 'How do I track my order?',
        a: 'After placing an order, visit My Orders in your account. Order status is updated by the seller as your item progresses from processing to shipped to delivered.',
      },
      {
        q: 'Can I cancel or modify my order?',
        a: 'You can request a cancellation while your order is still in \'Pending\' status. Once confirmed or shipped, cancellations must be requested through our support team.',
      },
      {
        q: 'Do you offer promo codes?',
        a: 'Yes! Check our newsletter and social media for active codes. At checkout, enter your code in the promo field on the cart page. Current codes: WELCOME10 (10% off) and GOLDEN20 (20% off on orders over $100).',
      },
    ],
  },
  {
    section: 'Products & Authenticity',
    items: [
      {
        q: 'Are all products genuinely handmade?',
        a: 'Absolutely. Every seller on Golden Knot is verified, and every product must pass admin review before going live. We do not allow machine-made or mass-produced items.',
      },
      {
        q: 'Why do handmade rugs vary slightly from their photos?',
        a: 'That\'s the beauty of handcraft. Small variations in colour, pattern, and size are natural in hand-knotted textiles and are a sign of authenticity, not a defect.',
      },
      {
        q: 'What types of products are sold?',
        a: 'We specialise in Afghan handcrafted textiles: rugs, kilims, cushions, wall hangings, and other woven pieces. Categories are growing as more artisans join.',
      },
      {
        q: 'Can I request a custom piece?',
        a: 'Custom orders are handled directly between buyer and seller. Use the contact form to reach out and we\'ll connect you with an artisan who can accommodate your request.',
      },
    ],
  },
  {
    section: 'Returns & Refunds',
    items: [
      {
        q: 'What is the return policy?',
        a: 'Returns are accepted within 14 days of delivery for items that arrive damaged, defective, or significantly different from their description. Please contact support with photos.',
      },
      {
        q: 'How are refunds processed?',
        a: 'Approved refunds are processed within 5–10 business days to your original payment method. Once payment gateway integration is complete, this will be fully automated.',
      },
    ],
  },
  {
    section: 'Selling on Golden Knot',
    items: [
      {
        q: 'Who can sell on Golden Knot?',
        a: 'We welcome Afghan women weavers and verified Afghan textile artisans. Register as a seller, complete your profile, and our team will review and approve your store.',
      },
      {
        q: 'Is there a fee to sell?',
        a: 'Golden Knot takes a small platform commission on each sale. Exact rates are communicated during the seller onboarding process. There are no upfront listing fees.',
      },
      {
        q: 'How do I get paid?',
        a: 'Once your order is delivered and confirmed, you can request a payout from your Seller Dashboard under the Earnings section. Payouts are processed within 3–5 business days.',
      },
      {
        q: 'My seller application was rejected. What should I do?',
        a: 'Applications are reviewed by our team. If rejected, contact support with your application details — we may be able to help you meet the requirements.',
      },
    ],
  },
  {
    section: 'Account & Security',
    items: [
      {
        q: 'How do I reset my password?',
        a: 'On the login page, click "Forgot password?" and enter your email. You\'ll receive a secure reset link within a few minutes. You can also change your password anytime from Account → Settings → Change Password.',
      },
      {
        q: 'Is my personal data safe?',
        a: 'Yes. We use industry-standard security practices including JWT authentication, encrypted connections, and we never share your personal data with third parties. See our Privacy Policy for full details.',
      },
      {
        q: 'Can I have multiple accounts?',
        a: 'One account per person. If you need to switch between customer and seller roles, you can request a role upgrade from our support team.',
      },
    ],
  },
];

function AccordionItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
      >
        <span className={`text-sm font-semibold leading-relaxed transition-colors ${isOpen ? 'text-[#C9A84C]' : 'text-[#1C1C1C] group-hover:text-[#C9A84C]'}`}>
          {q}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-gray-400 transition-transform duration-200 mt-0.5 ${isOpen ? 'rotate-180 text-[#C9A84C]' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="pb-5">
          <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const toggle = (key: string) => setOpenKey((prev) => (prev === key ? null : key));

  return (
    <div className="bg-[#FAFAF8] min-h-screen">

      {/* Header */}
      <div className="bg-[#0A0A0A] py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-[#C9A84C] text-xs font-semibold uppercase tracking-[0.3em]">Help Centre</span>
          <h1 className="font-display text-4xl font-bold text-white mt-3 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-400">
            Find answers to the most common questions about buying, selling, and using Golden Knot.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-10">
        {FAQ_DATA.map(({ section, items }) => (
          <div key={section}>
            <h2 className="font-display text-lg font-bold text-[#1C1C1C] mb-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-gray-200" />
              {section}
              <span className="h-px flex-1 bg-gray-200" />
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 px-6">
              {items.map((item, i) => {
                const key = `${section}-${i}`;
                return (
                  <AccordionItem
                    key={key}
                    q={item.q}
                    a={item.a}
                    isOpen={openKey === key}
                    onToggle={() => toggle(key)}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Still need help */}
        <div className="bg-[#0A0A0A] rounded-2xl p-8 text-center">
          <p className="font-display text-xl font-bold text-white mb-2">Still have a question?</p>
          <p className="text-gray-400 text-sm mb-6">
            Our support team is available Sunday–Thursday, 9 am–6 pm Afghanistan time.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
