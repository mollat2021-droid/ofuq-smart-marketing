"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Campaign = {
  id: string;
  title: string | null;
  product_name: string | null;
  customer_email: string | null;
  status: string | null;
  clicks: number | null;
  archived: boolean | null;
  created_at: string;
  scheduled_at: string | null;
};

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  scheduled: "مجدولة",
  sent: "مرسلة",
  failed: "فاشلة",
  sending: "قيد الإرسال",
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    campaigns: 0,
    clicks: 0,
    sent: 0,
    scheduled: 0,
    draft: 0,
    failed: 0,
    archived: 0,
    ctr: 0,
  });

  const [topCampaigns, setTopCampaigns] = useState<Campaign[]>([]);
  const [bestProduct, setBestProduct] = useState<string>("غير متوفر");
  const [bestCustomer, setBestCustomer] = useState<string>("غير متوفر");
  const [latestCampaign, setLatestCampaign] = useState<Campaign | null>(null);
  const [latestFailedCampaign, setLatestFailedCampaign] =
    useState<Campaign | null>(null);

  async function loadAnalytics() {
    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    if (!campaigns) return;

    const typedCampaigns = campaigns as Campaign[];

    const campaignsCount = typedCampaigns.length;

    const clicksCount = typedCampaigns.reduce(
      (sum, campaign) => sum + (campaign.clicks || 0),
      0
    );

    const sentCount = typedCampaigns.filter(
      (campaign) => campaign.status === "sent"
    ).length;

    const scheduledCount = typedCampaigns.filter(
      (campaign) => campaign.status === "scheduled"
    ).length;

    const draftCount = typedCampaigns.filter(
      (campaign) => campaign.status === "draft"
    ).length;

    const failedCount = typedCampaigns.filter(
      (campaign) => campaign.status === "failed"
    ).length;

    const archivedCount = typedCampaigns.filter(
      (campaign) => campaign.archived === true
    ).length;

    const ctr =
      campaignsCount > 0 ? Math.round((clicksCount / campaignsCount) * 100) : 0;

    setStats({
      campaigns: campaignsCount,
      clicks: clicksCount,
      sent: sentCount,
      scheduled: scheduledCount,
      draft: draftCount,
      failed: failedCount,
      archived: archivedCount,
      ctr,
    });

    const sortedByClicks = [...typedCampaigns].sort(
      (a, b) => (b.clicks || 0) - (a.clicks || 0)
    );

    setTopCampaigns(sortedByClicks.slice(0, 5));
    setLatestCampaign(typedCampaigns[0] || null);

    const failedCampaigns = typedCampaigns.filter(
      (campaign) => campaign.status === "failed"
    );
    setLatestFailedCampaign(failedCampaigns[0] || null);

    const productClicks: Record<string, number> = {};
    const customerClicks: Record<string, number> = {};

    typedCampaigns.forEach((campaign) => {
      const productName = campaign.product_name || "غير محدد";
      const customerEmail = campaign.customer_email || "غير محدد";
      const clicks = campaign.clicks || 0;

      productClicks[productName] = (productClicks[productName] || 0) + clicks;
      customerClicks[customerEmail] = (customerClicks[customerEmail] || 0) + clicks;
    });

    const topProduct = Object.entries(productClicks).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const topCustomer = Object.entries(customerClicks).sort(
      (a, b) => b[1] - a[1]
    )[0];

    setBestProduct(topProduct ? `${topProduct[0]} - ${topProduct[1]} نقرات` : "غير متوفر");
    setBestCustomer(
      topCustomer ? `${topCustomer[0]} - ${topCustomer[1]} نقرات` : "غير متوفر"
    );
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold">التقارير الذكية</h1>

      <div className="mt-8 grid gap-6 md:grid-cols-4">
        <Card title="الحملات" value={stats.campaigns} color="text-blue-600" />
        <Card title="النقرات" value={stats.clicks} color="text-green-600" />
        <Card title="المرسلة" value={stats.sent} color="text-purple-600" />
        <Card title="المجدولة" value={stats.scheduled} color="text-yellow-600" />
        <Card title="المسودات" value={stats.draft} color="text-slate-600" />
        <Card title="الفاشلة" value={stats.failed} color="text-red-600" />
        <Card title="المؤرشفة" value={stats.archived} color="text-gray-600" />
        <Card title="CTR" value={`${stats.ctr}%`} color="text-orange-600" />
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <InfoCard title="أفضل منتج أداءً" value={bestProduct} />
        <InfoCard title="أفضل عميل تفاعلًا" value={bestCustomer} />

        <InfoCard
          title="أحدث حملة"
          value={latestCampaign?.title || "لا توجد حملات"}
          description={
            latestCampaign
              ? `الحالة: ${
                  statusLabels[latestCampaign.status || ""] ||
                  latestCampaign.status ||
                  "غير محدد"
                }`
              : ""
          }
        />

        <InfoCard
          title="أحدث حملة فاشلة"
          value={latestFailedCampaign?.title || "لا توجد حملات فاشلة"}
          description={
            latestFailedCampaign
              ? `المنتج: ${latestFailedCampaign.product_name || "غير محدد"}`
              : ""
          }
        />
      </div>

      <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm border">
        <h2 className="text-2xl font-bold">أكثر الحملات تفاعلًا</h2>

        <div className="mt-6 grid gap-4">
          {topCampaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-2xl border p-4">
              <h3 className="font-bold">{campaign.title}</h3>

              <p className="mt-2 text-sm text-slate-500">
                المنتج: {campaign.product_name || "غير محدد"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                العميل: {campaign.customer_email || "غير محدد"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                النقرات: {campaign.clicks || 0}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                الحالة:{" "}
                {statusLabels[campaign.status || ""] ||
                  campaign.status ||
                  "غير محدد"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border">
      <p className="text-slate-500">{title}</p>

      <h2 className={`mt-4 text-4xl font-bold ${color}`}>{value}</h2>
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
    <div className="rounded-3xl bg-white p-6 shadow-sm border">
      <p className="text-slate-500">{title}</p>
      <h2 className="mt-4 text-xl font-bold">{value}</h2>

      {description ? (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}