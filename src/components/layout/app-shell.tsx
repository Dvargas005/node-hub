import { Sidebar, NavItem } from "./sidebar";
import { Topbar } from "./topbar";

interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title?: string;
}

export function AppShell({ children, navItems, title }: AppShellProps) {
  return (
    <div className="flex h-screen bg-[var(--asphalt-black)]">
      <Sidebar items={navItems} title={title} />
      <div className="flex flex-1 flex-col min-h-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
