import React from 'react';
import {
  ShieldCheckIcon,
  HeartIcon,
  UserGroupIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  StaticPageLayout,
  SectionCard,
  InfoPill,
  ThemedList,
  HighlightStat
} from './StaticPageLayout';

const principles = [
  {
    icon: ShieldCheckIcon,
    title: 'Respect First',
    blurb: 'Every connection begins with mutual respect and active consent.'
  },
  {
    icon: HeartIcon,
    title: 'Protect Privacy',
    blurb: 'Keep personal details, locations, and contact info off the platform.'
  },
  {
    icon: UserGroupIcon,
    title: 'Shared Responsibility',
    blurb: 'Look out for one another—flag behaviour that puts people at risk.'
  },
  {
    icon: ExclamationTriangleIcon,
    title: 'Swift Action',
    blurb: 'Reports trigger immediate review with removal, bans, and escalations when required.'
  }
];

const safetySections = [
  {
    title: 'Personal Safety Practices',
    description: 'Simple habits that keep your identity protected while you chat.',
    items: [
      {
        title: 'Keep identifying details private',
        content: (
          <>
            Never share your full name, address, phone number, social handles, bank details, or any other information
            that can be used to locate you offline.
          </>
        )
      },
      {
        title: 'Use Omegoo tools instead of third-party links',
        content: (
          <>
            Decline requests to move to other platforms, download files, or click on unfamiliar links. Staying inside
            Omegoo keeps our safety tooling active.
          </>
        )
      },
      {
        title: 'Trust your instincts',
        content: 'If something feels uncomfortable, disconnect immediately and let us know through the report flow.'
      }
    ]
  },
  {
    title: 'Device & Environment Checklist',
    description: 'Simple technical steps that make sessions smoother and harder to disrupt.',
    items: [
      {
        title: 'Use trusted devices',
        content:
          'Choose a personal device with the latest OS updates. Shared computers can retain cached data or expose your session history.'
      },
      {
        title: 'Secure your network',
        content:
          'Prefer private Wi-Fi or mobile hotspots. If you must use public networks, enable a VPN and avoid sharing screens.'
      },
      {
        title: 'Keep software current',
        content:
          'Update browsers, camera drivers, and antivirus tools weekly so security patches land before bad actors exploit them.'
      }
    ]
  },
  {
    title: 'Pre-Session Personal Checklist',
    description: 'A one-minute ritual before tapping “Find Match” keeps each chat comfortable and in your control.',
    items: [
      {
        title: 'Set conversation goals',
        content:
          'Decide whether you want a light chat, study buddy, or accountability partner. Sharing intentions early reduces mismatched expectations.'
      },
      {
        title: 'Scan your space',
        content:
          'Remove documents, IDs, or uniforms from camera view. If you are in a hostel or café, use earphones and enable background blur.'
      },
      {
        title: 'Check your mood',
        content:
          'If you feel anxious or drained, try the breathing timer in the Omegoo sidebar first. Entering calmer helps you spot red flags faster.'
      }
    ]
  },
  {
    title: 'Healthy Conversation Guidelines',
    description: 'Create welcoming spaces so everyone can enjoy their session.',
    items: [
      {
        title: 'Lead with empathy',
        content: 'Check in on how the other person feels and respect boundaries the moment they are voiced.'
      },
      {
        title: 'Keep topics age-appropriate',
        content: 'Sexual content, hate speech, harassment, or glorifying violence leads to instant bans.'
      },
      {
        title: 'You can leave at any time',
        content: 'Ending a session is always acceptable. There is no expectation to stay if the vibe shifts.'
      }
    ]
  },
  {
    title: 'Spotting Red Flags',
    description: 'Know the behaviours that violate our code of conduct.',
    items: [
      {
        title: 'Fishing for personal data',
        content: 'Repeated questions about where you live, study, or work count as suspicious behaviour.'
      },
      {
        title: 'Pressure tactics',
        content: 'Anyone pushing you to share photos, switch apps, or ignore your comfort levels should be reported.'
      },
      {
        title: 'Inappropriate or illegal content',
        content: 'Explicit imagery, threats, spam links, or self-harm encouragement are never tolerated.'
      }
    ]
  },
  {
    title: 'Mode-Specific Safety Controls',
    description: 'Each chat mode has its own guardrails so you can pick what feels safest in the moment.',
    items: [
      {
        title: 'Text mode filters',
        content:
          'Language models block slurs, doxxing attempts, or explicit demands instantly. Persistent offenders may face temporary suspensions until reviewed.'
      },
      {
        title: 'Audio calm-down tools',
        content:
          'Tap “mute & mirror” to temporarily block microphones, let emotions reset, and preview AI transcripts before rejoining.'
      },
      {
        title: 'Video framing tips',
        content:
          'Blur your background, use the “camera nudge” prompt if someone drifts off-frame, and disable video quickly from the floating dock when needed.'
      }
    ]
  },
  {
    title: 'Reporting & Enforcement',
    description: 'We act on every report and keep you updated on outcomes wherever possible.',
    items: [
      {
        title: 'Use the in-session report tools',
        content: (
          <>
            Tap the <strong>Report</strong> button or hit <strong>End Chat & Report</strong>. Add a short note so the
            review team knows what to look for.
          </>
        )
      },
      {
        title: 'Immediate consequences',
        content: 'Depending on severity, we block accounts, ban devices, and notify partners or authorities.'
      },
      {
        title: 'Stay informed',
        content: 'You will receive follow-up when policy violations are confirmed, and repeat offenders remain suspended.'
      }
    ]
  },
  {
    title: 'Community Wellbeing',
    description: 'Safety also means caring for mental health and supporting friends who might need help.',
    items: [
      {
        title: 'Take breaks',
        content: 'Use cooldowns, mute, or switch modes if sessions ever feel overwhelming.'
      },
      {
        title: 'Check on peers',
        content: 'If you see someone struggling, encourage them to disconnect and reach out to trusted contacts.'
      },
      {
        title: 'Escalate urgent concerns',
        content: (
          <>
            If you believe someone is in immediate danger, contact local emergency services first, then send us the
            report so we can support the investigation.
          </>
        )
      }
    ]
  },
  {
    title: 'After-Chat Reflection & Reporting',
    description: 'Taking sixty seconds after every session reinforces boundaries and keeps Omegoo’s reputation strong.',
    items: [
      {
        title: 'Rate the experience',
        content:
          'Use the thumbs up/down prompt so the matching system pairs you with people who vibe similarly and filters problem accounts faster.'
      },
      {
        title: 'Journal quick notes',
        content:
          'If something felt off, jot keywords in your private notes or the optional report field. Specifics help moderators take precise action.'
      },
      {
        title: 'Plan next steps',
        content:
          'Need a break? Activate cooldown mode. Want to keep practising? Queue again but switch modes to reset the energy.'
      }
    ]
  },
  {
    title: 'Moderator Playbook Transparency',
    description: 'Understand how Omegoo’s safety team reviews cases and keeps decisions consistent.',
    items: [
      {
        title: 'Triage within minutes',
        content:
          'Critical reports trigger an on-call rotation. Moderators review evidence, freeze offending accounts, and secure proof for law enforcement when required.'
      },
      {
        title: 'Context-aware decisions',
        content:
          'Alongside automated signals, reviewers inspect repeat patterns, session length, and device history before escalating penalties.'
      },
      {
        title: 'Transparent outcomes',
        content:
          'Once a case closes you receive a status update outlining the action taken and tips to prevent similar incidents in the future.'
      }
    ]
  },
  {
    title: 'Regional Compliance & Cultural Care',
    description: 'Safe conversations respect local laws, languages, and lived experiences across Omegoo’s global footprint.',
    items: [
      {
        title: 'India & South Asia focus',
        content:
          'Community guidelines align with IT Rules and the POSH Act. Omegoo flags misogynistic behaviour fast to keep hostel, campus, and co-working communities protected.'
      },
      {
        title: 'EU & UK protections',
        content:
          'GDPR and Online Safety Act requirements influence moderation. We honour the right to be forgotten and provide region-specific escalation paths in local languages.'
      },
      {
        title: 'Global terminology clarity',
        content:
          'Our keyword library covers slang across English, Hindi, Punjabi, Bengali, Spanish, and Arabic so random video chat sessions stay respectful no matter the dialect.'
      }
    ]
  }
];

