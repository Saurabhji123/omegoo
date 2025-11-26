import React from 'react';

type StaticPageLayoutProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  heroIcon?: React.ReactNode;
  children: React.ReactNode;
};

export const StaticPageLayout: React.FC<StaticPageLayoutProps> = ({
  title,
  subtitle,
  eyebrow,
  heroIcon,
  children
}) => {
  return (
    <div className="min-h-screen px-4 py-12 text-white" style={{ backgroundColor: 'var(--bg-body)' }}>
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="text-center space-y-5">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">
              {eyebrow}
            </p>
          )}

          {heroIcon && (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-red-900/40">
              {heroIcon}
            </div>
          )}

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold sm:text-4xl md:text-5xl">{title}</h1>
            {subtitle && (
              <p className="mx-auto max-w-3xl text-sm text-white/70 sm:text-base">
                {subtitle}
              </p>
            )}
          </div>
        </header>

        <main className="space-y-8 sm:space-y-10">{children}</main>
      </div>
    </div>
  );
};

type SectionCardProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  children,
  className = ''
}) => {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl shadow-red-950/40 backdrop-blur-sm sm:p-8 ${className}`}
    >
      {(title || description) && (
        <header className="mb-6 space-y-2">
          {title && <h2 className="text-xl font-semibold text-white sm:text-2xl">{title}</h2>}
          {description && <p className="text-sm text-white/60 sm:text-base">{description}</p>}
        </header>
      )}
      {children}
    </section>
  );
};

type PillProps = {
  children: React.ReactNode;
  tone?: 'default' | 'positive' | 'warning';
};

type PillTone = NonNullable<PillProps['tone']>;

export const InfoPill: React.FC<PillProps> = ({ children, tone = 'default' }) => {
  const toneClasses: Record<PillTone, string> = {
    default: 'text-white/70 border-white/15 bg-white/5',
    positive: 'text-emerald-200 border-emerald-400/30 bg-emerald-500/10',
    warning: 'text-amber-200 border-amber-400/30 bg-amber-500/10'
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider ${toneClasses[tone]}`}>
      {children}
    </span>
  );
};

type StatProps = {
  label: string;
  value: string;
};

export const HighlightStat: React.FC<StatProps> = ({ label, value }) => {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
      <div className="text-2xl font-semibold text-sky-300 sm:text-3xl">{value}</div>
      <p className="mt-1 text-xs uppercase tracking-wide text-white/50 sm:text-sm">{label}</p>
    </div>
  );
};

type ListProps = {
  items: Array<{ title?: string; content: React.ReactNode }>;
  bulletColor?: 'sky' | 'emerald' | 'rose';
};

type BulletTone = NonNullable<ListProps['bulletColor']>;

export const ThemedList: React.FC<ListProps> = ({ items, bulletColor = 'sky' }) => {
  const colors: Record<BulletTone, string> = {
    sky: 'bg-sky-400',
    emerald: 'bg-emerald-400',
    rose: 'bg-rose-400'
  };

  return (
    <ul className="space-y-3 text-sm text-white/75">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3">
          <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${colors[bulletColor]}`} />
          <div className="space-y-1">
            {item.title && <p className="text-sm font-semibold text-white/90">{item.title}</p>}
            <div>{item.content}</div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default StaticPageLayout;
