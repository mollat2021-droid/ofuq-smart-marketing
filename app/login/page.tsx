"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login() {
    if (!email || !password) {
      alert("أدخل الإيميل وكلمة المرور");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("فشل تسجيل الدخول");
      console.log(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm border">
        <h1 className="text-3xl font-bold">تسجيل الدخول</h1>

        <p className="mt-2 text-slate-600">
          الدخول إلى Ofuq Smart Marketing
        </p>

        <div className="mt-8 grid gap-4">
          <input
            className="rounded-xl border p-4"
            placeholder="الإيميل"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="rounded-xl border p-4"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={login}
            className="rounded-xl bg-slate-900 px-5 py-4 text-white"
          >
            دخول
          </button>
        </div>
      </div>
    </main>
  );
}