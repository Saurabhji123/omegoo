import React from 'react';
import {
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { StaticPageLayout, SectionCard } from './StaticPageLayout';

const TermsOfService: React.FC = () => {
  const corePrinciples = [
    {
      icon: <ShieldCheckIcon className="h-6 w-6 text-emerald-300" />,
      title: 'Safety first',
      description: 'Zero tolerance for harassment, abuse, or harmful content.'
    },
    {
      icon: <UserGroupIcon className="h-6 w-6 text-sky-300" />,
      title: 'Respectful community',
      description: 'Treat every conversation partner with dignity and kindness.'
    },
    {
      icon: <DocumentTextIcon className="h-6 w-6 text-indigo-300" />,
      title: 'Transparent guidelines',
      description: 'Clear policies keep expectations aligned for everyone on Omegoo.'
    },
    {
      icon: <ExclamationTriangleIcon className="h-6 w-6 text-amber-300" />,
      title: 'Fair enforcement',
      description: 'Policy violations lead to consistent actions with space for appeals.'
    }
  ];

  const prohibitedContent = [
    'Nudity or sexually explicit content',
    'Harassment, bullying, or intimidation',
    'Hate speech or discriminatory language',
    'Violence, threats, or self-harm encouragement',
    'Sharing or soliciting illegal content'
  ];

  const prohibitedAbuse = [
    'Spamming or mass messaging',
    'Impersonation or identity theft',
    'Commercial solicitation without Omegoo approval',
    'Sharing personal information of others',
    'Circumventing moderation or safety systems'
  ];

  const reportingTriggers = [
    'Nudity, sexually explicit, or exploitative content',
    'Harassment, bullying, hate speech, or intimidation',
    'Threats, promotion of violence, or self-harm encouragement',
    'Spam, scams, or unauthorized commercial activity',
    'Impersonation, fraud, or sharing illegal material'
  ];

  const termsSections: Array<{
    badge: string;
    title: string;
    content: React.ReactNode;
  }> = [
    {
      badge: '1',
      title: 'Acceptance of Terms',
      content: (
        <p className="text-sm text-white/70">
          By accessing or using Omegoo ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these
          Terms, you may not access or use the Service.
        </p>
      )
    },
    {
      badge: '2',
      title: 'Description of Service',
      content: (
        <div className="space-y-3 text-sm text-white/70">
          <p>
            Omegoo is a random video, audio, and text chat platform that connects people worldwide in a moderated, safe environment. Our goal is to make
            anonymous, respectful conversations possible in seconds.
          </p>
          <p className="font-medium text-white/80">Key features include:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Instant matching for text, audio, and video conversations</li>
            <li>Integrated user reporting and layered moderation tools</li>
            <li>Interest-based matchmaking options</li>
            <li>Privacy controls that keep personal details hidden</li>
            <li>Analytics that improve service quality without profiling individuals</li>
          </ul>
        </div>
      )
    },
    {
      badge: '3',
      title: 'Eligibility',
      content: (
        <div className="space-y-3 text-sm text-white/70">
          <p>
            <span className="font-medium text-white">Age requirements:</span> You must be at least 18 years old to use Omegoo. Users aged 13–17 may participate only with explicit
            parental consent and supervision.
          </p>
          <p>
            <span className="font-medium text-white">Legal capacity:</span> You must have the authority to enter into binding agreements in your jurisdiction.
          </p>
          <p>
            <span className="font-medium text-white">Geographic restrictions:</span> Local laws and regulations may limit availability in certain countries or territories.
          </p>
        </div>
      )
    },
    {
      badge: '3.5',
      title: 'Data Collection and Privacy',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5">
            <h4 className="text-sm font-semibold text-emerald-200">🔒 Your data, your privacy</h4>
            <p className="mt-2">
              We collect only the essentials required for authentication and service reliability. Everything else stays with you.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200/80">What we collect</p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Email address for secure login</li>
                  <li>• Display name or username</li>
                  <li>• Encrypted password credentials</li>
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-200/80">What stays private</p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Your email is never shared with other users</li>
                  <li>• Usernames remain hidden during chats</li>
                  <li>• Sessions are anonymous end to end</li>
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-200/80">Why we use it</p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Authenticate logins securely</li>
                  <li>• Send critical account alerts</li>
                  <li>• View chat history and preferences</li>
                  <li>• Protect the platform from abuse</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
              🛡️ <span className="font-semibold text-white">Anonymous by design:</span> Strangers never see your email, username, or personal information during a session.
            </div>
          </div>
        </div>
      )
    },
    {
      badge: '4',
      title: 'User Conduct & Community Guidelines',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>
            <span className="font-medium text-white">Acceptable use:</span> Omegoo thrives when everyone contributes to a welcoming environment. Keep conversations respectful, relevant,
            and safe.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-5">
              <h5 className="text-sm font-semibold text-rose-100">Content violations</h5>
              <ul className="mt-3 space-y-2 text-xs">
                {prohibitedContent.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-5">
              <h5 className="text-sm font-semibold text-amber-100">Platform abuse</h5>
              <ul className="mt-3 space-y-2 text-xs">
                {prohibitedAbuse.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      badge: '5',
      title: 'Privacy & Data Protection',
      content: (
        <div className="space-y-3 text-sm text-white/70">
          <p>Your privacy matters. Review our Privacy Policy to understand how we collect, store, and protect information.</p>
          <p>
            <span className="font-medium text-white">Data collection:</span> We gather only the minimum data necessary to operate Omegoo, including usage analytics that never identify
            individual users.
          </p>
          <p>
            <span className="font-medium text-white">Data retention:</span> Personal data stays only as long as required for service provision or legal obligations.
          </p>
        </div>
      )
    },
    {
      badge: '7',
      title: 'Safety & Moderation',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>
            <span className="font-medium text-white">Automated moderation:</span> AI-powered systems monitor conversations for policy violations in real time without storing transcripts.
          </p>
          <p>
            <span className="font-medium text-white">Human review:</span> Reports are reviewed by trained moderators within 24 hours to ensure fair enforcement.
          </p>
          <p>
            <span className="font-medium text-white">User reporting:</span> Report tools are available during and after sessions so you can flag harmful behaviour instantly.
          </p>
          <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-5">
            <h5 className="text-sm font-semibold text-sky-100">Safety features</h5>
            <ul className="mt-3 space-y-2 text-xs">
              <li>• One-tap disconnect and reporting</li>
              <li>• Automated detection of inappropriate content</li>
              <li>• Interest-based matching to improve compatibility</li>
              <li>• Community guidelines surfaced inside the product</li>
              <li>• 24/7 safety escalation coverage</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      badge: '7',
      title: 'Reporting System & Automatic Ban Policy',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>
            <span className="font-medium text-white">User empowerment:</span> Every report counts. Repeat offenders are removed quickly to protect the community.
          </p>
          <div className="space-y-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6">
            <div>
              <h5 className="text-base font-semibold text-rose-100">⚠️ Automatic ban system</h5>
              <p className="mt-2 text-sm text-white/75">
                Three unique reports trigger an automatic suspension. Severe violations or five reports lead to permanent removal.
              </p>
              <ul className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                <li className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <span className="font-semibold text-white">1st report</span>
                  <p className="mt-1 text-white/70">User receives a warning notification.</p>
                </li>
                <li className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <span className="font-semibold text-white">2nd report</span>
                  <p className="mt-1 text-white/70">Final warning issued and behaviour logged.</p>
                </li>
                <li className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <span className="font-semibold text-white">3rd report</span>
                  <p className="mt-1 text-white/70">Automatic suspension and removal from Omegoo.</p>
                </li>
              </ul>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <h6 className="text-sm font-semibold text-white">Temporary bans</h6>
                <p className="mt-2 text-xs">
                  Three reports trigger a 7-day lockout. Accounts cannot log in or access features until the ban expires. A notification is sent to the registered
                  email.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <h6 className="text-sm font-semibold text-white">Permanent bans</h6>
                <p className="mt-2 text-xs">
                  Severe incidents or five reports result in permanent termination, data deletion, and device/IP blocking. Reinstatement is not available.
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h6 className="text-sm font-semibold text-white">What triggers a report?</h6>
              <ul className="mt-2 space-y-2 text-xs">
                {reportingTriggers.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h6 className="text-sm font-semibold text-white">Appeals process</h6>
              <p className="mt-2 text-xs">
                Appeal within seven days by emailing <span className="font-semibold">omegoochat@gmail.com</span> with your account details and any supporting evidence. Reviews are completed
                within 48 hours.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h6 className="text-sm font-semibold text-white">Keeping your account in good standing</h6>
              <ul className="mt-2 space-y-2 text-xs">
                <li>• Follow all Omegoo policies</li>
                <li>• Treat others with respect and kindness</li>
                <li>• Avoid sharing explicit, violent, or hateful content</li>
                <li>• Report violations instead of escalating conflicts</li>
                <li>• Use Omegoo for genuine, human conversations</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      badge: '8',
      title: 'Account Termination',
      content: (
        <div className="space-y-3 text-sm text-white/70">
          <p>
            <span className="font-medium text-white">Voluntary termination:</span> You can leave Omegoo at any time by ceasing use of the service and deleting your account.
          </p>
          <p>
            <span className="font-medium text-white">Involuntary termination:</span> Accounts that violate Terms or endanger community safety may be suspended or removed.
          </p>
          <p>
            <span className="font-medium text-white">Appeals:</span> Submit an appeal through our support channels within 30 days for review.
          </p>
        </div>
      )
    },
    {
      badge: '9',
      title: 'Limitation of Liability',
      content: (
        <div className="space-y-3 text-sm text-white/70">
          <p>
            Omegoo is provided "as is" without warranties of any kind. We are not liable for user-generated content or interactions between users.
          </p>
          <p>
            While we prioritise safety, you engage at your own risk and should never disclose personal information during chats.
          </p>
        </div>
      )
    },
    {
      badge: '10',
      title: 'Changes to Terms',
      content: (
        <div className="space-y-3 text-sm text-white/70">
          <p>We may update these Terms periodically. Significant changes are announced via in-app notices or email.</p>
          <p>
            <span className="font-medium text-white">Effective date:</span> Updates take effect 30 days after notification unless a different timeline is specified.
          </p>
        </div>
      )
    },
    {
      badge: '11',
      title: 'Dispute Resolution & Governing Law',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>
            <span className="font-medium text-white">Good-faith dialogue first:</span> If a disagreement arises, contact us within fifteen days at{' '}
            <a href="mailto:omegoochat@gmail.com" className="text-sky-300 hover:text-sky-200">omegoochat@gmail.com</a>. Most conflicts resolve through a quick conversation with the founding team.
          </p>
          <p>
            <span className="font-medium text-white">Escalation process:</span> Should an amicable resolution fail, disputes fall under the jurisdiction of the courts in Chandigarh, India. International users agree to this venue and waive class-action rights.
          </p>
          <p>
            <span className="font-medium text-white">Arbitration option:</span> For commercial partners, binding arbitration through a mutually agreed provider keeps cases private and faster than court proceedings.
          </p>
        </div>
      )
    },
    {
      badge: '12',
      title: 'Security Commitments & Responsible Disclosure',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>
            Omegoo implements layered security—from rate-limited APIs and isolated signalling servers to encrypted WebRTC relays. When we patch vulnerabilities, changelog notes appear inside the dashboard so power users can review the fix timeline.
          </p>
          <ul className="space-y-2 text-xs text-white/70">
            <li>• Keep access tokens secret and avoid sharing sessions; suspicious logins trigger an automatic reset.</li>
            <li>• Researchers can report security issues by emailing <a href="mailto:omegoochat@gmail.com" className="text-sky-300 hover:text-sky-200">omegoochat@gmail.com</a> with subject “Responsible Disclosure”.</li>
            <li>• Critical reports acknowledged within 24 hours receive priority handling plus shout-outs (if desired) after remediation.</li>
          </ul>
          <p>
            Testing must never impact real users: avoid mass scanning, refrain from accessing personal data, and follow applicable laws. We reserve the right to pursue action against malicious activity masquerading as research.
          </p>
        </div>
      )
    },
    {
      badge: '13',
      title: 'Community Contributions & Feedback',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>
            Omegoo thrives on community insight. Feature ideas, bug reports, and curated prompts help shape upcoming releases. Contributors receive early access to pilot features and detailed changelog notes.
          </p>
          <ul className="space-y-2 text-xs text-white/70">
            <li>• Join quarterly roadmap calls by emailing <a href="mailto:omegoochat@gmail.com" className="text-sky-300 hover:text-sky-200">omegoochat@gmail.com</a> with subject “Roadmap”.</li>
            <li>• Submit detailed feedback through the in-app widget or the contact page for faster triage.</li>
            <li>• Open-source integrations appear on our GitHub once vetted for privacy and safety alignment.</li>
          </ul>
          <p>
            By sharing feedback you grant Omegoo a non-exclusive licence to implement suggestions without owing compensation, while we continue crediting community champions publicly when updates launch.
          </p>
        </div>
      )
    },
    {
      badge: '14',
      title: 'Service Availability & Maintenance Windows',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>
            Omegoo targets 99.9% uptime, yet scheduled maintenance or emergency fixes may require brief downtime. We announce windows inside the dashboard banner and on the Instagram handle <span className="font-semibold text-white">@omegoo.chat</span>.
          </p>
          <ul className="space-y-2 text-xs text-white/70">
            <li>• Planned maintenance typically runs under 30 minutes and happens during off-peak regional hours.</li>
            <li>• Critical security patches may roll out immediately; expect live notifications and staggered reconnects.</li>
            <li>• During outages, conversations remain intact—sessions resume when services return.</li>
          </ul>
          <p>
            If downtime exceeds one hour, we provide incident summaries outlining root cause, remediation steps, and prevention commitments.
          </p>
        </div>
      )
    },
    {
      badge: '15',
      title: 'Future Features, Monetisation & Virtual Goods',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>
            Omegoo is completely free today. We may introduce optional premium features or memberships in the future. Any change will keep a generous free tier and will be communicated at least 30 days in advance. The core chat experience will always remain free.
          </p>
          <ul className="space-y-2 text-xs text-white/70">
            <li>• Paid upgrades will never bypass safety requirements or reporting duties.</li>
            <li>• Virtual items remain non-transferable and carry no cash value unless regulations force otherwise.</li>
            <li>• Refund policies, regional taxes, and parental controls will be detailed before launch.</li>
          </ul>
          <p>
            Beta testers who try revenue experiments agree to share feedback and understand features may be discontinued without compensation once pilots end.
          </p>
        </div>
      )
    },
    {
      badge: '16',
      title: 'Regional Regulations & Localised Policies',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>
            Omegoo operates as an international random video, audio, and text chat platform. We map our Terms to region-specific frameworks so that students, travellers, and professionals can trust the service across borders.
          </p>
          <ul className="space-y-2 text-xs text-white/70">
            <li>• India: Compliance with IT Act, CERT guidelines, and intermediary due diligence reports filed twice a year.</li>
            <li>• United Kingdom & European Union: Online Safety Act and GDPR obligations drive data minimisation, consent prompts, and appeal pathways.</li>
            <li>• United States & Canada: COPPA safeguards block under-13 usage, while state-level privacy laws inform data retention disclosures.</li>
            <li>• Middle East & Southeast Asia: Localised community standards enforce cultural sensitivity and require explicit consent before sensitive topics.</li>
          </ul>
          <p>
            Users agree to follow their local laws in addition to these Terms. When regulations change, we roll out updated onboarding notices and keep the changelog searchable for SEO transparency.
          </p>
        </div>
      )
    },
    {
      badge: '17',
      title: 'Contact Information',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>Have questions, suggestions, or feel unsafe? Reach out anytime.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-white/50">General inquiries</p>
              <p className="mt-1 text-sm font-medium text-white">omegoochat@gmail.com</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-white/50">Safety escalations</p>
              <p className="mt-1 text-sm font-medium text-white">omegoochat@gmail.com</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <StaticPageLayout
      eyebrow="Policies"
      title="Terms of Service"
      subtitle="Building safe connections through clear guidelines and mutual respect."
      heroIcon={<DocumentTextIcon className="h-10 w-10 text-white" />}
    >
      <SectionCard className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
          <DocumentTextIcon className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">Welcome to Omegoo</h2>
        <p className="text-sm text-white/70 sm:text-base">
          These Terms explain how Omegoo works, the standards we maintain, and the responsibilities every user accepts when joining the community. Whether you launch a random video chat, host an audio hangout, or stick to text-only conversations, the same safety-first rules apply.
        </p>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-wide text-white/60">
          <span className="font-semibold text-white">Effective date:</span>
          <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </SectionCard>

      <SectionCard title="Core principles" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {corePrinciples.map((principle) => (
            <div
              key={principle.title}
              className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-indigo-950/20"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                {principle.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-white">{principle.title}</h3>
                <p className="text-sm text-white/70">{principle.description}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Comprehensive terms" className="space-y-10">
        {termsSections.map((section) => (
          <div key={section.title} className="space-y-4">
            <h3 className="flex items-center gap-3 text-lg font-semibold text-white sm:text-xl">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg" style={{ backgroundColor: 'var(--primary-brand)' }}>
                {section.badge}
              </span>
              {section.title}
            </h3>
            {section.content}
          </div>
        ))}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
          <p>
            <span className="font-semibold text-white">Legal disclaimer:</span> These Terms are governed by applicable laws and jurisdictional requirements. Continued use of Omegoo signifies
            acceptance of future updates.
          </p>
          <p className="mt-3">
            <span className="font-semibold text-white">Safety concerns:</span> Contact{' '}
            <a href="mailto:omegoochat@gmail.com" className="text-sky-300 hover:text-sky-200">
              omegoochat@gmail.com
            </a>{' '}
            if you feel unsafe or need immediate assistance.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Need help or want to appeal?" className="space-y-3 text-sm text-white/70">
        <p>
          Reach the Omegoo safety desk or support team anytime at{' '}
          <a href="mailto:omegoochat@gmail.com" className="text-sky-300 hover:text-sky-200">
            omegoochat@gmail.com
          </a>
          .
        </p>
        <p>
          Appeals should include your account email, the ban reason (if provided), and context explaining why the action should be reconsidered. We reply within 48
          hours.
        </p>
      </SectionCard>
    </StaticPageLayout>
  );
};

export default TermsOfService;
