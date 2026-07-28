// Simplified top-bar nav -- support-dashboard's real nav
// (apps/support-dashboard/src/modules/sidebar/components/app-sidebar.tsx) is a
// full collapsible sidebar with org switcher/RBAC, which needs react-router +
// a Sheet component we don't vendor here. This is the lean equivalent: logo +
// app name + whoever's signed in, if the auth toggle can tell us.
import { useAuthIdentity } from '../../lib/auth/AuthGate';

export function Nav({ appName }: { appName: string }) {
  const { email } = useAuthIdentity();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <img src="/pfm-logo-symbol.svg" alt="" className="h-6 w-6" />
        <span className="font-sans text-sm font-semibold text-foreground">{appName}</span>
      </div>
      {email && <span className="text-sm text-foreground-secondary">{email}</span>}
    </header>
  );
}
