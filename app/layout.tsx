import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import LogoutButton from "@/components/LogoutButton";
import AutoSendWatcher from "@/components/AutoSendWatcher";

export const metadata = {
  title: "Ofuq Smart Marketing",
  description: "Smart Marketing Automation System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-slate-100 text-slate-900">
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
                  ["الرئيسية", "/"],
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
      </body>
    </html>
  );
}