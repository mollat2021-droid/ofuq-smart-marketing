"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import LogoutButton from "@/components/LogoutButton";
import AutoSendWatcher from "@/components/AutoSendWatcher";
import { supabase } from "@/lib/supabase";

const publicPages = ["/", "/landing", "/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("User");

  const isPublicPage = publicPages.includes(pathname);

  useEffect(() => {
    async function loadUser() {
      if (isPublicPage) return;

      const { data } = await supabase.auth.getUser();

      const user = data.user;

      if (user) {
        setUserEmail(user.email || "");
        setUserName(
          user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "User"
        );
      }
    }

    loadUser();
  }, [isPublicPage]);

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      <AutoSendWatcher />

      <div className="flex min-h-screen">
        <aside className="w-72 bg-slate-900 text-white flex flex-col p-6">
          <div>
            <h1 className="text-3xl font-bold">Ofuq Smart</h1>

            <p className="mt-2 text-sm text-slate-400">
              Marketing Dashboard
            </p>
          </div>

          <nav className="mt-10 space-y-3">
            {[
              ["الرئيسية", "/dashboard"],
              ["المنتجات", "/products"],
              ["العملاء", "/customers"],
              ["الحملات", "/campaigns"],
              ["الأرشيف", "/archived-campaigns"],
              ["التقارير", "/analytics"],
            ].map(([item, href]) => (
              <a
                key={item}
                href={href}
                className="block rounded-xl px-4 py-3 hover:bg-slate-800 transition"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="mt-auto">
            <div className="mb-4 rounded-2xl bg-slate-800 p-4">
              <p className="text-sm font-bold text-white">👤 {userName}</p>

              <p className="mt-1 break-all text-xs text-slate-400">
                📧 {userEmail || "لا يوجد بريد"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800 p-5">
              <p className="text-sm text-slate-400">
                Ofuq Smart Marketing v1
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Protected Dashboard
              </p>
            </div>

            <LogoutButton />
          </div>
        </aside>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </AuthGuard>
  );
}