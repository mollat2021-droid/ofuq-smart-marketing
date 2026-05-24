"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button
      onClick={logout}
      className="mt-6 w-full rounded-xl bg-red-600 px-4 py-3 text-white"
    >
      تسجيل الخروج
    </button>
  );
}