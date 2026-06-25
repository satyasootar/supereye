'use client';

import Image from 'next/image';

export function BackedByChaicode() {
  return (
    <div
      className="inline-flex w-fit items-center gap-2 rounded-[var(--radius-md)] border border-border-subtle bg-bg-elevated px-2.5 py-1.5 shadow-sm"
      style={{
        boxShadow:
          '0 2px 14px color-mix(in srgb, var(--text-primary) 7%, transparent)',
      }}
    >
      <Image
        src="/logo/chaicode.png"
        alt="Chaicode"
        width={24}
        height={24}
        className="h-[24px] w-[24px] shrink-0 rounded-[1px] object-contain"
      />
      <div className="flex flex-col leading-none">
        <span className="text-[10px] font-medium text-text-muted">Backed by</span>
        <span className="text-[13px] font-semibold tracking-tight pt-1 text-text-primary">
          Chaicode
        </span>
      </div>
    </div>
  );
}
