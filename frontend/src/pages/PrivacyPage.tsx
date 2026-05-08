const LAST_UPDATED = 'May 2025';

const sections = [
  {
    title: '1. Information We Collect',
    body: [
      'When you create an account, we collect your name, email address, username, and optionally your phone number.',
      'When you place an order, we collect your shipping address, order details, and transaction identifiers.',
      'When you use our platform, we may collect usage data such as pages visited, search queries, and device information for analytics and security purposes.',
      'Sellers additionally provide store information and bank account details for payout processing.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    body: [
      'To provide and operate the Golden Knot marketplace — processing orders, managing accounts, and facilitating seller payouts.',
      'To communicate with you about your orders, account, and platform updates.',
      'To improve our platform through aggregate, anonymised analytics.',
      'To comply with legal obligations and protect against fraud and misuse.',
    ],
  },
  {
    title: '3. Data Sharing',
    body: [
      'We do not sell, rent, or trade your personal information to third parties.',
      'We share limited data with sellers only as necessary to fulfil your order (e.g., your name and shipping address).',
      'We may share data with service providers who assist us in operating our platform (e.g., hosting, payment processing) under strict confidentiality agreements.',
      'We may disclose data if required by law or to protect the rights and safety of our users.',
    ],
  },
  {
    title: '4. Data Security',
    body: [
      'We use industry-standard security measures including encrypted HTTPS connections, hashed passwords, and JWT-based authentication.',
      'We regularly review our security practices and update them as needed.',
      'Despite our best efforts, no method of transmission over the internet is 100% secure. We encourage you to use a strong, unique password.',
    ],
  },
  {
    title: '5. Cookies and Local Storage',
    body: [
      'We use browser local storage and session storage to maintain your login session and cart state.',
      'We do not currently use advertising cookies or third-party tracking pixels.',
      'You can clear your browser storage at any time, which will log you out of your account.',
    ],
  },
  {
    title: '6. Your Rights',
    body: [
      'You can view and update your account information at any time from your Account page.',
      'You can request deletion of your account and associated data by contacting our support team.',
      'You can opt out of marketing communications by contacting us directly.',
      'Depending on your jurisdiction, you may have additional rights under applicable privacy laws (e.g., GDPR, CCPA).',
    ],
  },
  {
    title: '7. Data Retention',
    body: [
      'We retain your account data for as long as your account is active.',
      'Order records are retained for a minimum of 7 years for legal and financial compliance.',
      'If you delete your account, your personal data will be removed within 30 days, except where retention is required by law.',
    ],
  },
  {
    title: '8. Children\'s Privacy',
    body: [
      'Golden Knot is not intended for users under the age of 16.',
      'We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.',
    ],
  },
  {
    title: '9. Changes to This Policy',
    body: [
      'We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting a notice on our platform.',
      'Your continued use of Golden Knot after changes are posted constitutes your acceptance of the updated policy.',
    ],
  },
  {
    title: '10. Contact Us',
    body: [
      'If you have questions about this Privacy Policy or how we handle your data, please contact us at hello@goldenknot.com.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-[#FAFAF8] min-h-screen">
      <div className="bg-[#0A0A0A] py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-[#C9A84C] text-xs font-semibold uppercase tracking-[0.3em]">Legal</span>
          <h1 className="font-display text-4xl font-bold text-white mt-3 mb-3">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12">
          <p className="text-gray-600 text-sm leading-relaxed mb-10 pb-8 border-b border-gray-100">
            At Golden Knot, your privacy matters deeply to us. This Privacy Policy explains what information
            we collect, how we use it, and what rights you have regarding your personal data. By using our
            platform, you agree to the practices described in this policy.
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

          <div className="mt-12 pt-8 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Golden Knot · hello@goldenknot.com · &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
