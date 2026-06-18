export const AUDIT_ACTION_LABELS: Record<string, string> = {
  suspend_user: 'Suspended user',
  activate_user: 'Activated user',
  update_user: 'Updated user',
  delete_user: 'Deleted user',
  assign_plan: 'Assigned plan',
  update_plan: 'Updated plan',
  create_enterprise_plan: 'Created enterprise plan',
  create_enterprise_account: 'Created enterprise account',
  update_token_cost: 'Updated token cost',
  update_top_up_pack: 'Updated top-up pack',
  update_platform_settings: 'Updated platform settings',
  admin_allocation: 'Added tokens',
  admin_removal: 'Removed tokens',
  bonus_credits: 'Granted bonus credits',
  period_reset: 'Reset token period',
};

export function formatAuditAction(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action.replace(/_/g, ' ');
}

export function formatAuditTarget(params: {
  targetType: string | null;
  targetId: string | null;
  targetUserName?: string | null;
  targetUserEmail?: string | null;
  targetPlanName?: string | null;
  metadata?: Record<string, unknown> | null;
}): string {
  if (!params.targetType) return '—';

  if (params.targetType === 'user') {
    const label =
      params.targetUserName?.trim() ||
      params.targetUserEmail ||
      params.targetId?.slice(0, 8);
    return label ? `User · ${label}` : 'User';
  }

  if (params.targetType === 'plan') {
    const label = params.targetPlanName || params.targetId?.slice(0, 8);
    return label ? `Plan · ${label}` : 'Plan';
  }

  if (params.targetType === 'enterprise_account') {
    const orgName =
      typeof params.metadata?.organizationName === 'string'
        ? params.metadata.organizationName
        : null;
    return orgName ? `Enterprise · ${orgName}` : 'Enterprise account';
  }

  const shortId = params.targetId ? params.targetId.slice(0, 8) : '';
  return shortId ? `${params.targetType} · ${shortId}` : params.targetType;
}

export function formatAuditMetadata(metadata: Record<string, unknown> | null | undefined): string {
  if (!metadata || Object.keys(metadata).length === 0) return '—';

  const parts: string[] = [];

  if (typeof metadata.planName === 'string') parts.push(`plan: ${metadata.planName}`);
  if (typeof metadata.planId === 'string' && !metadata.planName) {
    parts.push(`plan: ${metadata.planId.slice(0, 8)}…`);
  }
  if (typeof metadata.monthlyAllocation === 'number') {
    parts.push(`allocation: ${metadata.monthlyAllocation.toLocaleString()}`);
  }
  if (typeof metadata.amount === 'number') {
    parts.push(`amount: ${metadata.amount.toLocaleString()}`);
  }
  if (typeof metadata.reason === 'string') parts.push(`reason: ${metadata.reason}`);
  if (typeof metadata.role === 'string') parts.push(`role: ${metadata.role}`);
  if (typeof metadata.name === 'string') parts.push(`name: ${metadata.name}`);
  if (typeof metadata.organizationName === 'string') {
    parts.push(`org: ${metadata.organizationName}`);
  }
  if (typeof metadata.tokenCost === 'number') parts.push(`cost: ${metadata.tokenCost}`);
  if (typeof metadata.displayName === 'string') parts.push(`label: ${metadata.displayName}`);
  if (typeof metadata.isActive === 'boolean') {
    parts.push(metadata.isActive ? 'active' : 'inactive');
  }
  if (typeof metadata.demoLoginEnabled === 'boolean') {
    parts.push(`demo login: ${metadata.demoLoginEnabled ? 'enabled' : 'disabled'}`);
  }

  if (parts.length > 0) return parts.join(' · ');

  try {
    return JSON.stringify(metadata);
  } catch {
    return '—';
  }
}
