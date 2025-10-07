"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function AdminNav() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/admin/session", { cache: "no-store" });
        setLoggedIn(res.ok);
      } catch {
        setLoggedIn(false);
      }
    };

    // Check on mount and whenever route changes
    checkSession();
  }, [pathname]);

  useEffect(() => {
    const onFocus = () => {
      fetch("/api/admin/session", { cache: "no-store" })
        .then((r) => setLoggedIn(r.ok))
        .catch(() => setLoggedIn(false));
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="http://asclepios-medical.ro/wp-content/uploads/2025/09/logo_patrat-300x276-1.png"
            alt="Logo"
            width={24}
            height={24}
            className="rounded object-contain"
          />
          <span className="text-sm font-semibold leading-none">Acasă</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/admin/dishes"
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              pathname === "/admin/dishes"
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Feluri de mâncare
          </Link>

          {loggedIn ? (
            <Link
              href="/admin/logout"
              className="rounded-md px-3 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700"
            >
              Deconectare
            </Link>
          ) : (
            <Link
              href="/admin/login"
              className="rounded-md px-3 py-2 text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800"
            >
              Autentificare
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
