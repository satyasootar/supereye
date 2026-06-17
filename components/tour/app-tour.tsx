'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { modKeyLabel } from '@/lib/keyboard/key-parser';
import { MAX_PLUGINS_PER_WORKSPACE } from '@/lib/plugins/registry';
import {
  filterTourSteps,
  interpolateTourText,
  type AppTourStep,
  type TourStepPlacement,
} from '@/lib/tour/steps';
import { TOUR_TARGETS } from '@/lib/tour/targets';
import { persistTourCompleted, useTourStore } from '@/lib/store/tour-store';
import { useWorkspaceLayout } from '@/hooks/use-workspace-layout';
import { USER_PREFERENCES_KEY } from '@/hooks/use-workspaces';

const SPOTLIGHT_PAD = 10;

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function getTargetRect(targetId?: string): SpotlightRect | null {
  if (!targetId) return null;
  const el = document.querySelector(`[data-tour="${targetId}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top - SPOTLIGHT_PAD,
    left: rect.left - SPOTLIGHT_PAD,
    width: rect.width + SPOTLIGHT_PAD * 2,
    height: rect.height + SPOTLIGHT_PAD * 2,
  };
}

function getTooltipStyle(
  placement: TourStepPlacement,
  rect: SpotlightRect | null,
  tooltipSize: { width: number; height: number }
): React.CSSProperties {
  const margin = 16;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  if (!rect || placement === 'center') {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      maxWidth: 'min(420px, calc(100vw - 32px))',
    };
  }

  let top = rect.top + rect.height / 2 - tooltipSize.height / 2;
  let left = rect.left + rect.width / 2 - tooltipSize.width / 2;

  if (placement === 'bottom') {
    top = rect.top + rect.height + margin;
    left = rect.left + rect.width / 2 - tooltipSize.width / 2;
  } else if (placement === 'top') {
    top = rect.top - tooltipSize.height - margin;
    left = rect.left + rect.width / 2 - tooltipSize.width / 2;
  } else if (placement === 'left') {
    top = rect.top + rect.height / 2 - tooltipSize.height / 2;
    left = rect.left - tooltipSize.width - margin;
  } else if (placement === 'right') {
    top = rect.top + rect.height / 2 - tooltipSize.height / 2;
    left = rect.left + rect.width + margin;
  }

  top = Math.max(16, Math.min(top, vh - tooltipSize.height - 16));
  left = Math.max(16, Math.min(left, vw - tooltipSize.width - 16));

  return {
    top,
    left,
    maxWidth: 'min(380px, calc(100vw - 32px))',
  };
}

function TourSpotlight({ rect }: { rect: SpotlightRect | null }) {
  if (!rect) {
    return <div className="fixed inset-0 z-[490] bg-black/70" aria-hidden />;
  }

  return (
    <>
      <div
        className="pointer-events-none fixed z-[490] rounded-xl"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.72)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed z-[491] rounded-xl ring-2 ring-accent-blue shadow-[0_0_24px_var(--accent-blue-glow)]"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
        aria-hidden
      />
    </>
  );
}

function TourTooltip({
  step,
  stepIndex,
  totalSteps,
  onBack,
  onNext,
  onSkip,
  isLast,
  rect,
}: {
  step: AppTourStep;
  stepIndex: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  isLast: boolean;
  rect: SpotlightRect | null;
}) {
  const [tooltipRef, setTooltipRef] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 360, height: 200 });

  useLayoutEffect(() => {
    if (!tooltipRef) return;
    const { width, height } = tooltipRef.getBoundingClientRect();
    setSize({ width, height });
  }, [step.id, tooltipRef]);

  const placement = step.placement ?? (step.target ? 'bottom' : 'center');
  const body = interpolateTourText(step.body, {
    mod: modKeyLabel(),
    maxPlugins: MAX_PLUGINS_PER_WORKSPACE,
  });

  const style = getTooltipStyle(placement, rect, size);

  return (
    <motion.div
      ref={setTooltipRef}
      key={step.id}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'fixed z-[500] rounded-2xl border border-border-subtle bg-bg-elevated/98 p-5 shadow-2xl backdrop-blur-md',
        placement === 'center' && 'w-full'
      )}
      style={style}
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-tour-title"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-blue">
            Step {stepIndex + 1} of {totalSteps}
          </p>
          <h2 id="app-tour-title" className="mt-1 text-[18px] font-semibold text-text-primary">
            {step.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-highlight hover:text-text-primary"
          aria-label="Skip tour"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-[14px] leading-relaxed text-text-secondary">{body}</p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="text-[13px] font-medium text-text-muted transition-colors hover:text-text-primary"
        >
          Skip tour
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={stepIndex === 0}
            className="flex items-center gap-1.5 rounded-md border border-border-default px-3 py-2 text-[13px] font-medium text-text-primary transition-colors hover:bg-bg-highlight disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-1.5 rounded-md bg-accent-blue px-3.5 py-2 text-[13px] font-semibold text-text-inverse transition-colors hover:bg-accent-blue-dim"
          >
            {isLast ? 'Finish' : 'Next'}
            {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function AppTour() {
  const { isActive, stepIndex, nextStep, prevStep, skipTour, endTour } = useTourStore();
  const { activeWorkspace, hasSecondary } = useWorkspaceLayout();
  const queryClient = useQueryClient();
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [mounted, setMounted] = useState(false);

  const hasTwoPlugins = (activeWorkspace?.pluginIds.length ?? 0) >= 2;

  const steps = useMemo(
    () =>
      filterTourSteps({
        hasTwoPlugins,
        hasSecondary: hasSecondary && hasTwoPlugins,
      }),
    [hasTwoPlugins, hasSecondary]
  );

  const currentStep = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;

  const updateRect = useCallback(() => {
    if (!currentStep?.target) {
      setRect(null);
      return;
    }
    setRect(getTargetRect(currentStep.target));
  }, [currentStep?.target]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isActive) return;
    updateRect();
    const target = currentStep?.target
      ? document.querySelector(`[data-tour="${currentStep.target}"]`)
      : null;
    target?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [isActive, currentStep?.id, currentStep?.target, updateRect]);

  useEffect(() => {
    if (!isActive) return;

    const onResize = () => updateRect();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [isActive, updateRect]);

  const finishTour = useCallback(async () => {
    endTour();
    await persistTourCompleted();
    await queryClient.invalidateQueries({ queryKey: USER_PREFERENCES_KEY });
  }, [endTour, queryClient]);

  const handleSkip = useCallback(() => {
    void finishTour();
    skipTour();
  }, [finishTour, skipTour]);

  const handleNext = useCallback(() => {
    if (isLast) {
      void finishTour();
      return;
    }
    nextStep(steps.length - 1);
  }, [finishTour, isLast, nextStep, steps.length]);

  useEffect(() => {
    if (!isActive) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isActive, handleSkip]);

  if (!mounted || !isActive || !currentStep) return null;

  return createPortal(
    <div className="fixed inset-0 z-[489]">
      <TourSpotlight rect={rect} />
      <AnimatePresence mode="wait">
        <TourTooltip
          key={currentStep.id}
          step={currentStep}
          stepIndex={stepIndex}
          totalSteps={steps.length}
          onBack={prevStep}
          onNext={handleNext}
          onSkip={handleSkip}
          isLast={isLast}
          rect={rect}
        />
      </AnimatePresence>
    </div>,
    document.body
  );
}

export { TOUR_TARGETS };
