import { SUPER_ADMIN_EMAILS } from '@/lib/billing/constants';
import { AdminPageHeader, AdminPanel } from '@/components/admin/admin-shell';
import { DemoLoginSettings } from '@/components/admin/demo-login-settings';
import { DefaultSignupPlanSettings } from '@/components/admin/default-signup-plan-settings';

export default function AdminSettingsPage() {
  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Platform configuration and access control settings."
      />

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <DemoLoginSettings />
        <DefaultSignupPlanSettings />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminPanel title="Super Admin Access">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-text-muted">Authorized emails</dt>
              <dd className="mt-1 font-medium text-text-primary">
                {SUPER_ADMIN_EMAILS.length > 0 ? (
                  <ul className="list-inside list-disc space-y-1">
                    {SUPER_ADMIN_EMAILS.map((email) => (
                      <li key={email}>{email}</li>
                    ))}
                  </ul>
                ) : (
                  'Not configured (set SUPER_ADMIN_EMAILS)'
                )}
              </dd>
            </div>
            <p className="text-text-muted">
              These emails receive super admin role on sign-in (via SUPER_ADMIN_EMAILS or
              ADMIN_EMAIL). Super admins can promote users to admin; admins can manage users and
              decrease token usage but cannot grant additional tokens.
            </p>
          </dl>
        </AdminPanel>

        <AdminPanel title="Token System">
          <ul className="list-inside list-disc space-y-2 text-sm text-text-muted">
            <li>Users see AI credits only; LLM token usage is visible to super admins.</li>
            <li>All credit balance changes are recorded in the token ledger.</li>
            <li>AI action credit costs are configurable under Tokens → Action Costs.</li>
            <li>Top-up packs add purchasable credits until Stripe is connected.</li>
          </ul>
        </AdminPanel>

        <AdminPanel title="Plans & Subscriptions">
          <ul className="list-inside list-disc space-y-2 text-sm text-text-muted">
            <li>Set the default signup plan under Settings (Starter recommended).</li>
            <li>Monthly credit allocations are editable on the Plans page.</li>
            <li>Credit costs per AI action are editable under Tokens → Action Costs.</li>
            <li>Free plan: plugins only, no AI — for zero AI cost accounts.</li>
          </ul>
        </AdminPanel>

        <AdminPanel title="Security">
          <ul className="list-inside list-disc space-y-2 text-sm text-text-muted">
            <li>Admin routes are protected server-side via RBAC middleware.</li>
            <li>API routes validate admin role on every request.</li>
            <li>Token balances are validated server-side before AI actions.</li>
            <li>All admin actions are written to audit logs.</li>
          </ul>
        </AdminPanel>
      </div>
    </div>
  );
}
