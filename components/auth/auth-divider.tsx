export function AuthDivider({ label = 'or' }: { label?: string }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border-subtle" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-bg-elevated px-2 text-text-muted">{label}</span>
      </div>
    </div>
  );
}
