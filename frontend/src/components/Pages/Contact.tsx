import React, { useState } from 'react';
import {
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { StaticPageLayout, SectionCard, InfoPill } from './StaticPageLayout';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSubmitted(true);
    setIsSubmitting(false);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        email: '',
        subject: '',
        category: 'general',
        message: ''
      });
    }, 3000);
  };

  if (submitted) {
    return (
      <StaticPageLayout
        eyebrow="Thank you"
        title="Message received"
        subtitle="We reply to every conversation within a day. Keep an eye on your inbox for updates from the Omegoo crew."
        heroIcon={
          <svg className="h-8 w-8 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        }
      >
        <SectionCard>
          <p className="text-center text-sm text-white/70">
            Need to add more detail? Hit reply on our confirmation email or drop a note to{' '}
            <a href="mailto:omegoochat@gmail.com" className="text-sky-300 underline">
              omegoochat@gmail.com
            </a>
            .
          </p>
        </SectionCard>
      </StaticPageLayout>
    );
  }

  return (
    <StaticPageLayout
      eyebrow="Support"
      title="Contact Omegoo"
      subtitle="Our team is spread across time zones, but we share one inbox. Choose the channel that works best for you and we will jump in."
      heroIcon={
        <svg className="h-8 w-8 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-7 8h8a2 2 0 002-2v-8l-4-4H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SectionCard title="Send us a message" className="h-full">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-white/60">Your name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-white/60">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-white/60">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              >
                <option value="general" className="text-slate-900">General inquiry</option>
                <option value="technical" className="text-slate-900">Technical support</option>
                <option value="safety" className="text-slate-900">Safety & moderation</option>
                <option value="feedback" className="text-slate-900">Feedback & suggestions</option>
                <option value="partnership" className="text-slate-900">Partnership</option>
                <option value="press" className="text-slate-900">Press & media</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-white/60">Subject</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                placeholder="What's this about?"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-white/60">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={6}
                className="mt-2 w-full resize-none rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                placeholder="Tell us what you need help with"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              {isSubmitting ? 'Sending…' : 'Send message'}
            </button>
          </form>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-sky-300" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-white">Live chat</h3>
                  <p className="text-sm text-white/70">Need quick guidance? Ping us from the dashboard and a moderator will join the conversation.</p>
                  <InfoPill>Response in minutes</InfoPill>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                  <EnvelopeIcon className="h-6 w-6 text-emerald-300" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-white">Email</h3>
                  <p className="text-sm text-white/70">For longer reports or attachments, email us anytime. We aim to reply within 24 hours.</p>
                  <a href="mailto:omegoochat@gmail.com" className="text-sm font-medium text-emerald-300 hover:text-emerald-200">
                    omegoochat@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                  <ExclamationTriangleIcon className="h-6 w-6 text-rose-300" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-white">Report abuse</h3>
                  <p className="text-sm text-white/70">Flag urgent safety issues directly from the chat or send us context here.</p>
                  <a href="mailto:omegoochat@gmail.com" className="text-sm font-medium text-rose-300 hover:text-rose-200">
                    omegoochat@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="FAQs" description="Answers to questions we hear most often.">
            <div className="space-y-4 text-sm text-white/70">
              <div>
                <h4 className="text-sm font-semibold text-white">Is Omegoo free?</h4>
                <p>Yes. Daily coins reset automatically—no upsells or hidden charges.</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">How do you keep people safe?</h4>
                <p>Realtime AI moderation, community reporting, and a human safety team work together.</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Can I stay anonymous?</h4>
                <p>Absolutely. Omegoo does not expose your personal details to other users.</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Where do you post updates?</h4>
                <p>All public announcements ship via Instagram <span className="font-medium text-white">@omegoo.chat</span> and the status page so you always know what changed.</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Do you offer campus partnerships?</h4>
                <p>Email <a href="mailto:omegoochat@gmail.com" className="text-sky-300 underline">omegoochat@gmail.com</a> with “Campus Program” in the subject to set up verified clubs, study rooms, or mental health drop-ins.</p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Support hours">
        <div className="grid gap-4 text-sm text-white/70 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/40">Weekdays</p>
            <p className="mt-1 text-sm font-medium text-white">9:00 AM – 6:00 PM PST</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-white/40">Weekends</p>
            <p className="mt-1 text-sm font-medium text-white">10:00 AM – 4:00 PM PST</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-white/40">Safety escalation</p>
            <p className="mt-1 text-sm font-medium text-white">Monitored 24/7</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Regional support & status" description="Where to find updates if something feels off.">
        <div className="space-y-4 text-sm text-white/70">
          <p>
            Service updates appear inside the Omegoo dashboard banner and on Instagram <span className="font-semibold text-white">@omegoo.chat</span>. Check those channels for transparent timelines, recovery notes, and release recaps.
          </p>
          <div className="grid gap-4 md:grid-cols-3 text-xs">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-white/40">India & APAC</p>
              <p className="mt-2 text-white/70">Watch @omegoo.chat Instagram stories for maintenance windows, campus collaborations, and live Q&amp;A slots tailored to IST evenings.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-white/40">Europe</p>
              <p className="mt-2 text-white/70">We publish weekly reels on @omegoo.chat recapping latency improvements, feature rollouts, and community meetups scheduled for CET.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-white/40">Americas</p>
              <p className="mt-2 text-white/70">Check @omegoo.chat feed posts and pinned highlights for deployment notices, creator spotlights, and student ambassador programs in EST/PST.</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Support playbook" description="What happens after you reach out.">
        <div className="space-y-4 text-sm text-white/70">
          <p>
            Our triage team tags every ticket within minutes. Here is the lifecycle your request follows once you click “Send”.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-white/70">
            <li>Auto-acknowledgement email confirms we received your message.</li>
            <li>Support specialists classify it as safety, product feedback, billing, or campus partnership.</li>
            <li>Relevant squads jump on calls if needed; safety issues may trigger moderator shadowing on your next session.</li>
            <li>We send resolution notes plus preventative tips, and log the insight for future roadmap prioritisation.</li>
          </ol>
          <p>
            Complex investigations include follow-up check-ins to ensure the fix worked. Never hesitate to re-open a thread—inbox continuity helps us keep context.
          </p>
        </div>
      </SectionCard>
    </StaticPageLayout>
  );
};

export default Contact;