import React from 'react';
import {
  ShieldCheckIcon,
  EyeIcon,
  LockClosedIcon,
  ServerIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { StaticPageLayout, SectionCard } from './StaticPageLayout';

const PrivacyPolicy: React.FC = () => {
  const principles = [
    {
      icon: <EyeIcon className="h-6 w-6 text-rose-300" />,
      title: 'Zero tracking',
      description: 'No cookies, analytics scripts, or behavioural profiling—ever.'
    },
    {
      icon: <LockClosedIcon className="h-6 w-6 text-sky-300" />,
      title: 'Complete anonymity',
      description: 'Chat without exposing email addresses, usernames, or device fingerprints.'
    },
    {
      icon: <ServerIcon className="h-6 w-6 text-emerald-300" />,
      title: 'Temporary infrastructure',
      description: 'Conversations never touch permanent storage and expire within seconds.'
    },
    {
      icon: <GlobeAltIcon className="h-6 w-6 text-violet-300" />,
      title: 'Global compliance',
      description: 'Built to exceed GDPR, CCPA, and international privacy expectations.'
    }
  ];

  const sections: Array<{
    badge: string;
    title: string;
    content: React.ReactNode;
  }> = [
    {
      badge: '1',
      title: 'Data we never collect',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>
            Omegoo is designed around privacy-first defaults. We do not collect personal identifiers, conversation content, or behavioural history.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4">
              <h4 className="text-sm font-semibold text-rose-100">Personal information</h4>
              <ul className="mt-2 space-y-2 text-xs">
                <li>• Names, usernames, nicknames, or social handles</li>
                <li>• Email addresses or phone numbers shared between users</li>
                <li>• Photos, videos, or media uploads</li>
                <li>• Location data, GPS coordinates, or IP-based profiling</li>
              </ul>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
              <h4 className="text-sm font-semibold text-amber-100">Content & behaviour</h4>
              <ul className="mt-2 space-y-2 text-xs">
                <li>• Chat transcripts, voice recordings, or video streams</li>
                <li>• Conversation history or activity timelines</li>
                <li>• Browsing behaviour across Omegoo or other sites</li>
                <li>• Marketing profiles or advertising segments</li>
              </ul>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
            <h4 className="text-sm font-semibold text-emerald-100">Minimal technical data</h4>
            <p className="mt-2 text-xs text-white/70">
              For reliability we temporarily process anonymous session tokens, high-level device type (mobile/desktop), general region for routing, and connection quality metrics. Everything auto-expires within seconds of disconnect.
            </p>
          </div>
        </div>
      )
    },
    {
      badge: '2',
      title: 'How we use minimal data',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>Essential data supports matching, safety, and service quality without storing conversation content.</p>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-4">
              <h5 className="text-sm font-semibold text-sky-100">Instant service operation</h5>
              <ul className="mt-2 space-y-2 text-xs">
                <li>• Match users anonymously in real time</li>
                <li>• Optimise routes for latency and stability</li>
                <li>• Balance global server load</li>
                <li>• Maintain uptime during traffic spikes</li>
              </ul>
            </div>
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <h5 className="text-sm font-semibold text-emerald-100">Anonymous safety monitoring</h5>
              <ul className="mt-2 space-y-2 text-xs">
                <li>• AI moderation scans for policy violations without logging content</li>
                <li>• Real-time disconnects protect users from abuse</li>
                <li>• Automated report triggers escalate urgent cases</li>
                <li>• Human moderators review flagged sessions within 24 hours</li>
              </ul>
            </div>
            <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-4">
              <h5 className="text-sm font-semibold text-violet-100">Service improvement</h5>
              <ul className="mt-2 space-y-2 text-xs">
                <li>• Measure anonymous connection success rates</li>
                <li>• Track device and bandwidth trends to improve performance</li>
                <li>• Monitor mode popularity to plan capacity</li>
                <li>• Never build individual usage profiles</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      badge: '3',
      title: 'Ultra-secure architecture',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>Security is layered into every part of Omegoo&rsquo;s infrastructure.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h5 className="text-sm font-semibold text-white">Zero permanent storage</h5>
              <ul className="mt-2 space-y-2 text-xs">
                <li>• Text, audio, and video sessions never touch disk</li>
                <li>• Session tokens delete immediately on disconnect</li>
                <li>• Connection metadata auto-clears in under 60 seconds</li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h5 className="text-sm font-semibold text-white">Instant deletion</h5>
              <ul className="mt-2 space-y-2 text-xs">
                <li>• Temporary data purged seconds after each chat ends</li>
                <li>• No manual intervention required—deletion is automatic</li>
                <li>• Email requests honoured within 24 hours for any residual system logs</li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h5 className="text-sm font-semibold text-white">Encryption & protection</h5>
              <ul className="mt-2 space-y-2 text-xs">
                <li>• TLS 1.3 and WSS secure every connection</li>
                <li>• AES-256 encryption with perfect forward secrecy</li>
                <li>• DDoS mitigation, intrusion detection, and continuous monitoring</li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h5 className="text-sm font-semibold text-white">Infrastructure</h5>
              <ul className="mt-2 space-y-2 text-xs">
                <li>• Tier-4 data centres with 24/7 monitoring</li>
                <li>• SOC 2 aligned operational controls</li>
                <li>• Multi-factor access for internal tooling</li>
                <li>• Global edge nodes for low-latency connections</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      badge: '4',
      title: 'Zero tracking & cookies',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>Omegoo refuses to monetise attention. Your browsing remains invisible to advertisers and third parties.</p>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4">
              <h5 className="text-sm font-semibold text-rose-100">Zero tracking cookies</h5>
              <ul className="mt-2 space-y-2 text-xs">
                <li>• No behavioural tracking or retargeting</li>
                <li>• No advertising pixels or fingerprinting</li>
                <li>• No cross-site analytics or remarketing</li>
              </ul>
            </div>
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <h5 className="text-sm font-semibold text-emerald-100">Essential only</h5>
              <ul className="mt-2 space-y-2 text-xs">
                <li>• Session cookies support authentication only</li>
                <li>• Security preferences stored briefly then cleared</li>
                <li>• All cookies auto-expire at session end</li>
              </ul>
            </div>
            <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-4">
              <h5 className="text-sm font-semibold text-sky-100">No analytics vendors</h5>
              <ul className="mt-2 space-y-2 text-xs">
                <li>• No Google Analytics, Meta Pixel, or third-party scripts</li>
                <li>• Performance metrics monitored in-house only</li>
                <li>• Cookie banner unnecessary because nothing tracks you</li>
              </ul>
            </div>
          </div>
          <div className="rounded-xl border border-yellow-400/30 bg-yellow-500/10 p-4 text-xs">
            <strong className="text-white">Cookie transparency:</strong> The few technical cookies we set exist solely to keep you connected securely and are deleted automatically when you close the browser.
          </div>
        </div>
      )
    },
    {
      badge: '5',
      title: 'Zero third-party sharing',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>Omegoo data never leaves our controlled infrastructure.</p>
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4">
            <h5 className="text-sm font-semibold text-red-100">Complete independence</h5>
            <ul className="mt-2 space-y-2 text-xs">
              <li>• No social media integrations or login providers</li>
              <li>• No advertising networks, affiliates, or data brokers</li>
              <li>• No payment processors (Omegoo is 100% free)</li>
              <li>• No CDN tracking or external analytics</li>
            </ul>
          </div>
          <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-4">
            <h5 className="text-sm font-semibold text-blue-100">Trusted infrastructure partners</h5>
            <p className="mt-2 text-xs text-white/70">
              We use enterprise-grade hosting with strict contractual controls. Providers cannot decrypt traffic, inspect content, or reuse metadata.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
            <h5 className="text-sm font-semibold text-emerald-100">Local AI moderation</h5>
            <ul className="mt-2 space-y-2 text-xs">
              <li>• All models run on Omegoo servers with zero external API calls</li>
              <li>• Content checks happen in-memory and are not stored</li>
              <li>• Multi-layer isolation prevents data exfiltration</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      badge: '6',
      title: 'Your control & data rights',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>You control what little data exists. Most users remain completely anonymous from start to finish.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <h5 className="text-sm font-semibold text-emerald-100">Anonymity by default</h5>
              <ul className="mt-2 space-y-2 text-xs">
                <li>• Explore without creating an account</li>
                <li>• Authentication optional for saving preferences and future premium features</li>
                <li>• Your identity never surfaces to chat partners</li>
                <li>• Device fingerprints are not stored or monetised</li>
              </ul>
            </div>
            <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-4">
              <h5 className="text-sm font-semibold text-sky-100">Data rights</h5>
              <ul className="mt-2 space-y-2 text-xs">
                <li>• Request access to the minimal account data we hold</li>
                <li>• Ask for corrections or deletion via <a href="mailto:omegoochat@gmail.com" className="text-sky-200 underline">omegoochat@gmail.com</a></li>
                <li>• Opt out of moderation review once a case is closed</li>
                <li>• Receive responses within 48 hours—faster for safety reports</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      badge: '7',
      title: 'Youth safety & eligibility',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>Omegoo is primarily for adults, with strict rules to protect younger audiences.</p>
          <ul className="space-y-2 text-xs">
            <li>• Core platform for 18+ users. Ages 13–17 require verifiable parental consent and supervision.</li>
            <li>• Under-13 access is blocked automatically through safety filters and manual audits.</li>
            <li>• Reports concerning minors are prioritised and handled immediately.</li>
          </ul>
          <div className="rounded-xl border border-purple-400/30 bg-purple-500/10 p-4">
            <h5 className="text-sm font-semibold text-purple-100">Guidance for parents & guardians</h5>
            <ul className="mt-2 space-y-2 text-xs">
              <li>• Monitor online activity and use parental control software</li>
              <li>• Educate teens about respectful behaviour and privacy risks</li>
              <li>• Contact <a href="mailto:omegoochat@gmail.com" className="text-purple-200 underline">omegoochat@gmail.com</a> to report underage use</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      badge: '8',
      title: 'Contact & support',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>Transparency matters. Reach out at any time and a real human will respond.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-4">
              <h5 className="text-sm font-semibold text-blue-100">Dedicated inboxes</h5>
              <ul className="mt-2 space-y-2 text-xs">
                <li>• Privacy questions: <a href="mailto:omegoochat@gmail.com" className="text-blue-200 underline">omegoochat@gmail.com</a></li>
                <li>• Safety & abuse: <a href="mailto:omegoochat@gmail.com" className="text-blue-200 underline">omegoochat@gmail.com</a></li>
                <li>• General support: <a href="mailto:omegoochat@gmail.com" className="text-blue-200 underline">omegoochat@gmail.com</a></li>
              </ul>
            </div>
            <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-4">
              <h5 className="text-sm font-semibold text-violet-100">Response times</h5>
              <ul className="mt-2 space-y-2 text-xs">
                <li>• Safety escalations: within 24 hours</li>
                <li>• Privacy requests: within 48 hours</li>
                <li>• General feedback: within 72 hours</li>
              </ul>
            </div>
          </div>
          <div className="rounded-xl border border-slate-400/30 bg-slate-500/10 p-4 text-xs">
            <strong className="text-white">Policy updates:</strong> Major changes appear in-app with a 30-day notice period. Version history stays accessible for reference.
          </div>
        </div>
      )
    },
    {
      badge: '9',
      title: 'Copyright & enforcement',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>Omegoo&rsquo;s code, brand, and product design are protected worldwide. Copying or cloning triggers immediate legal action.</p>
          <div className="rounded-xl border border-red-500/40 bg-red-600/20 p-4 text-xs text-white/80">
            <strong className="text-white">Strict enforcement:</strong> DMCA takedowns, civil litigation, statutory damages, domain seizure, and permanent blacklisting await infringers. Complaints are irreversible once filed.
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-orange-400/30 bg-orange-500/10 p-4">
              <h5 className="text-sm font-semibold text-orange-100">Protected assets</h5>
              <ul className="mt-2 space-y-2 text-xs">
                <li>• Frontend and backend source code</li>
                <li>• UI/UX design, animations, and copy</li>
                <li>• Omegoo name, logo, and brand marks</li>
                <li>• Matching algorithms and moderation pipeline</li>
              </ul>
            </div>
            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4">
              <h5 className="text-sm font-semibold text-rose-100">Prohibited actions</h5>
              <ul className="mt-2 space-y-2 text-xs">
                <li>• Cloning, scraping, or reverse engineering</li>
                <li>• Reselling or distributing Omegoo assets</li>
                <li>• Using the Omegoo mark without permission</li>
                <li>• Claiming ownership of Omegoo features or design</li>
              </ul>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs">
            <p>
              Report infringement: <a href="mailto:omegoochat@gmail.com" className="text-sky-300 underline">omegoochat@gmail.com</a> (subject: “Copyright Infringement Report”).
              Include the offending URL, evidence, and contact details. Licensing requests undergo strict review and are rarely approved.
            </p>
          </div>
        </div>
      )
    },
    {
      badge: '10',
      title: 'Law enforcement & emergency requests',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>
            Omegoo cooperates with lawful investigations while protecting anonymous users. Requests must cite jurisdiction, relevant statutes, and include formal documentation.
          </p>
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-xs">
            <p className="font-semibold text-amber-50">What we require</p>
            <ul className="mt-2 space-y-1">
              <li>• Court order, warrant, or government-issued preservation request</li>
              <li>• Clear identifiers (session timestamp, device token) so we can locate transient logs</li>
              <li>• Contact information for the requesting officer or agency</li>
            </ul>
          </div>
          <p>
            Emergency disclosures follow the same pathway but receive priority triage. Email <a href="mailto:omegoochat@gmail.com" className="text-sky-300 underline">omegoochat@gmail.com</a> with subject line “Emergency Request” and we will acknowledge within one hour.
          </p>
        </div>
      )
    },
    {
      badge: '11',
      title: 'Data residency & retention map',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>
            Although Omegoo avoids permanent storage, supporting services operate in multiple regions for redundancy. None of these zones receive chat transcripts, but we document where encrypted telemetry flows for compliance audits.
          </p>
          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <p className="font-semibold text-emerald-100">Primary (Mumbai, India)</p>
              <p className="mt-2 text-white/70">Authentication, user preferences, and moderation queues live here with strict physical security.</p>
            </div>
            <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-4">
              <p className="font-semibold text-sky-100">Secondary (Frankfurt, EU)</p>
              <p className="mt-2 text-white/70">Failover infrastructure satisfies GDPR residency for European users when required.</p>
            </div>
            <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-4">
              <p className="font-semibold text-violet-100">Edge nodes (Global)</p>
              <p className="mt-2 text-white/70">Transient WebRTC relays located worldwide flush buffers immediately after each session.</p>
            </div>
          </div>
          <p>
            Retention windows remain short: authentication logs clear after 30 days, moderation artefacts after 90 days, and billing audit trails (when monetisation launches) after statutory requirements are met.
          </p>
        </div>
      )
    },
    {
      badge: '12',
      title: 'Privacy across chat modes',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>
            Text, audio, and video all follow the same privacy promise while leveraging distinct safeguards that map to Omegoo features.
          </p>
          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4">
              <p className="font-semibold text-rose-100">Text chat</p>
              <ul className="mt-2 space-y-2">
                <li>• Auto-deletes after delivery—no transcript storage.</li>
                <li>• AI nudges flag harmful language without logging content.</li>
                <li>• Session ratings help improve matching quality.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-4">
              <p className="font-semibold text-sky-100">Audio chat</p>
              <ul className="mt-2 space-y-2">
                <li>• WebRTC streams stay peer-to-peer; Omegoo never records.</li>
                <li>• Real-time transcription is ephemeral and purged within seconds.</li>
                <li>• Mute & mirror tools live entirely in the client—no server logs.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <p className="font-semibold text-emerald-100">Video chat</p>
              <ul className="mt-2 space-y-2">
                <li>• Background blur runs locally; pixels never leave your device.</li>
                <li>• Snapshot reporting uploads encrypted stills only when you confirm.</li>
                <li>• Safety timers auto-end inactive calls to protect your privacy.</li>
              </ul>
            </div>
          </div>
          <p>
            Opt into new beta features—like shared whiteboards or language coaches—through in-app toggles. Each experiment ships with its own mini privacy summary before activation.
          </p>
        </div>
      )
    },
    {
      badge: '13',
      title: 'Honouring access, export, and deletion requests',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>
            Although Omegoo stores very little, you still control what exists. Submit requests by emailing <a href="mailto:omegoochat@gmail.com" className="text-sky-300 underline">omegoochat@gmail.com</a> with the subject “Data Request”.
          </p>
          <ul className="space-y-2 text-xs text-white/70">
            <li>• Access: We send a summary of the minimal account metadata (email, usage history) within 48 hours.</li>
            <li>• Export: Data ships in JSON and CSV formats, covering authentication logs and moderator decisions tied to your account.</li>
            <li>• Deletion: We queue erasure immediately and confirm once authentication tokens, device fingerprints, and historical flags are scrubbed.</li>
          </ul>
          <p>
            You may appoint an authorised agent; we will request written consent and proof of identity before processing on your behalf.
          </p>
        </div>
      )
    },
    {
      badge: '14',
      title: 'Automated decision-making transparency',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>
            Omegoo uses automation to detect harmful behaviour and pace the match queue, but humans remain in the loop for meaningful decisions.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">Automated actions</p>
              <ul className="mt-2 space-y-2">
                <li>• Temporary disconnects when AI hears policy-violating language.</li>
                <li>• Session quality ratings help improve matching algorithms.</li>
                <li>• Queue throttling when devices show suspicious multi-login patterns.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">Human oversight</p>
              <ul className="mt-2 space-y-2">
                <li>• Moderators review every ban longer than 24 hours.</li>
                <li>• Appeals receive fresh human evaluation, never just a replay of algorithmic scores.</li>
                <li>• Product teams audit models monthly to check for cultural or gender bias.</li>
              </ul>
            </div>
          </div>
          <p>
            If an automated decision affects you, contact us for an explanation and manual review. We are committed to transparency, fairness, and continuous improvement.
          </p>
        </div>
      )
    },
    {
      badge: '15',
      title: 'International data transfers & hosting partners',
      content: (
        <div className="space-y-4 text-sm text-white/70">
          <p>
            Omegoo keeps conversations as close to users as possible while respecting cross-border privacy laws. When traffic jumps between regions, we rely on zero-knowledge relays and strong encryption to protect anonymity.
          </p>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs">
            <p className="font-semibold text-white">How transfers work</p>
            <ul className="mt-2 space-y-2">
              <li>• WebRTC relays run in data centres certified under ISO/IEC 27001 and SOC 2 Type II.</li>
              <li>• Standard Contractual Clauses govern EU-to-India transfers until a new adequacy mechanism exists.</li>
              <li>• We do not rely on cloud vendors for analytics—only for transient connection routing.</li>
            </ul>
          </div>
          <p>
            Country-specific addenda (Brazil LGPD, Australia Privacy Act, Singapore PDPA) are available upon request for enterprise or campus deployments. Email <a href="mailto:omegoochat@gmail.com" className="text-sky-300 underline">omegoochat@gmail.com</a> with “Data Addendum” in the subject to start the review.
          </p>
        </div>
      )
    }
  ];

  return (
    <StaticPageLayout
      eyebrow="Trust & transparency"
      title="Privacy Policy"
      subtitle="Your privacy is our foundation. We are transparent about the limited data we handle and how we protect every connection."
      heroIcon={<ShieldCheckIcon className="h-10 w-10 text-white" />}
    >
      <SectionCard className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
          <ShieldCheckIcon className="h-8 w-8 text-white" />
        </div>
        <p className="text-sm text-white/70 sm:text-base">
          Omegoo treats privacy as a non-negotiable right. This policy shares exactly what we collect (very little), what we never touch, and the safeguards that keep every chat safe.
        </p>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-wide text-white/60">
          <span className="font-semibold text-white">Last updated:</span>
          <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </SectionCard>

      <SectionCard title="Our privacy principles" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {principles.map((principle) => (
            <div
              key={principle.title}
              className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-indigo-950/20"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                {principle.icon}
              </div>
              <div className="space-y-2 text-left">
                <h3 className="text-base font-semibold text-white">{principle.title}</h3>
                <p className="text-sm text-white/70">{principle.description}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Policy details" className="space-y-10">
        {sections.map((section) => (
          <div key={section.title} className="space-y-4">
            <h3 className="flex items-center gap-3 text-lg font-semibold text-white sm:text-xl">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-sm font-bold text-white shadow-lg shadow-indigo-900/40">
                {section.badge}
              </span>
              {section.title}
            </h3>
            {section.content}
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Questions or feedback?" className="space-y-3 text-sm text-white/70">
        <p>
          Reach the privacy team at <a href="mailto:omegoochat@gmail.com" className="text-sky-300 hover:text-sky-200">omegoochat@gmail.com</a>. We handle every message personally and respond quickly to safety reports.
        </p>
        <p>Thank you for trusting Omegoo. We built this platform to prove meaningful connections can stay private, safe, and human.</p>
      </SectionCard>
    </StaticPageLayout>
  );
};

export default PrivacyPolicy;
