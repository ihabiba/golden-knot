const LAST_UPDATED = 'May 2025';

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: [
      'By accessing or using Golden Knot ("the Platform"), you agree to be bound by these Terms and Conditions and our Privacy Policy.',
      'If you do not agree to these terms, you must not use the Platform.',
      'We reserve the right to update these terms at any time. Continued use of the Platform after changes constitutes acceptance.',
    ],
  },
  {
    title: '2. User Accounts',
    body: [
      'You must be at least 18 years old to create an account.',
      'You are responsible for maintaining the confidentiality of your account credentials.',
      'You must provide accurate and complete information when registering. False information may result in account termination.',
      'You are responsible for all activities that occur under your account.',
    ],
  },
  {
    title: '3. Buyer Responsibilities',
    body: [
      'Buyers agree to pay for all orders they place. Fraudulent orders or chargebacks without valid reason may result in account suspension.',
      'Buyers are responsible for providing accurate shipping addresses. Golden Knot is not liable for failed deliveries due to incorrect address information.',
      'Buyers must inspect products upon receipt and report any issues within 14 days of delivery.',
    ],
  },
  {
    title: '4. Seller Responsibilities',
    body: [
      'Sellers must be verified Afghan artisans, weavers, or approved craft producers and must provide only authentic, handcrafted products.',
      'Sellers are responsible for accurate product descriptions, pricing, and stock levels.',
      'Sellers must ship orders promptly upon confirmation and update order statuses accordingly.',
      'Sellers must not list counterfeit, stolen, or prohibited items. Violations will result in immediate account termination.',
      'Sellers agree to Golden Knot\'s commission structure as communicated during onboarding.',
    ],
  },
  {
    title: '5. Prohibited Activities',
    body: [
      'You may not use the Platform for any unlawful purpose or in violation of any applicable laws or regulations.',
      'You may not attempt to gain unauthorised access to any part of the Platform or its systems.',
      'You may not post false, misleading, or defamatory content.',
      'You may not use automated bots, scrapers, or other tools to extract data from the Platform without written consent.',
      'You may not engage in price manipulation, fake reviews, or other deceptive practices.',
    ],
  },
  {
    title: '6. Intellectual Property',
    body: [
      'All content on Golden Knot — including logos, design, and code — is owned by or licensed to Golden Knot.',
      'Sellers retain ownership of their product images and descriptions but grant Golden Knot a non-exclusive licence to display this content on the Platform.',
      'You may not reproduce, distribute, or create derivative works from Platform content without written permission.',
    ],
  },
  {
    title: '7. Payments and Fees',
    body: [
      'Buyers pay the price listed at checkout. During the MVP phase, payments may be processed through Cash on Delivery or approved payment providers available on the Platform.',
      'Sellers receive payouts minus the Platform\'s commission. Payout schedules are outlined in the Seller Agreement.',
      'Golden Knot reserves the right to adjust fee structures with reasonable notice to sellers.',
      'All prices on the Platform are displayed in US Dollars (USD) unless otherwise stated.',
    ],
  },
  {
    title: '8. Returns and Disputes',
    body: [
      'Our returns policy allows buyers to request a return within 14 days of delivery for items that are damaged, defective, or materially different from their description.',
      'Disputes between buyers and sellers are mediated by Golden Knot. Our decision is final.',
      'Refunds are processed within 5–10 business days of an approved return.',
    ],
  },
  {
    title: '9. Limitation of Liability',
    body: [
      'Golden Knot acts as a marketplace platform and is not the seller of the products listed.',
      'To the maximum extent permitted by law, Golden Knot shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform.',
      'Our total liability to you for any claim shall not exceed the amount you paid for the order in question.',
    ],
  },
  {
    title: '10. Termination',
    body: [
      'We reserve the right to suspend or terminate any account at any time for violations of these Terms.',
      'You may close your account at any time from Account Settings. Pending orders must be resolved before deletion.',
      'Sections 6, 9, and 11 survive termination of these Terms.',
    ],
  },
  {
    title: '11. Governing Law',
    body: [
      'These Terms are intended for demonstration purposes during the MVP phase of the Golden Knot platform. Legal provisions may be updated as the platform expands and formal registration is completed.',
      'Any disputes should first be resolved through communication between the buyer and seller. Golden Knot may assist in mediating disputes where appropriate.',
      'These Terms do not limit any consumer protection rights you may have under the laws of your country.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="bg-[#FAFAF8] min-h-screen">
      <div className="bg-[#0A0A0A] py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-[#C9A84C] text-xs font-semibold uppercase tracking-[0.3em]">Legal</span>
          <h1 className="font-display text-4xl font-bold text-white mt-3 mb-3">Terms & Conditions</h1>
          <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12">
          <p className="text-gray-600 text-sm leading-relaxed mb-10 pb-8 border-b border-gray-100">
            These Terms and Conditions govern your access to and use of the Golden Knot marketplace.
            Please read them carefully. By registering an account or making a purchase, you confirm that
            you have read, understood, and agree to these terms.
          </p>

          <div className="space-y-10">
            {sections.map(({ title, body }) => (
              <section key={title}>
                <h2 className="font-display text-lg font-bold text-[#1C1C1C] mb-4">{title}</h2>
                <ul className="space-y-3">
                  {body.map((text, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shrink-0 mt-2" />
                      {text}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-10 p-5 bg-[#C9A84C]/8 border border-[#C9A84C]/20 rounded-xl">
            <p className="text-sm text-gray-600 leading-relaxed">
              <strong className="text-[#1C1C1C]">Platform Status:</strong> Golden Knot is currently
              operating as a pilot social-business marketplace. Certain features, policies, and
              services may evolve as the platform develops.
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Golden Knot · safnafathima441@gmail.com · &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
