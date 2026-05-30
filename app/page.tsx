"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Campaign = {
  id: string;
  title: string | null;
  campaign_name?: string | null;
  product_name: string | null;
  status: string | null;
  clicks: number | null;
  archived: boolean | null;
  created_at: string;
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
  const [topCampaign, setTopCampaign] = useState<Campaign | null>(null);

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

    setProductsCount(products || 0);
    setCustomersCount(customers || 0);
    setCampaignsCount(activeCampaigns.length);
    setClicksCount(totalClicks);

    setDraftCount(
      activeCampaigns.filter((campaign) => campaign.status === "مسودة").length
    );

    setScheduledCount(
      activeCampaigns.filter((campaign) => campaign.status === "scheduled")
        .length
    );

    setSentCount(
      activeCampaigns.filter((campaign) => campaign.status === "sent").length
    );

    setFailedCount(
      activeCampaigns.filter((campaign) => campaign.status === "failed").length
    );

setArchivedCount(archivedCampaigns.length);

const rate =
  activeCampaigns.length > 0
    ? Math.round(
        (
          activeCampaigns.filter(
            (campaign) =>
              campaign.status === "sent"
          ).length /
          activeCampaigns.length
        ) * 100
      )
    : 0;

setSuccessRate(rate);

setLatestCampaign(
  activeCampaigns[0] || null
);

setTopCampaign(
  [...activeCampaigns].sort(
    (a, b) =>
      (b.clicks || 0) -
      (a.clicks || 0)
  )[0] || null
);
    setLatestCampaign(activeCampaigns[0] || null);

    setTopCampaign(
      [...activeCampaigns].sort(
        (a, b) => (b.clicks || 0) - (a.clicks || 0)
      )[0] || null
    );
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold">لوحة التحكم الذكية</h1>

      <p className="mt-2 text-slate-600">
        متابعة النظام التسويقي بالكامل.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="المنتجات" value={productsCount} color="text-blue-600" />
        <StatCard title="العملاء" value={customersCount} color="text-green-600" />
        <StatCard title="الحملات النشطة" value={campaignsCount} color="text-purple-600" />
        <StatCard title="النقرات" value={clicksCount} color="text-orange-600" />
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-6 gap-6">
        <StatCard title="مجدولة" value={scheduledCount} color="text-blue-600" />
        <StatCard title="مرسلة" value={sentCount} color="text-green-600" />
        <StatCard title="فاشلة" value={failedCount} color="text-red-600" />
        <StatCard title="مؤرشفة" value={archivedCount} color="text-orange-600" />
      </div>
<StatCard
  title="معدل النجاح %"
  value={successRate}
  color="text-emerald-600"
/>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl border bg-white p-6">
          <h2 className="text-xl font-bold">آخر حملة</h2>

          {latestCampaign ? (
            <div className="mt-4">
              <p className="font-bold">
                {latestCampaign.title || latestCampaign.campaign_name}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                المنتج: {latestCampaign.product_name || "غير محدد"}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                الحالة: {latestCampaign.status || "مسودة"}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-slate-500">لا توجد حملات نشطة</p>
          )}
        </div>

        <div className="rounded-3xl border bg-white p-6">
          <h2 className="text-xl font-bold">أفضل حملة تفاعلًا</h2>

          {topCampaign ? (
            <div className="mt-4">
              <p className="font-bold">
                {topCampaign.title || topCampaign.campaign_name}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                عدد النقرات: {topCampaign.clicks || 0}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                المنتج: {topCampaign.product_name || "غير محدد"}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-slate-500">لا توجد بيانات</p>
          )}
        </div>
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