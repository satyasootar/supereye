'use client';

import {
  type ComponentPropsWithoutRef,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useState,
} from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface BentoGridProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps extends ComponentPropsWithoutRef<'div'> {
  name: string;
  className: string;
  background: ReactNode;
  description: string;
  href: string;
  cta: string;
}

function BentoGrid({ children, className, ...props }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid w-full auto-rows-[minmax(18rem,auto)] grid-cols-1 gap-4 md:grid-cols-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function BentoCard({
  name,
  className,
  background,
  description,
  href,
  cta,
  ...props
}: BentoCardProps) {
  return (
    <div
      className={cn(
        'group relative flex min-h-[18rem] flex-col overflow-hidden rounded-2xl',
        'border border-border-subtle bg-bg-elevated landing-float-sm',
        'transform-gpu transition-all duration-300',
        'hover:border-[color-mix(in_srgb,var(--accent-blue)_35%,transparent)]',
        'dark:[box-shadow:0_-20px_80px_-20px_color-mix(in_srgb,var(--accent-blue)_8%,transparent)_inset]',
        className
      )}
      {...props}
    >
      {/* Full-card background — dims on hover (always visible on touch) */}
      <div className="absolute inset-0 transition-opacity duration-300 max-lg:opacity-100 lg:group-hover:opacity-40">
        <div className="relative h-full w-full">{background}</div>
      </div>

      {/* Hover-reveal text overlay */}
      <div
        className={cn(
          'relative z-10 mt-auto p-5 md:p-6',
          'opacity-0 transition-all duration-300 max-lg:opacity-100',
          'lg:group-hover:opacity-100',
          'bg-gradient-to-t from-bg-elevated via-bg-elevated/95 to-transparent pt-16'
        )}
      >
        <h3 className="font-heading text-lg font-semibold text-text-primary md:text-xl">
          {name}
        </h3>
        <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-text-secondary md:text-sm">
          {description}
        </p>

        <Button
          variant="link"
          asChild
          size="sm"
          className="pointer-events-auto mt-2 h-auto p-0 text-accent-blue opacity-0 transition-opacity duration-300 max-lg:opacity-100 lg:group-hover:opacity-100"
        >
          <a href={href}>
            {cta}
            <ArrowRight className="ms-1.5 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

export interface AnimatedBeamProps {
  className?: string;
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  curvature?: number;
  reverse?: boolean;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  delay?: number;
  duration?: number;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
}

export function AnimatedBeam({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = 4,
  delay = 0,
  pathColor = 'var(--border-strong)',
  pathWidth = 2.5,
  pathOpacity = 0.35,
  gradientStartColor = 'var(--accent-blue)',
  gradientStopColor = 'var(--accent-blue-dim)',
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}: AnimatedBeamProps) {
  const id = useId();
  const [pathD, setPathD] = useState('');
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  const gradientCoordinates = reverse
    ? { x1: ['90%', '-10%'], x2: ['100%', '0%'], y1: ['0%', '0%'], y2: ['0%', '0%'] }
    : { x1: ['10%', '110%'], x2: ['0%', '100%'], y1: ['0%', '0%'], y2: ['0%', '0%'] };

  useEffect(() => {
    const updatePath = () => {
      if (!containerRef.current || !fromRef.current || !toRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const rectA = fromRef.current.getBoundingClientRect();
      const rectB = toRef.current.getBoundingClientRect();

      const svgWidth = containerRect.width;
      const svgHeight = containerRect.height;
      setSvgDimensions({ width: svgWidth, height: svgHeight });

      const startX = rectA.left - containerRect.left + rectA.width / 2 + startXOffset;
      const startY = rectA.top - containerRect.top + rectA.height / 2 + startYOffset;
      const endX = rectB.left - containerRect.left + rectB.width / 2 + endXOffset;
      const endY = rectB.top - containerRect.top + rectB.height / 2 + endYOffset;

      const controlY = startY - curvature;
      const d = `M ${startX},${startY} Q ${(startX + endX) / 2},${controlY} ${endX},${endY}`;
      setPathD(d);
    };

    updatePath();
    const ro = new ResizeObserver(updatePath);
    if (containerRef.current) ro.observe(containerRef.current);
    if (fromRef.current) ro.observe(fromRef.current);
    if (toRef.current) ro.observe(toRef.current);
    window.addEventListener('resize', updatePath);
    const t1 = window.setTimeout(updatePath, 50);
    const t2 = window.setTimeout(updatePath, 300);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updatePath);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [
    containerRef,
    fromRef,
    toRef,
    curvature,
    startXOffset,
    startYOffset,
    endXOffset,
    endYOffset,
  ]);

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className={cn('pointer-events-none absolute top-0 left-0 z-[1]', className)}
    >
      {pathD && (
        <>
          <path
            d={pathD}
            stroke={pathColor}
            strokeWidth={pathWidth}
            strokeOpacity={pathOpacity}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={pathD}
            strokeWidth={pathWidth}
            stroke={`url(#${id})`}
            strokeOpacity="1"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
      <defs>
        <motion.linearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          initial={{ x1: '0%', x2: '0%', y1: '0%', y2: '0%' }}
          animate={{
            x1: gradientCoordinates.x1,
            x2: gradientCoordinates.x2,
            y1: gradientCoordinates.y1,
            y2: gradientCoordinates.y2,
          }}
          transition={{
            delay,
            duration,
            ease: [0.16, 1, 0.3, 1],
            repeat: Infinity,
            repeatDelay: 0,
          }}
        >
          <stop stopColor={gradientStartColor} stopOpacity="0" />
          <stop stopColor={gradientStartColor} />
          <stop offset="32.5%" stopColor={gradientStopColor} />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  );
}

export { BentoCard, BentoGrid };
