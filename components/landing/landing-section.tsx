import { cn } from '@/lib/utils';

interface LandingSectionProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

export function LandingSection({
  id,
  children,
  className,
  innerClassName,
}: LandingSectionProps) {
  return (
    <section
      id={id}
      className={cn('w-full px-6 py-20 md:px-10 md:py-28', className)}
    >
      <div className={cn('mx-auto w-full max-w-6xl', innerClassName)}>
        {children}
      </div>
    </section>
  );
}

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-12 md:mb-16',
        align === 'center' && 'mx-auto max-w-2xl text-center',
        align === 'left' && 'max-w-xl text-left',
        className
      )}
    >
      {eyebrow && (
        <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent-blue">
          {eyebrow}
        </p>
      )}
      <h2 className="font-heading text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-text-secondary md:text-[17px]">
          {description}
        </p>
      )}
    </div>
  );
}
