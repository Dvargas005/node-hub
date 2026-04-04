"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Settings, User, Menu } from "lucide-react";
import { RoleSwitcher } from "./role-switcher";

interface TopbarProps {
  onToggleSidebar?: () => void;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const role = (user as Record<string, unknown> | undefined)?.role as string | undefined;
  const isAdmin = role === "ADMIN" || role === "PM";

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const handleSignOut = async () => {
    // Clear view-as state on sign out
    localStorage.removeItem("node-view-as-role");
    document.cookie = "node-view-as-role=;path=/;max-age=0";
    await signOut();
    router.push("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-[rgba(245,246,252,0.1)] bg-[var(--asphalt-black)] px-4 md:px-6">
      {/* Hamburger — mobile only */}
      <button
        className="p-2 text-[rgba(245,246,252,0.6)] hover:text-[var(--ice-white)] md:hidden"
        onClick={onToggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Spacer for desktop */}
      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        {role === "ADMIN" && <RoleSwitcher userRole={role} />}

        <DropdownMenu>
          <DropdownMenuTrigger
            className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.05)]"
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] text-sm font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(isAdmin ? "/admin/overview" : "/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              {isAdmin ? "Panel Admin" : "Configuración"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(isAdmin ? "/admin/overview" : "/dashboard")}>
              <User className="mr-2 h-4 w-4" />
              {isAdmin ? "Overview" : "Mi Perfil"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
