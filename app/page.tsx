"use client";

import Link from "next/link";
import {
  BarChart3,
  Mail,
  MousePointerClick,
  Users,
  Send,
  Trophy,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import type { ReactNode } from "react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden px-6 py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-emerald-500/10" />

        <div className="relative mx-auto max-w-6xl text-center">
          <div className="mx-auto mb-6 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-blue-200">
            Ofuq Smart Marketing v1
          </div>

          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
            نظام تسويق ذكي لإدارة الحملات وتتبع النقرات وتحليل الأداء
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Ofuq Smart Marketing يساعدك على إدارة العملاء، إنشاء الحملات،
            الإرسال التلقائي، تتبع النقرات الحقيقية، وتحويل البيانات إلى قرارات
            تسويقية واضحة من لوحة واحدة.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="rounded-2xl bg-blue-600 px-8 py-4 font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700"
            >
              🚀 دخول النظام
            </Link>

            <Link
              href="/analytics"
              className="rounded-2xl border border-white/15 bg-white/5 px-8 py-4 font-bold text-white transition hover:bg-white/10"
            >
              📊 مشاهدة التقارير
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">كل ما تحتاجه لتسويق منظم</h2>
            <p className="mt-3 text-slate-400">
              من إدارة العملاء إلى قياس أفضل حملة وأفضل عميل وأفضل منتج.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Feature
              icon={<Mail />}
              title="Email Campaigns"
              text="إنشاء حملات بريدية مرتبطة بالمنتجات والعملاء."
            />

            <Feature
              icon={<Send />}
              title="Auto Send"
              text="إرسال تلقائي للحملات الجاهزة بدون متابعة يدوية مستمرة."
            />

            <Feature
              icon={<MousePointerClick />}
              title="Click Tracking"
              text="تسجيل كل نقرة حقيقية داخل Supabase وتحليلها."
            />

            <Feature
              icon={<BarChart3 />}
              title="Smart Analytics"
              text="تقارير ذكية تعرض أفضل الحملات والعملاء والمنتجات."
            />

            <Feature
              icon={<Users />}
              title="CRM"
              text="تنظيم العملاء وربطهم بالحملات والتفاعل."
            />

            <Feature
              icon={<ShieldCheck />}
              title="Stable Dashboard"
              text="لوحة تحكم محمية بتسجيل دخول وخروج."
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">نظرة حقيقية على لوحة Analytics</h2>
            <p className="mt-3 text-slate-400">
              تابع أفضل حملة، أفضل عميل، أفضل منتج، ومعدل النقر من لوحة واحدة.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl">
            <img
              src="/analytics-preview.png"
              alt="Ofuq Smart Marketing Analytics Dashboard"
              className="w-full rounded-2xl border border-white/10"
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-4">
          <StatBox title="Campaigns Sent" value="125+" />
          <StatBox title="Customers" value="540+" />
          <StatBox title="Real Clicks" value="2,430+" />
          <StatBox title="CTR" value="18.2%" />
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-3xl font-bold">كيف يعمل النظام؟</h2>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <Step
              number="1"
              title="أضف العملاء"
              text="أدخل بيانات العملاء أو استوردهم لاحقًا عبر CSV."
            />

            <Step
              number="2"
              title="أنشئ حملة"
              text="اختر المنتج والعميل واكتب الرسالة التسويقية."
            />

            <Step
              number="3"
              title="راقب النتائج"
              text="تابع النقرات، CTR، وأفضل أداء داخل Analytics."
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-blue-600 to-purple-700 p-10 shadow-2xl">
          <Trophy className="mx-auto mb-5 h-12 w-12" />

          <h2 className="text-3xl font-extrabold">
            جاهز لتحويل التسويق من عمل يدوي إلى نظام ذكي؟
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-blue-100">
            ابدأ باستخدام Ofuq Smart Marketing لإدارة الحملات وقياس الأداء من
            مكان واحد.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 font-bold text-blue-700 transition hover:bg-blue-50"
          >
            دخول النظام
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-slate-400">
        Ofuq Smart Marketing v1 — Built with Next.js + Supabase
      </footer>
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10">
      <div className="mb-5 inline-flex rounded-2xl bg-blue-600/20 p-3 text-blue-300">
        {icon}
      </div>

      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-3 leading-7 text-slate-400">{text}</p>
    </div>
  );
}

function StatBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
      <p className="text-sm text-slate-400">{title}</p>
      <h3 className="mt-3 text-3xl font-extrabold text-white">{value}</h3>
    </div>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-slate-900 p-6">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold">
        {number}
      </div>

      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-3 leading-7 text-slate-400">{text}</p>
    </div>
  );
}