"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    campaigns: 0,
    clicks: 0,
    sent: 0,
    failed: 0,
    ctr: 0,
  });

  const [topCampaigns, setTopCampaigns] = useState<any[]>([]);

  async function loadAnalytics() {
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("*");

    if (!campaigns) return;

    const campaignsCount = campaigns.length;

    const clicksCount = campaigns.reduce(
      (sum, c) => sum + (c.clicks || 0),
      0
    );

    const sentCount = campaigns.filter(
      (c) => c.status === "sent"
    ).length;

    const failedCount = campaigns.filter(
      (c) => c.status === "failed"
    ).length;

    const ctr =
      campaignsCount > 0
        ? Math.round((clicksCount / campaignsCount) * 100)
        : 0;

    setStats({
      campaigns: campaignsCount,
      clicks: clicksCount,
      sent: sentCount,
      failed: failedCount,
      ctr,
    });

    const sorted = [...campaigns].sort(
      (a, b) => (b.clicks || 0) - (a.clicks || 0)
    );

    setTopCampaigns(sorted.slice(0, 5));
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold">التقارير الذكية</h1>

      <div className="mt-8 grid gap-6 md:grid-cols-5">
        <Card title="الحملات" value={stats.campaigns} color="text-blue-600" />
        <Card title="النقرات" value={stats.clicks} color="text-green-600" />
        <Card title="المرسلة" value={stats.sent} color="text-purple-600" />
        <Card title="الفاشلة" value={stats.failed} color="text-red-600" />
        <Card title="CTR" value={`${stats.ctr}%`} color="text-orange-600" />
      </div>

      <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm border">
        <h2 className="text-2xl font-bold">
          أكثر الحملات تفاعلًا
        </h2>

        <div className="mt-6 grid gap-4">
          {topCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="rounded-2xl border p-4"
            >
              <h3 className="font-bold">
                {campaign.title}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                النقرات: {campaign.clicks || 0}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                الحالة: {campaign.status}
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
  value: any;
  color: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border">
      <p className="text-slate-500">{title}</p>

      <h2 className={`mt-4 text-4xl font-bold ${color}`}>
        {value}
      </h2>
    </div>
  );
}