import { SUPER_ADMIN_EMAIL } from '@/lib/billing/constants';
import { AdminPageHeader, AdminPanel } from '@/components/admin/admin-shell';

export default function AdminSettingsPage() {
  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Platform configuration and access control settings."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminPanel title="Super Admin Access">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-text-muted">Authorized email</dt>
              <dd className="mt-1 font-medium text-text-primary">{SUPER_ADMIN_EMAIL}</dd>
            </div>
            <p className="text-text-muted">
              Only this email receives super admin role on sign-in. Role changes for other
              accounts must be made manually from the Users panel.
            </p>
          </dl>
        </AdminPanel>

        <AdminPanel title="Token System">
          <ul className="list-inside list-disc space-y-2 text-sm text-text-muted">
            <li>All token balance changes are recorded in the token ledger.</li>
            <li>AI action costs are configurable under Tokens → Action Costs.</li>
            <li>Plan token allocations can be updated without code changes.</li>
            <li>Top-up packs are simulated purchases until Stripe is connected.</li>
          </ul>
        </AdminPanel>

        <AdminPanel title="Plans & Subscriptions">
          <ul className="list-inside list-disc space-y-2 text-sm text-text-muted">
            <li>Starter, Pro, and Enterprise tiers are seeded on first admin visit.</li>
            <li>Unlimited enterprise plan variants can be created from the Plans page.</li>
            <li>Assign plans to users from the Users management panel.</li>
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
