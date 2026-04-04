"use client";

import { useEffect, useRef, useState } from "react";
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
import { LogOut, Settings, User, Menu, Bell } from "lucide-react";
import { RoleSwitcher } from "./role-switcher";

interface TopbarProps {
  onToggleSidebar?: () => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const [notifs, setNotifs] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const role = (user as Record<string, unknown> | undefined)?.role as string | undefined;
  const isAdmin = role === "ADMIN" || role === "PM";

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : []))
      .then((d: any) => setNotifs(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowNotifs(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notifs.filter((n: any) => !n.read).length;

  function markAllRead() {
    fetch("/api/notifications/read", { method: "PATCH" }).catch(() => {});
    setNotifs(notifs.map((n: any) => ({ ...n, read: true })));
  }

  function handleNotifClick(n: any) {
    if (!n.read) {
      fetch("/api/notifications/read", { method: "PATCH" }).catch(() => {});
      setNotifs(notifs.map((x: any) => ({ ...x, read: true })));
    }
    setShowNotifs(false);
    if (n.link) router.push(n.link);
  }

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

        {/* Notification bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.05)]"
          >
            <Bell className="h-5 w-5 text-[rgba(245,246,252,0.6)]" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-11 z-50 w-80 rounded-lg border border-[rgba(245,246,252,0.1)] bg-[var(--asphalt-black)] shadow-xl">
              <div className="max-h-72 overflow-y-auto">
                {notifs.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-[rgba(245,246,252,0.4)]">Sin notificaciones</p>
                )}
                {notifs.map((n: any) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`w-full border-b border-[rgba(245,246,252,0.05)] px-4 py-3 text-left hover:bg-[rgba(255,255,255,0.03)] ${!n.read ? "bg-[rgba(255,255,255,0.04)]" : ""}`}
                  >
                    <p className="text-sm font-medium text-[var(--ice-white)]">{n.title}</p>
                    <p className="text-xs text-[rgba(245,246,252,0.5)]">{n.message}</p>
                    <p className="mt-1 text-[10px] text-[rgba(245,246,252,0.3)]">{timeAgo(n.createdAt)}</p>
                  </button>
                ))}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="w-full border-t border-[rgba(245,246,252,0.1)] px-4 py-2 text-center text-xs font-medium text-[var(--gold-bar)] hover:bg-[rgba(255,255,255,0.03)]"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>
          )}
        </div>

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
