import "./globals.css";
import AppShell from "@/components/AppShell";

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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}