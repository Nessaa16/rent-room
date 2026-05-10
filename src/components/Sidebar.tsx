"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  Package,
  ClipboardList,
  Building2,
  LogOut,
} from "lucide-react";

const adminNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/peminjam", label: "Peminjam", icon: Users },
  { href: "/ruang", label: "Ruang", icon: DoorOpen },
  { href: "/peralatan", label: "Peralatan", icon: Package },
  { href: "/peminjaman", label: "Peminjaman", icon: ClipboardList },
  { href: "/users", label: "Kelola User", icon: Users },
];

const nonAdminNavItems = [
  { href: "/peminjam", label: "Peminjam", icon: Users },
  { href: "/ruang", label: "Ruang", icon: DoorOpen },
  { href: "/peralatan", label: "Peralatan", icon: Package },
  { href: "/peminjaman", label: "Peminjaman", icon: ClipboardList },
];

export default function Sidebar() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  };

  useEffect(() => {
    let mounted = true;
    getCurrentUser()
      .then((user) => {
        if (mounted) {
          setUserRole(user?.role ?? null);
        }
      })
      .catch(() => {
        if (mounted) {
          setUserRole(null);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-400 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-tight" style={{ fontFamily: "Space Grotesk" }}>
              RentRoom
            </p>
            <p className="text-xs text-slate-400">Universitas XYZ</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Menu Utama
        </p>

        {(userRole === null ? [] : userRole === "admin" ? adminNavItems : nonAdminNavItems).map(({ href, label, icon: Icon }) => {
          const path = pathname ?? "/";
          const isActive =
            path === href || (href !== "/" && path.startsWith(href + "/"));

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-50 text-orange-400"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? "text-orange-400" : "text-slate-400"
                }`}
              />
              {label}
            </Link>
          );
        })}

        {userRole === null && (
          <div className="px-3 py-2 text-xs text-slate-400">Memuat menu...</div>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-slate-100">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50"
        >
          <LogOut className="w-4 h-4 text-slate-500" />
          Logout
        </button>
      </div>
    </aside>
  );
}