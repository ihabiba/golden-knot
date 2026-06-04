import { useState } from 'react';
import { Mail, MapPin, Clock, Send, Loader2, CheckCircle } from 'lucide-react';

const CONTACT_INFO = [
  {
    icon: <Mail size={20} className="text-[#C9A84C]" />,
    label: 'Email Us',
    value: 'zahidisok@gmail.com',
    sub: 'We reply within 24 hours',
  },
  {
    icon: <MapPin size={20} className="text-[#C9A84C]" />,
    label: 'Serving',
    value: 'Worldwide',
    sub: 'Artisans based in Afghanistan',
  },
  {
    icon: <Clock size={20} className="text-[#C9A84C]" />,
    label: 'Support Hours',
    value: 'Sun–Thu, 9 am–6 pm',
    sub: 'Afghanistan Standard Time (UTC+4:30)',
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => { setForm((p) => ({ ...p, [key]: e.target.value })); setErrors((p) => ({ ...p, [key]: '' })); };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Please enter your name.';
    if (!form.email.trim()) errs.email = 'Please enter your email.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.subject) errs.subject = 'Please select a subject.';
    if (!form.message.trim()) errs.message = 'Please write a message.';
    else if (form.message.trim().length < 20) errs.message = 'Message must be at least 20 characters.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1200);
  };

  const inp = (hasErr?: boolean) =>
    `w-full border rounded-xl px-4 py-3 text-sm text-[#1C1C1C] bg-white focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10 transition-colors ${hasErr ? 'border-red-300' : 'border-gray-200'}`;

  return (
    <div className="bg-[#FAFAF8] min-h-screen">

      {/* Header */}
      <div className="bg-[#0A0A0A] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-[#C9A84C] text-xs font-semibold uppercase tracking-[0.3em]">Get In Touch</span>
          <h1 className="font-display text-4xl font-bold text-white mt-3 mb-4">Contact Us</h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Questions about an order, a product, or becoming a seller? We're here to help.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-[1fr_380px] gap-12">

          {/* Contact form */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                <h3 className="font-display text-xl font-bold text-[#1C1C1C] mb-2">Message Sent!</h3>
                <p className="text-gray-500 text-sm mb-6">
                  Thank you for reaching out. We'll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="text-[#C9A84C] text-sm font-semibold hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Your Name <span className="text-red-400">*</span>
                    </label>
                    <input type="text" value={form.name} onChange={set('name')} placeholder="Ahmad Karimi" className={inp(!!errors.name)} />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className={inp(!!errors.email)} />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Subject <span className="text-red-400">*</span>
                  </label>
                  <select value={form.subject} onChange={set('subject')} className={inp(!!errors.subject)}>
                    <option value="">Select a topic</option>
                    <option>Order & Shipping</option>
                    <option>Returns & Refunds</option>
                    <option>Product Question</option>
                    <option>Becoming a Seller</option>
                    <option>Technical Support</option>
                    <option>Other</option>
                  </select>
                  {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={set('message')}
                    rows={5}
                    placeholder="Tell us how we can help…"
                    className={`${inp(!!errors.message)} resize-none`}
                  />
                  {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                  <p className="text-right text-[11px] text-gray-400 mt-1">{form.message.length} / 1000</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#C9A84C] hover:bg-[#D4B96A] disabled:opacity-60 text-black font-semibold py-3.5 rounded-xl text-sm transition-colors shadow-md"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                  {submitting ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <div className="space-y-6">
            {CONTACT_INFO.map(({ icon, label, value, sub }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
                  {icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="font-semibold text-[#1C1C1C] text-sm mt-0.5">{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}

            <div className="bg-[#0A0A0A] rounded-2xl p-6 text-white">
              <p className="font-display font-bold mb-2">Want to Sell With Us?</p>
              <p className="text-gray-400 text-sm mb-4">
                Afghan weavers can register as sellers and start listing products immediately after approval.
              </p>
              <a
                href="/register"
                className="inline-block bg-[#C9A84C] hover:bg-[#D4B96A] text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Apply as a Seller
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
