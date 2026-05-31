"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Campaign = {
  id: string;
  title: string | null;
  campaign_name?: string | null;
  product_name: string | null;
  customer_email?: string | null;
  status: string | null;
  clicks: number | null;
  archived: boolean | null;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  scheduled: "مجدولة",
  sent: "مرسلة",
  failed: "فاشلة",
  sending: "قيد الإرسال",
};

export default function DashboardPage() {
  const [productsCount, setProductsCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [campaignsCount, setCampaignsCount] = useState(0);
  const [clicksCount, setClicksCount] = useState(0);

  const [draftCount, setDraftCount] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);
  const [successRate, setSuccessRate] = useState(0);

  const [latestCampaign, setLatestCampaign] = useState<Campaign | null>(null);
  const [latestFailedCampaign, setLatestFailedCampaign] =
    useState<Campaign | null>(null);
  const [topCampaign, setTopCampaign] = useState<Campaign | null>(null);
  const [bestProduct, setBestProduct] = useState("غير متوفر");
  const [bestCustomer, setBestCustomer] = useState("غير متوفر");

  async function loadDashboard() {
    const { count: products } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    const { count: customers } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true });

    const { data: campaignsData } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    const campaigns: Campaign[] = campaignsData || [];

    const activeCampaigns = campaigns.filter(
      (campaign) => campaign.archived !== true
    );

    const archivedCampaigns = campaigns.filter(
      (campaign) => campaign.archived === true
    );

    const totalClicks = activeCampaigns.reduce(
      (sum, campaign) => sum + (campaign.clicks || 0),
      0
    );

    const sent = activeCampaigns.filter(
      (campaign) => campaign.status === "sent"
    ).length;

    const failed = activeCampaigns.filter(
      (campaign) => campaign.status === "failed"
    ).length;

    const scheduled = activeCampaigns.filter(
      (campaign) => campaign.status === "scheduled"
    ).length;

    const drafts = activeCampaigns.filter(
      (campaign) => campaign.status === "draft"
    ).length;

    const rate =
      sent + failed > 0 ? Math.round((sent / (sent + failed)) * 100) : 0;

    const sortedByClicks = [...activeCampaigns].sort(
      (a, b) => (b.clicks || 0) - (a.clicks || 0)
    );

    const failedCampaigns = activeCampaigns.filter(
      (campaign) => campaign.status === "failed"
    );

    const productClicks: Record<string, number> = {};
    const customerClicks: Record<string, number> = {};

    activeCampaigns.forEach((campaign) => {
      const productName = campaign.product_name || "غير محدد";
      const customerEmail = campaign.customer_email || "غير محدد";
      const clicks = campaign.clicks || 0;

      productClicks[productName] = (productClicks[productName] || 0) + clicks;
      customerClicks[customerEmail] =
        (customerClicks[customerEmail] || 0) + clicks;
    });

    const topProduct = Object.entries(productClicks).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const topCustomer = Object.entries(customerClicks).sort(
      (a, b) => b[1] - a[1]
    )[0];

    setProductsCount(products || 0);
    setCustomersCount(customers || 0);
    setCampaignsCount(activeCampaigns.length);
    setClicksCount(totalClicks);

    setDraftCount(drafts);
    setScheduledCount(scheduled);
    setSentCount(sent);
    setFailedCount(failed);
    setArchivedCount(archivedCampaigns.length);
    setSuccessRate(rate);

    setLatestCampaign(activeCampaigns[0] || null);
    setLatestFailedCampaign(failedCampaigns[0] || null);
    setTopCampaign(sortedByClicks[0] || null);

    setBestProduct(
      topProduct ? `${topProduct[0]} - ${topProduct[1]} نقرات` : "غير متوفر"
    );

    setBestCustomer(
      topCustomer ? `${topCustomer[0]} - ${topCustomer[1]} نقرات` : "غير متوفر"
    );
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">لوحة التحكم الذكية</h1>
          <p className="mt-2 text-slate-600">
            متابعة النظام التسويقي بالكامل.
          </p>
        </div>

        <Link
          href="/analytics"
          className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
        >
          عرض التقارير
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatCard title="المنتجات" value={productsCount} color="text-blue-600" />
        <StatCard title="العملاء" value={customersCount} color="text-green-600" />
        <StatCard title="الحملات النشطة" value={campaignsCount} color="text-purple-600" />
        <StatCard title="النقرات" value={clicksCount} color="text-orange-600" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-6">
        <StatCard title="مسودات" value={draftCount} color="text-slate-600" />
        <StatCard title="مجدولة" value={scheduledCount} color="text-blue-600" />
        <StatCard title="مرسلة" value={sentCount} color="text-green-600" />
        <StatCard title="فاشلة" value={failedCount} color="text-red-600" />
        <StatCard title="مؤرشفة" value={archivedCount} color="text-orange-600" />
        <StatCard title="معدل النجاح %" value={successRate} color="text-emerald-600" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <InfoCard title="أفضل منتج أداءً" value={bestProduct} />
        <InfoCard title="أفضل عميل تفاعلًا" value={bestCustomer} />

        <InfoCard
          title="أفضل حملة تفاعلًا"
          value={topCampaign?.title || topCampaign?.campaign_name || "لا توجد بيانات"}
          description={
            topCampaign
              ? `النقرات: ${topCampaign.clicks || 0} | المنتج: ${
                  topCampaign.product_name || "غير محدد"
                }`
              : ""
          }
        />

        <InfoCard
          title="آخر حملة"
          value={
            latestCampaign?.title ||
            latestCampaign?.campaign_name ||
            "لا توجد حملات نشطة"
          }
          description={
            latestCampaign
              ? `الحالة: ${
                  statusLabels[latestCampaign.status || ""] ||
                  latestCampaign.status ||
                  "غير محدد"
                } | المنتج: ${latestCampaign.product_name || "غير محدد"}`
              : ""
          }
        />

        <InfoCard
          title="آخر حملة فاشلة"
          value={
            latestFailedCampaign?.title ||
            latestFailedCampaign?.campaign_name ||
            "لا توجد حملات فاشلة"
          }
          description={
            latestFailedCampaign
              ? `المنتج: ${latestFailedCampaign.product_name || "غير محدد"}`
              : ""
          }
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-3xl border bg-white p-6">
      <p className="text-slate-500">{title}</p>
      <h2 className={`mt-3 text-4xl font-bold ${color}`}>{value}</h2>
    </div>
  );
}

function InfoCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="rounded-3xl border bg-white p-6">
      <p className="text-slate-500">{title}</p>
      <h2 className="mt-3 text-xl font-bold">{value}</h2>

      {description ? (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}