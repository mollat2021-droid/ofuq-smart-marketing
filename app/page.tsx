"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [productsCount, setProductsCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [campaignsCount, setCampaignsCount] = useState(0);
  const [clicksCount, setClicksCount] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [latestCampaign, setLatestCampaign] = useState<any>(null);
  const [topCampaign, setTopCampaign] = useState<any>(null);

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

    const campaigns = campaignsData || [];

    const totalClicks = campaigns.reduce(
      (sum, campaign) => sum + (campaign.clicks || 0),
      0
    );

    const scheduled = campaigns.filter(
      (campaign) => campaign.status === "scheduled"
    ).length;

    const failed = campaigns.filter(
      (campaign) => campaign.status === "failed"
    ).length;

    const latest = campaigns[0] || null;

    const top =
      [...campaigns].sort(
        (a, b) => (b.clicks || 0) - (a.clicks || 0)
      )[0] || null;

    setProductsCount(products || 0);
    setCustomersCount(customers || 0);
    setCampaignsCount(campaigns.length);
    setClicksCount(totalClicks);
    setScheduledCount(scheduled);
    setFailedCount(failed);
    setLatestCampaign(latest);
    setTopCampaign(top);
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
        <StatCard title="الحملات" value={campaignsCount} color="text-purple-600" />
        <StatCard title="النقرات" value={clicksCount} color="text-orange-600" />
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl border bg-white p-6">
          <h2 className="text-xl font-bold">حالات الحملات</h2>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span>Scheduled</span>
              <span className="font-bold text-blue-600">{scheduledCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Failed</span>
              <span className="font-bold text-red-600">{failedCount}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-6">
          <h2 className="text-xl font-bold">آخر حملة</h2>

          {latestCampaign ? (
            <div className="mt-4">
              <p className="font-bold">
                {latestCampaign.title || latestCampaign.campaign_name}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                {latestCampaign.product_name}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                الحالة: {latestCampaign.status || "draft"}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-slate-500">لا توجد حملات</p>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-3xl border bg-white p-6">
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
              المنتج: {topCampaign.product_name}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-slate-500">لا توجد بيانات</p>
        )}
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