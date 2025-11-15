import React from 'react';
import {
  StaticPageLayout,
  SectionCard,
  HighlightStat,
  ThemedList,
  InfoPill
} from './StaticPageLayout';

const About: React.FC = () => {
  const featureCards = [
    {
      title: 'AI-Powered Safety',
      description:
        'Real-time moderation keeps abusive behavior out of every room. Our models work silently in the background so you can focus on the conversation.',
      icon: (
        <svg className="h-6 w-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: 'Built for Anonymity',
      description:
        'Join a session without revealing email addresses, phone numbers, or social profiles. Omegoo was designed to let curiosity thrive safely.',
      icon: (
        <svg className="h-6 w-6 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      title: 'Global Community',
      description:
        'Language learners, founders, students, and remote workers meet every hour. Omegoo matches people across countries while respecting local norms.',
      icon: (
        <svg className="h-6 w-6 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
        </svg>
      )
    },
    {
      title: 'Instant Connections',
      description:
        'Tap “start” and meet someone new in seconds. Text, audio, and video chats all share the same lightweight experience—no installs required.',
      icon: (
        <svg className="h-6 w-6 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];

  return (
    <StaticPageLayout
      eyebrow="Our story"
      title="About Omegoo"
      subtitle="We built Omegoo to make it effortless—and safe—to meet someone new. Conversations should feel human, anonymous, and free from friction."
      heroIcon={<img src="/logo512.png" alt="Omegoo" className="h-10 w-10 rounded-xl" />}
    >
      <SectionCard title="Our mission">
        <div className="space-y-4 text-sm text-white/75 sm:text-base">
          <p>
            Omegoo bridges cultures and connects hearts across the globe. We believe meaningful conversations can happen between strangers when the space feels safe and judgment free. From Indian universities and LPU hostels to remote coworking hubs overseas, Omegoo empowers people to share stories, discover opportunities, and build supportive communities.
          </p>
          <p>
            Everything we design—from the matching logic to the moderation stack—prioritises empathy, transparency, and user control. That philosophy keeps Omegoo welcoming for first-time visitors and power users alike.
          </p>
          <p>
            The founding team spent months interviewing campus ambassadors, teachers, hostel wardens, and mental-health counsellors to understand what makes random chat spaces fail. Omegoo folds those lessons into weekly updates, prioritising user wellbeing over vanity metrics.
          </p>
          <p>
            Instead of chasing virality, we measure success by the number of positive interactions, repeat study sessions, and cross-border friendships formed on the platform. Every improvement aims to earn user trust first.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="What sets us apart">
        <div className="grid gap-6 sm:grid-cols-2">
          {featureCards.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-indigo-950/20"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                {feature.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-white/70">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Milestones" description="A snapshot of the journey so far.">
        <div className="grid gap-4 lg:grid-cols-4 text-sm text-white/70">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/50">Q1 2023</p>
            <p className="mt-2">Prototype launches in Chandigarh university dorms; 1,200 students try Omegoo over a single weekend.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/50">Q3 2023</p>
            <p className="mt-2">AI moderation pipeline ships, cutting harmful interactions by 87% within two weeks.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/50">Q1 2024</p>
            <p className="mt-2">Global roll-out adds Frankfurt and Mumbai PoPs to keep latency under 200ms for 90% of users.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/50">Q3 2024</p>
            <p className="mt-2">Community councils launch, giving power users a direct vote on features and events.</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Team values" description="The principles guiding every product sprint.">
        <div className="grid gap-4 sm:grid-cols-2 text-sm text-white/70">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
            <h3 className="text-base font-semibold text-white">Care over clicks</h3>
            <p>
              We optimise for long-term wellbeing. Safety teams sit next to product engineers, ensuring features launch with moderation coverage built-in from day one.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
            <h3 className="text-base font-semibold text-white">Inclusive by design</h3>
            <p>
              Accessibility modes, bidi language support, and flexible onboarding flows help students from Tier-2 cities connect with peers abroad without friction.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
            <h3 className="text-base font-semibold text-white">Transparency always</h3>
            <p>
              We publish detailed release notes, moderation statistics, and planned experiments so the community knows what is shipping next.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
            <h3 className="text-base font-semibold text-white">Learn and iterate</h3>
            <p>
              User councils share monthly feedback; we run retros after every major event to capture insights and roll them into upcoming sprints.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Global heartbeat" description="A snapshot of how Omegoo is used every day.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <HighlightStat label="Daily conversations" value="50K+" />
          <HighlightStat label="Countries connected" value="195" />
          <HighlightStat label="Safe interactions" value="99.8%" />
          <HighlightStat label="Uptime" value="24/7" />
        </div>
      </SectionCard>

      <SectionCard title="Why students and creators pick Omegoo">
        <div className="space-y-6">
          <div className="space-y-3">
            <InfoPill tone="positive">Coin-powered trust</InfoPill>
            <p className="text-sm text-white/70">
              A daily coin reward reinforces respectful behaviour. Every user receives 50 coins that reset at midnight (IST), keeping chats accessible while discouraging spam. The coin economy works hand-in-hand with moderation, so positive habits get rewarded automatically.
            </p>
          </div>

          <div className="space-y-3">
            <InfoPill>Campus to global</InfoPill>
            <p className="text-sm text-white/70">
              Omegoo grew across Indian campuses before scaling to the US, UK, Canada, Australia, and Southeast Asia. That mix of local nuance and global reach helps the platform resonate with searchers looking for college-friendly hangouts and international study buddies alike.
            </p>
          </div>

          <div className="space-y-3">
            <InfoPill tone="warning">Privacy first</InfoPill>
            <p className="text-sm text-white/70">
              We collect only the essentials required to run the service. Sessions are encrypted, personal details stay private, and policies remain transparent—ideal for anyone seeking anonymous chats without sign-ups.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="What people search for" description="SEO-friendly snapshots for newcomers discovering Omegoo.">
        <div className="grid gap-4 md:grid-cols-2 text-sm text-white/70">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
            <h3 className="text-base font-semibold text-white">"Anonymous video chat"</h3>
            <p>
              Omegoo pairs strangers safely with AI + human moderation, offering instant video, audio, and text without revealing email addresses or phone numbers.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
            <h3 className="text-base font-semibold text-white">"Indian omegle alternative"</h3>
            <p>
              Built in India for a global audience, Omegoo keeps conversations respectful, enforces regional compliance, and supports multilingual greetings out of the box.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
            <h3 className="text-base font-semibold text-white">"Study buddy random chat"</h3>
            <p>
              Students use tags and interest badges to find accountability partners, plan group revisions, and practise spoken English or Hindi during late-night sessions.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
            <h3 className="text-base font-semibold text-white">"Safe chat for creators"</h3>
            <p>
              Creators host moderated rooms, stream curated prompts, and turn highlights into Instagram reels thanks to our consent-first policies.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Our vision" description="Where we are heading next.">
        <div className="space-y-5 text-sm text-white/75 sm:text-base">
          <p>
            We envision a world where distance and differences do not divide us. Omegoo is a bridge between cultures, a space for learning, and a community where everyone can share their story. We partner with student clubs, alumni groups, and global creators to host themed rooms that spark meaningful dialogue.
          </p>
          <ThemedList
            items={[
              {
                title: 'Themed discovery rooms',
                content: 'Rotating topics help learners practise languages, founders pitch ideas, and travellers find local tips.'
              },
              {
                title: 'Human + AI safety',
                content: 'Moderators review edge cases while automation keeps the queue fast and fair.'
              },
              {
                title: 'Accessible everywhere',
                content: 'Low bandwidth mode and progressive web support make Omegoo friendly on any device.'
              }
            ]}
          />
          <p>
            Upcoming pilots include language mentors powered by vetted volunteers, campus-led hackathons that co-create new moderation heuristics, and verified brand lounges where companies host supervised career mixers.
          </p>
          <p className="text-center text-sm text-white/60">
            Made with curiosity, built for humanity, connecting hearts globally.
          </p>
        </div>
      </SectionCard>
    </StaticPageLayout>
  );
};

export default About;