const SafetyGuidelines: React.FC = () => {
  return (
    <StaticPageLayout
      eyebrow="Safety first"
      title="Safety Guidelines"
      subtitle="A quick reference for staying safe, respectful, and supported during every Omegoo random video, audio, and text chat match."
      heroIcon={<ShieldCheckIcon className="h-8 w-8 text-white" />}
    >
      <SectionCard className="text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <InfoPill tone="positive">24/7 moderation coverage</InfoPill>
          <InfoPill>Real-time session audits</InfoPill>
          <InfoPill tone="warning">Zero tolerance for abuse</InfoPill>
        </div>
        <p className="mt-6 text-sm text-white/70 sm:text-base">
          Omegoo combines automated detection with human reviewers in multiple time zones. Every report feeds into our
          trust and safety pipeline so we can protect the community fast.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <HighlightStat value="&lt; 60s" label="Median response to urgent reports" />
          <HighlightStat value="100%" label="Chats screened for repeat offenders" />
          <HighlightStat value="Round-the-clock" label="Moderator availability" />
        </div>
        <p className="mt-6 text-sm text-white/60">
          Safety is co-created. Share tips with peers, encourage respectful behaviour, and lean on the Omegoo checklist before each conversation to keep the vibe welcoming.
        </p>
      </SectionCard>

      <SectionCard title="Core Safety Principles" description="These fundamentals apply before, during, and after every connection.">
        <div className="grid gap-4 sm:grid-cols-2">
          {principles.map(({ icon: Icon, title, blurb }) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-1 text-left">
                <p className="text-base font-semibold text-white">{title}</p>
                <p className="text-sm text-white/70">{blurb}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {safetySections.map((section) => (
        <SectionCard key={section.title} title={section.title} description={section.description}>
          <ThemedList items={section.items} />
        </SectionCard>
      ))}

      <SectionCard
        title="Need urgent help?"
        description="If you or someone else is in danger, disconnect and contact emergency services right away."
        className="bg-red-950/50"
      >
        <div className="space-y-4 text-sm text-white/75">
          <p>
            After you are safe, email <a href="mailto:omegoochat@gmail.com" className="text-sky-300 underline">omegoochat@gmail.com</a>{' '}
            with timestamps or screenshots so we can escalate the case with full context.
          </p>
          <p>
            For non-urgent questions about our safety program, write to <a href="mailto:omegoochat@gmail.com" className="text-sky-300 underline">omegoochat@gmail.com</a> and the support team will follow up within one business day.
          </p>
          <p>
            Prefer messaging apps? Mention your preferred channel in the email—our responders coordinate secure follow-ups on encrypted platforms when possible.
          </p>
        </div>
      </SectionCard>
    </StaticPageLayout>
  );
};

export default SafetyGuidelines;
