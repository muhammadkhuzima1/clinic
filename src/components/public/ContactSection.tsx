import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, MessageSquare } from 'lucide-react';
import { CLINIC_INFO } from '../../data/mockData';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    department: 'General Inquiry',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        department: 'General Inquiry',
        message: '',
      });
    }, 600);
  };

  return (
    <section id="contact-section" className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/60">
            Get In Touch
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            We Are Here To Assist You
          </h2>
          <p className="text-slate-600 mt-3 text-base">
            Have a question regarding specialist schedules, lab tests, or medical reports? Send us a message or call our helpdesk directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Contact Details & Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Direct Contacts</h3>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium">Clinic Reception Phone</span>
                  <p className="text-sm font-bold text-slate-900">{CLINIC_INFO.phone}</p>
                  <span className="text-xs text-slate-400">Available during regular OPD hours</span>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium">WhatsApp Helpdesk</span>
                  <p className="text-sm font-bold text-slate-900">{CLINIC_INFO.whatsapp}</p>
                  <span className="text-xs text-slate-400">Quick report sharing & guidance</span>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium">Official Email</span>
                  <p className="text-sm font-bold text-slate-900">{CLINIC_INFO.email}</p>
                  <span className="text-xs text-slate-400">Inquiries answered within 24 hours</span>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium">Physical Address</span>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium mt-0.5">{CLINIC_INFO.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Working Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Send an Inquiry to Reception</h3>
            <p className="text-xs text-slate-500 mb-6">
              Fill in your details below and our patient coordination team will get back to you promptly.
            </p>

            {submitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-emerald-900">Message Received!</h4>
                <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                  Thank you for reaching out to Nowshera Family Clinic. Our staff will review your inquiry and contact your provided phone number shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-2 text-xs font-semibold text-emerald-800 bg-white px-4 py-2 rounded-lg border border-emerald-200 hover:bg-emerald-50"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tariq Mehmood"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +92 300 1234567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department / Concern
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Doctor Availability">Doctor Availability</option>
                      <option value="Laboratory Test Inquiries">Laboratory Test Inquiries</option>
                      <option value="Ultrasound & ECG">Ultrasound & ECG</option>
                      <option value="Home Sample Collection">Home Sample Collection</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Message / Question *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your health question or inquiry in detail..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 shadow-sm transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Sending Inquiry...' : 'Submit Inquiry'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
